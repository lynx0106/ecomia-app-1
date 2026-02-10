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
