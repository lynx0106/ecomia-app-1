import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/agents/admin';

/**
 * Verificar si un usuario es superadmin en el servidor
 */
export async function isUserAdmin(userId?: string, email?: string | null): Promise<boolean> {
  if (!email) return false;
  
  // Verificar si es superadmin por email
  if (isSuperAdmin(email)) {
    return true;
  }

  // Verificar si tiene rol admin en tabla user_roles
  if (!userId) return false;
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .or(`user_id.eq.${userId},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return data?.role === 'admin';
  } catch (e) {
    return false;
  }
}

/**
 * Verificar que el usuario tiene una sesión de investigación ACTIVA
 * (no completada, no archivada)
 */
/**
 * Operación de cupo: superadmin por SUPERADMIN_EMAIL o fila admin en user_roles.
 */
export async function requireOperationsAdmin(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (isSuperAdmin(user.email)) {
    return { id: user.id, email: user.email || '' };
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || data?.role !== 'admin') return null;
  return { id: user.id, email: user.email || '' };
}

export async function hasActiveResearchSession(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('research_sessions')
      .select('id')
      .eq('user_id', userId)
      .neq('status', 'completed') // No completa
      .neq('status', 'archived') // No archivada
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return Boolean(data?.id);
  } catch (e) {
    return false;
  }
}
