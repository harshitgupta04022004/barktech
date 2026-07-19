import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/errors.js';
import type { IAuditLog } from '../models/auditLog.js';

export class AuditService {
  async logAction(data: {
    userId?: string;
    action: IAuditLog['action'];
    resource: string;
    resourceId?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    ip?: string;
    userAgent?: string;
  }) {
    return auditRepository.create({
      ...data,
      userId: data.userId ? (data.userId as any) : undefined,
    });
  }

  async getAuditLogs(filters: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return auditRepository.findAll(filters);
  }

  async getAuditStats() {
    return auditRepository.getStats();
  }

  async exportLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { logs } = await auditRepository.findAll({ ...filters, limit: 10000 });
    return logs;
  }
}

export const auditService = new AuditService();
