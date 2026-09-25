import type { AgentState } from '@/lib/agents/types';

/** Cupo incluido al crear la fila del plan. Una investigación persistida = un uso. */
export const PLAN_INCLUDED_SEARCHES = 10;

export type AllocationRow = {
  allocated_count: number;
  used_count: number;
};

export type QuotaStore = {
  getAllocation(userId: string): Promise<AllocationRow | null>;
  insertAllocation(userId: string, allocatedCount: number): Promise<void>;
  consume(userId: string): Promise<{ ok: true; used: number; allocated: number } | { ok: false }>;
  refund(userId: string): Promise<void>;
};

export type ResearchSessionInsert = {
  user_id: string;
  goal: string;
  status: 'proposed';
  notes: string;
};

export type LandingInsert = {
  user_id: string;
  title: string;
  slug: string;
  status: 'draft';
  store_id: null;
  content: {
    hero: { title: string; subtitle: string; cta: string };
    checkout: { price_cop: number | null; enabled: false; product_name: string };
  };
};

export type ProductWriter = {
  insertResearchSession(row: ResearchSessionInsert): Promise<{ id: string }>;
  insertLanding(row: LandingInsert): Promise<{ id: string; slug: string }>;
};

export type WorkflowResult = {
  content: string;
  state: AgentState;
  hasMore: boolean;
};

type ChatMessage = { role: string; content: string };

export function remainingSearches(row: AllocationRow) {
  return Math.max(0, row.allocated_count - row.used_count);
}

/**
 * Quien no tiene fila recibe la del plan. El 403 solo aplica si el cupo ya se gastó
 * y este mensaje no continúa una investigación ya descontada.
 */
export async function loadOrCreateAllocation(store: QuotaStore, userId: string): Promise<AllocationRow> {
  const existing = await store.getAllocation(userId);
  if (existing) return existing;
  await store.insertAllocation(userId, PLAN_INCLUDED_SEARCHES);
  return { allocated_count: PLAN_INCLUDED_SEARCHES, used_count: 0 };
}

export function allowsChatTurn(row: AllocationRow, state?: { researchSessionId?: string } | null) {
  if (state?.researchSessionId) return true;
  return remainingSearches(row) > 0;
}

export function extractPriceCop(text: string): number | null {
  if (!text) return null;
  const pattern = /(?:pvp|precio|price|cop|\$)\s*[:|]?\s*\$?\s*(\d{1,3}(?:[.\s]\d{3})+|\d{4,})/gi;
  const found: number[] = [];
  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1].replace(/[.\s]/g, ''));
    if (Number.isFinite(value) && value >= 1000 && value <= 50_000_000) {
      found.push(value);
    }
  }
  return found.length > 0 ? found[found.length - 1] : null;
}

function labeledLine(text: string, label: string) {
  const match = text.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, 'i'));
  return match?.[1]?.replace(/\*+/g, '').trim() || '';
}

export function extractHero(text: string, fallbackTitle: string) {
  const title = labeledLine(text, 'Title') || fallbackTitle || 'Oferta';
  const subtitle = labeledLine(text, 'Subtitle');
  const cta = labeledLine(text, 'CTA Button') || 'Comprar ahora';
  return { title: title.slice(0, 140), subtitle: subtitle.slice(0, 240), cta: cta.slice(0, 60) };
}

export function slugifyOffer(title: string, suffix: string) {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'oferta';
  const extra = suffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'oferta';
  return `${base}-${extra}`;
}

function messageBlob(messages: ChatMessage[], state: AgentState) {
  const fromChat = messages.map((message) => message.content || '').join('\n');
  const fromSourcing = state.sourcingResult?.productDescription || '';
  return `${fromChat}\n${fromSourcing}`;
}

