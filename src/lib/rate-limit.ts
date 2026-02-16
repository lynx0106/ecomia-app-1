import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests permitidos
  identifier: 'ip' | 'user' | 'both'; // Identificador
}

// Store de rate limits en memoria (en producción usar Vercel KV o Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Middleware de rate limiting
 * En producción, considerar usar Vercel KV o Upstash Redis para múltiples instancias
 * 
 * @param request - NextRequest object
 * @param config - Configuración del rate limit
 * @param userId - ID del usuario (opcional)
 * @returns Objeto con allowed, limit, remaining, resetAt
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests, identifier } = config;

  // Obtener identificador único
  let key: string;
  if (identifier === 'ip') {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    key = `ip:${ip}`;
  } else if (identifier === 'user') {
    key = `user:${userId || 'anonymous'}`;
  } else {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    key = `both:${userId || 'anonymous'}:${ip}`;
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Si no existe o expiró, crear nuevo registro
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Si ya alcanzó el límite
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Incrementar contador
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Crear respuesta HTTP de rate limit excedido
 */
export function createRateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}

/**
 * Limpiar registros expirados (ejecutar periódicamente)
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpiar cada 5 minutos en servidor
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const RATE_LIMITS = {
  // Endpoints de pago: 5 requests por minuto por usuario
  PAYMENT: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    identifier: 'user' as const,
  },
  // APIs de chat: 20 requests por minuto por usuario
  CHAT: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    identifier: 'user' as const,
  },
  // Endpoints públicos: 100 requests por minuto por IP
  PUBLIC: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    identifier: 'ip' as const,
  },
  // Agentes: 10 requests por minuto por usuario
  AGENTS: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    identifier: 'user' as const,
  },
} as const;
