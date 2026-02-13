/**
 * Shared utility functions for form data handling and type conversions
 */

/**
 * Safely extracts a string value, returns empty string if not a string
 */
export function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Safely extracts a number value, returns null if not a valid number
 */
export function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Safely extracts a boolean value, defaults to false if not boolean
 */
export function getBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

/**
 * Safely extracts an object, returns empty object if not an object
 */
export function getObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Currency formatter for COP (Colombian Pesos)
 */
export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}
