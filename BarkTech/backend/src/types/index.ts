import { FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  scopes?: string[];
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

export type UserRole = 'super_admin' | 'admin' | 'sales' | 'support' | 'viewer';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
