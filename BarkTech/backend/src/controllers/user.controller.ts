import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service.js';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'sales', 'support', 'viewer']),
});

export class UserController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, role, isActive } = request.query as any;
    const result = await userService.listUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    return reply.send({
      success: true,
      data: result.users,
      meta: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await userService.getUser(id);
    return reply.send({ success: true, data: user });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = updateUserSchema.parse(request.body);
    const user = await userService.updateUser(id, body);
    return reply.send({ success: true, data: user });
  }

  async updateRole(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = updateRoleSchema.parse(request.body);
    const user = await userService.changeUserRole(id, body.role);
    return reply.send({ success: true, data: user });
  }

  async deactivate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await userService.deactivateUser(id);
    return reply.send({ success: true, data: user, message: 'User deactivated' });
  }
}

export const userController = new UserController();
