import { createClient, createServiceClient } from '@/lib/supabase/server';
import { executeMultiAgentWorkflow } from '@/lib/agents/multi-agent-workflow';
import { rateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { allowsChatTurn, handleMultiMode, loadOrCreateAllocation } from '@/lib/chat/research-quota';
import { productWriterFromSupabase, quotaStoreFromSupabase } from '@/lib/chat/supabase-stores';
import type { AgentState } from '@/lib/agents/types';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

type IncomingMessage = { role?: string; content?: string; parts?: Array<{ text?: string; content?: string }> };

function normalizeMessages(messages: IncomingMessage[]) {
  return messages.map((message) => {
    if (Array.isArray(message.parts)) {
      const content = message.parts.map((part) => part.text || part.content || '').join('');
      return { role: message.role || 'user', content };
    }
    return { role: message.role || 'user', content: message.content || '' };
  });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

/**
 * Único chat del MVP: mode=multi.
 * El streamText legacy y el modo support están apagados.
 * El cupo se revisa aquí, antes de llamar al modelo. Se descuenta al persistir la investigación.
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'main';
    const body = await req.json().catch(() => null);
    const rawMessages = body && Array.isArray(body.messages) ? body.messages as IncomingMessage[] : [];
    const existingState = body?.state as AgentState | undefined;

    if (!rawMessages.length) {
      return json({ error: 'Por favor, envia un mensaje para continuar.' }, 400);
    }

    const messages = normalizeMessages(rawMessages).filter((message) => message.content.trim());
    if (!messages.length) {
      return json({ error: 'Por favor, envia un mensaje para continuar.' }, 400);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const limit = await rateLimit(req as NextRequest, RATE_LIMITS.CHAT, user.id);
    if (!limit.allowed) {
      return createRateLimitResponse(limit.resetAt);
    }

    const service = createServiceClient();
    const quota = quotaStoreFromSupabase(service);
    const writer = productWriterFromSupabase(service);

    if (mode !== 'multi') {
      try {
        const allocation = await loadOrCreateAllocation(quota, user.id);
        if (!allowsChatTurn(allocation, existingState)) {
          return json({
            error: 'Sin investigaciones disponibles',
            message: 'Agotaste las investigaciones incluidas. Un operador puede sumar cupo; cada investigación guardada cuenta como un uso.',
            remaining: 0,
          }, 403);
        }
      } catch (error) {
        console.error('/api/chat quota:', error);
        return json({ error: 'No se pudo leer el cupo.' }, 500);
      }
      return json({
        error: 'Ese modo de chat está apagado. La investigación vive en mode=multi.',
      }, 410);
    }

    if (!process.env.XAI_API_KEY) {
      return json({ error: 'XAI_API_KEY no configurada en el servidor.' }, 500);
    }

    const outcome = await handleMultiMode({
      userId: user.id,
      messages,
      state: existingState,
      quota,
      writer,
      runWorkflow: async (workflowMessages, userId, state) => {
        const result = await executeMultiAgentWorkflow(workflowMessages, userId, state);
        return {
          content: result.content,
          state: result.state,
          hasMore: result.hasMore,
        };
      },
    });

    return json(outcome.body, outcome.status);
  } catch (error) {
    console.error('/api/chat:', error);
    const message = error instanceof Error ? error.message : 'Error en el chat';
    return json({ error: message }, 500);
  }
}
