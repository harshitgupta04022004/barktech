import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';

export class UserService {
  async listUsers(filters: { page?: number; limit?: number; role?: string; isActive?: boolean }) {
    return userRepository.findAll(filters);
  }

  async getUser(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(id: string, data: { name?: string; email?: string }) {
    const user = await userRepository.update(id, data);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async changeUserRole(id: string, role: string) {
    const validRoles = ['super_admin', 'admin', 'sales', 'support', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    const user = await userRepository.updateRole(id, role);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async deactivateUser(id: string) {
    const user = await userRepository.deactivate(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async getUsersByRole(role: string) {
    return userRepository.findByRole(role);
  }
}

export const userService = new UserService();