export async function persistClosedWorkflow(input: {
  userId: string;
  messages: ChatMessage[];
  previous?: AgentState | null;
  result: WorkflowResult;
  quota: QuotaStore;
  writer: ProductWriter;
  slugSuffix?: string;
}): Promise<{ state: AgentState; content: string; consumed: boolean }> {
  let state: AgentState = { ...input.result.state };
  let content = input.result.content;
  let consumed = false;

  const sourcingJustClosed = Boolean(state.sourcingResult) && !input.previous?.researchSessionId && !state.researchSessionId;
  if (sourcingJustClosed) {
    const consumedRow = await input.quota.consume(input.userId);
    if (!consumedRow.ok) {
      const error = new Error('SIN_CUPO');
      throw error;
    }
    consumed = true;
    const goal = (state.sourcingResult?.productName || state.userIntention || 'Investigación').slice(0, 500);
    try {
      const session = await input.writer.insertResearchSession({
        user_id: input.userId,
        goal,
        status: 'proposed',
        notes: (state.sourcingResult?.productDescription || content).slice(0, 2000),
      });
      state = { ...state, researchSessionId: session.id };
    } catch (error) {
      await input.quota.refund(input.userId);
      throw error;
    }
  }

  const landingJustClosed = (state.previousSteps || []).includes('landing')
    && Boolean(state.landingResult)
    && !input.previous?.landingPageId
    && !state.landingPageId;

  if (landingJustClosed) {
    const productName = state.sourcingResult?.productName || state.userIntention || 'Oferta';
    const hero = extractHero(content, productName);
    const priceCop = extractPriceCop(messageBlob(input.messages, state));
    const landing = await input.writer.insertLanding({
      user_id: input.userId,
      title: hero.title,
      slug: slugifyOffer(hero.title, input.slugSuffix || Math.random().toString(36).slice(2, 8)),
      status: 'draft',
      store_id: null,
      content: {
        hero,
        checkout: {
          price_cop: priceCop,
          enabled: false,
          product_name: productName.slice(0, 140),
        },
      },
    });
    state = { ...state, landingPageId: landing.id, landingSlug: landing.slug };
    content += `\n\nLa landing quedó en borrador. Edita precio y token, y publícala en /landing/${landing.id}.`;
  }

  return { state, content, consumed };
}

export async function handleMultiMode(input: {
  userId: string;
  messages: ChatMessage[];
  state?: AgentState | null;
  quota: QuotaStore;
  writer: ProductWriter;
  runWorkflow: (messages: ChatMessage[], userId: string, state?: AgentState) => Promise<WorkflowResult>;
  slugSuffix?: string;
}): Promise<
  | { status: 200; body: { content: string; state: AgentState; hasMore: boolean } }
  | { status: 403; body: { error: string; message: string; remaining: 0 } }
  | { status: 500; body: { error: string } }
> {
  const allocation = await loadOrCreateAllocation(input.quota, input.userId);
  if (!allowsChatTurn(allocation, input.state)) {
    return {
      status: 403,
      body: {
        error: 'Sin investigaciones disponibles',
        message: 'Agotaste las investigaciones incluidas. Un operador puede sumar cupo; cada investigación guardada cuenta como un uso.',
        remaining: 0,
      },
    };
  }

  const result = await input.runWorkflow(input.messages, input.userId, input.state || undefined);
  try {
    const persisted = await persistClosedWorkflow({
      userId: input.userId,
      messages: input.messages,
      previous: input.state,
      result,
      quota: input.quota,
      writer: input.writer,
      slugSuffix: input.slugSuffix,
    });
    return {
      status: 200,
      body: {
        content: persisted.content,
        state: persisted.state,
        hasMore: result.hasMore,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'SIN_CUPO') {
      return {
        status: 403,
        body: {
          error: 'Sin investigaciones disponibles',
          message: 'Agotaste las investigaciones incluidas. Un operador puede sumar cupo; cada investigación guardada cuenta como un uso.',
          remaining: 0,
        },
      };
    }
    return { status: 500, body: { error: 'No se pudo guardar la investigación.' } };
  }
}
