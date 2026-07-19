import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  fullName: z.string().min(2).optional(),
  role: z.enum(['super_admin', 'admin', 'client']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    const user = await authService.register(body);

    const token = request.server.jwt.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({ success: true, data: { user, token } });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(request.body);
    const user = await authService.login(email, password);

    const token = request.server.jwt.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return reply.send({ success: true, data: { user, token } });
  }

  async profile(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const profile = await authService.getProfile(user.sub);
    return reply.send({ success: true, data: profile });
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const body = updateProfileSchema.parse(request.body);
    const updated = await authService.updateProfile(user.sub, body);
    return reply.send({ success: true, data: updated });
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const body = changePasswordSchema.parse(request.body);
    await authService.changePassword(user.sub, body.currentPassword, body.newPassword);
    return reply.send({ success: true, message: 'Password updated successfully' });
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = forgotPasswordSchema.parse(request.body);
    // Always return success to prevent email enumeration
    await authService.forgotPassword(email).catch(() => {});
    return reply.send({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(body.token, body.password);
    return reply.send({ success: true, message: 'Password reset successfully' });
  }

  async googleCallback(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.query as { code?: string };
    if (!code) {
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login?error=missing_code`);
    }

    try {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
        throw new Error('Google OAuth not configured');
      }

      const user = await authService.googleOAuth(
        code,
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_CALLBACK_URL,
      );

      const token = request.server.jwt.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const params = new URLSearchParams({
        token,
        user: JSON.stringify(user),
      });

      return reply.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (err: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/admin/login?error=${encodeURIComponent(err.message || 'google_auth_failed')}`);
    }
  }

  async googleTokenLogin(request: FastifyRequest, reply: FastifyReply) {
    const body = z.object({ credential: z.string() }).parse(request.body);

    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google OAuth not configured', 500);
    }

    const user = await authService.googleIdTokenLogin(body.credential, env.GOOGLE_CLIENT_ID);

    const token = request.server.jwt.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return reply.send({ success: true, data: { user, token } });
  }
}

export const authController = new AuthController();
