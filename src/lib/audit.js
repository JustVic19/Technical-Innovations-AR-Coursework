import { AuditLog } from '@/api/entities';

export async function logAudit({ actor, actor_role, action, target_type, target_id, details, severity = 'info' }) {
  try {
    await AuditLog.create({
      actor: actor || 'system',
      actor_role: actor_role || 'unknown',
      action,
      target_type,
      target_id,
      details,
      severity,
      ip_address: 'web-client',
      device_id: (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 40) : 'unknown'),
    });
  } catch (e) {
    console.warn('audit log failed', e);
  }
}