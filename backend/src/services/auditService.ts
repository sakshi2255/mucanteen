import type { AuditLog } from '../models/types.js';

export function createAuditLogPayload(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  canteenId?: string | null;
  description: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  source?: 'client' | 'function' | 'system';
}): AuditLog {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const logId = `log_${Date.now()}_${randomSuffix}`;

  return {
    audit_log_id: logId,
    actor_id: params.actorId,
    actor_name_snapshot: params.actorName,
    actor_role: params.actorRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    canteen_id: params.canteenId ?? null,
    description: params.description,
    before_data: params.beforeData ?? null,
    after_data: params.afterData ?? null,
    timestamp,
    source: params.source ?? 'function',
  };
}
