/**
 * Caché en memoria para access tokens de MercadoPago
 * Evita llamadas repetidas a la API para obtener tokens
 */

interface CacheEntry {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CacheEntry>();

/**
 * Obtener token del caché
 */
export function getCachedToken(storeId: string): string | null {
  const entry = tokenCache.get(storeId);
  
  if (!entry) {
    return null;
  }

  // Verificar si el token expiró
  if (Date.now() > entry.expiresAt) {
    tokenCache.delete(storeId);
    return null;
  }

  return entry.token;
}

/**
 * Guardar token en caché
 * 
 * @param storeId - ID de la tienda
 * @param token - Access token de MercadoPago
 * @param expiresInSeconds - Tiempo de expiración en segundos (default: 1 hora)
 */
export function cacheToken(
  storeId: string,
  token: string,
  expiresInSeconds: number = 3600
): void {
  const expiresAt = Date.now() + (expiresInSeconds * 1000);
  
  tokenCache.set(storeId, {
    token,
    expiresAt,
  });

  console.log(`[TokenCache] Token cached for store ${storeId}`);
}

/**
 * Limpiar caché de un store específico
 */
export function invalidateToken(storeId: string): void {
  tokenCache.delete(storeId);
  console.log(`[TokenCache] Token invalidated for store ${storeId}`);
}

/**
 * Limpiar todo el caché
 */
export function clearCache(): void {
  tokenCache.clear();
  console.log('[TokenCache] All tokens cleared');
}

/**
 * Limpiar tokens expirados periódicamente
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [storeId, entry] of tokenCache.entries()) {
    if (now > entry.expiresAt) {
      tokenCache.delete(storeId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[TokenCache] Cleaned ${cleaned} expired tokens`);
  }
}

/**
 * Configurar limpieza automática cada 5 minutos
 */
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
}

/**
 * Obtener o crear token con fallback a función de recuperación
 */
export async function getOrFetchToken(
  storeId: string,
  fetchTokenFn: () => Promise<string>
): Promise<string> {
  // Intentar obtener del caché
  const cached = getCachedToken(storeId);
  if (cached) {
    console.log(`[TokenCache] Using cached token for store ${storeId}`);
    return cached;
  }

  // Obtener nuevo token
  console.log(`[TokenCache] Fetching new token for store ${storeId}`);
  const token = await fetchTokenFn();
  
  // Guardar en caché
  cacheToken(storeId, token);
  
  return token;
}
