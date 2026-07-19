import { User, IUser } from '../models/user.js';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+passwordHash');
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async findOrCreateByGoogle(data: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<IUser> {
    let user = await User.findOne({ googleId: data.googleId });
    if (user) {
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }

    user = await User.findOne({ email: data.email });
    if (user) {
      user.googleId = data.googleId;
      if (data.avatarUrl && !user.avatarUrl) {
        user.avatarUrl = data.avatarUrl;
      }
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }

    user = await User.create({
      email: data.email,
      passwordHash: '__oauth_no_password__',
      fullName: data.fullName,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl,
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    return user;
  }

  async findByEmailWithPassword(identifier: string): Promise<IUser | null> {
    if (identifier.includes('@')) {
      return User.findOne({ email: identifier }).select('+passwordHash');
    }
    return User.findById(identifier).select('+passwordHash');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(data: { email: string; password: string; fullName?: string; name?: string; role?: string }): Promise<IUser> {
    const userData = {
      email: data.email,
      passwordHash: data.password,
      fullName: data.fullName || data.name || data.email.split('@')[0],
      role: data.role || 'client',
    };
    return User.create(userData);
  }

  async update(id: string, data: { name?: string; email?: string }): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(id, { passwordHash: hashedPassword });
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async findAll(
    filters: { page?: number; limit?: number; role?: string; isActive?: boolean } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const { page = 1, limit = 20, role, isActive } = filters;
    const query: Record<string, any> = {};

    if (role) query.roleId = role;
    if (isActive !== undefined) query.isActive = isActive;

    const [users, total] = await Promise.all([
      User.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    return { users, total };
  }

  async updateRole(id: string, role: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { role }, { new: true });
  }

  async deactivate(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async findByRole(role: string): Promise<IUser[]> {
    return User.find({ roleId: role, isActive: true }).sort({ fullName: 1 });
  }
}

export const userRepository = new UserRepository();
