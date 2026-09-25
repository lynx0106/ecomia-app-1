export function isSuperAdmin(email?: string | null) {
  const expected = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(expected && email && email.toLowerCase() === expected);
}

export function isAdminRole(role?: string | null) {
  return role === 'admin';
}