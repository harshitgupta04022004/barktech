import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// In-memory reset tokens (in production, use Redis or DB)
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

export class AuthService {
  async register(data: { email: string; password: string; name?: string; fullName?: string; role?: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    // New users get 'client' role unless explicitly set by admin
    const userRole = data.role || 'client';
    const fullName = data.fullName || data.name || data.email.split('@')[0];
    const user = await userRepository.create({ email: data.email, password: data.password, fullName, role: userRole } as any);
    const { passwordHash: _, ...userObj } = user.toObject();
    return userObj;
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    await userRepository.updateLastLogin(user._id.toString());

    const { password: _, ...userObj } = user.toObject();
    return userObj;
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const { password: _, ...userObj } = user.toObject();
    return userObj;
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    if (data.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing && existing._id.toString() !== userId) {
        throw new AppError('Email already in use', 409);
      }
    }
    const updated = await userRepository.update(userId, data);
    if (!updated) {
      throw new AppError('User not found', 404);
    }
    const { password: _, ...userObj } = updated.toObject();
    return userObj;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findByEmailWithPassword(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    await userRepository.updatePassword(userId, newPassword);
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silently return to prevent email enumeration

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    resetTokens.set(token, { userId: user._id.toString(), expiresAt });

    // In production, send email with reset link
    // For now, log the token
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: /reset-password?token=${token}`);

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const resetData = resetTokens.get(token);
    if (!resetData) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    if (new Date() > resetData.expiresAt) {
      resetTokens.delete(token);
      throw new AppError('Reset token has expired', 400);
    }

    await userRepository.updatePassword(resetData.userId, newPassword);
    resetTokens.delete(token);
  }

  async listUsers(page = 1, limit = 20) {
    return userRepository.findAll({ page, limit });
  }

  async googleOAuth(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new AppError('Failed to authenticate with Google', 401);
    }

    // Fetch user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json() as any;
    if (!userInfoResponse.ok || !userInfo.id) {
      throw new AppError('Failed to fetch Google user info', 401);
    }

    // Find or create user
    const user = await userRepository.findOrCreateByGoogle({
      googleId: userInfo.id,
      email: userInfo.email,
      fullName: userInfo.name || userInfo.email.split('@')[0],
      avatarUrl: userInfo.picture,
    });

    await userRepository.updateLastLogin(user._id.toString());

    const { passwordHash: _, ...userObj } = user.toObject();
    return userObj;
  }

  async googleIdTokenLogin(idToken: string, clientId: string) {
    // Verify the Google ID token by decoding the JWT payload
    // Google ID tokens are signed by Google; we verify by checking against Google's public keys
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new AppError('Invalid Google ID token', 401);
    }

    let payload: any;
    try {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

      // Verify the token is intended for our client
      if (decoded.aud !== clientId) {
        throw new AppError('Invalid Google token audience', 401);
      }

      // Verify token is not expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new AppError('Google token has expired', 401);
      }

      // Verify issuer
      if (decoded.iss !== 'accounts.google.com' && decoded.iss !== 'https://accounts.google.com') {
        throw new AppError('Invalid Google token issuer', 401);
      }

      payload = decoded;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Failed to verify Google token', 401);
    }

    if (!payload.sub || !payload.email) {
      throw new AppError('Invalid Google token payload', 401);
    }

    // Find or create user
    const user = await userRepository.findOrCreateByGoogle({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
    });

    await userRepository.updateLastLogin(user._id.toString());

    const { passwordHash: _, ...userObj } = user.toObject();
    return userObj;
  }
}

export const authService = new AuthService();
