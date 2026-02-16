import { createServiceClient } from '@/lib/supabase/server';

export type AuditAction = 
  | 'create_landing'
  | 'update_landing'
  | 'delete_landing'
  | 'publish_landing'
  | 'create_store'
  | 'update_store'
  | 'delete_store'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'login'
  | 'failed_login'
  | 'logout'
  | 'export_data'
  | 'update_settings'
  | 'change_password'
  | 'api_key_created'
  | 'api_key_deleted'
  | 'bulk_action';

export type AuditEntityType = 
  | 'landing_page'
  | 'store'
  | 'product'
  | 'payment'
  | 'user'
  | 'api_key'
  | 'research_session';

export type AuditStatus = 'success' | 'error' | 'failed_auth' | 'warning';

interface AuditLogEntry {
  user_id?: string;
  user_email?: string;
  action: AuditAction;
  entity_type?: AuditEntityType;
  entity_id?: string;
  changes?: {
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  };
  ip_address?: string;
  user_agent?: string;
  status?: AuditStatus;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra una acción en el audit log
 * 
 * Uso:
 * ```
 * await auditLog({
 *   user_id: user.id,
 *   action: 'create_landing',
 *   entity_type: 'landing_page',
 *   entity_id: landing.id,
 *   changes: {
 *     new_values: { title: 'Mi Landing', status: 'draft' }
 *   },
 *   status: 'success'
 * });
 * ```
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient();

    const logEntry = {
      user_id: entry.user_id,
      user_email: entry.user_email,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      changes: entry.changes,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      status: entry.status || 'success',
      error_message: entry.error_message,
      metadata: entry.metadata,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([logEntry]);

    if (error) {
      console.error('[AuditLog] Error registering audit log:', error);
      // No lanzamos error porque la auditoría no debe romper funcionalidad
    } else {
      console.log(`[AuditLog] ${entry.action} by ${entry.user_email || 'system'}`);
    }
  } catch (error) {
    console.error('[AuditLog] Unexpected error:', error);
  }
}

/**
 * Registra una acción crítica de seguridad
 * Útil para logins, cambios de contraseña, etc
 */
export async function auditSecurityEvent(
  userId: string,
  userEmail: string,
  action: 'login' | 'logout' | 'failed_login' | 'change_password' | 'api_key_created' | 'api_key_deleted',
  ipAddress: string,
  userAgent: string,
  status: AuditStatus = 'success',
  metadata?: Record<string, any>
): Promise<void> {
  return auditLog({
    user_id: userId,
    user_email: userEmail,
    action,
    ip_address: ipAddress,
    user_agent: userAgent,
    status,
    metadata,
  });
}

/**
 * Registra una acción de pago
 */
export async function auditPaymentEvent(
  userId: string,
  userEmail: string,
  action: 'payment_initiated' | 'payment_completed' | 'payment_failed',
  paymentId: string,
  amount: number,
  status: AuditStatus,
  metadata?: Record<string, any>
): Promise<void> {
  return auditLog({
    user_id: userId,
    user_email: userEmail,
    action,
    entity_type: 'payment',
    entity_id: paymentId,
    status,
    metadata: {
      amount,
      ...metadata,
    },
  });
}

/**
 * Registra cambios en una entidad (landing, store, product)
 */
export async function auditEntityChange(
  userId: string,
  userEmail: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  status: AuditStatus = 'success'
): Promise<void> {
  return auditLog({
    user_id: userId,
    user_email: userEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes: {
      old_values: oldValues,
      new_values: newValues,
    },
    status,
  });
}

/**
 * Extrae IP y User-Agent de un Request
 */
export function extractRequestInfo(request: Request): {
  ip_address: string;
  user_agent: string;
} {
  const headers = request.headers;
  
  const ip_address = 
    (headers.get('x-forwarded-for') || 
     headers.get('x-real-ip') || 
     'unknown') as string;
  
  const user_agent = (headers.get('user-agent') || 'unknown') as string;

  return { ip_address, user_agent };
}
