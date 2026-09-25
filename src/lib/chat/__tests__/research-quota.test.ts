import type { AgentState } from '@/lib/agents/types';
import {
  PLAN_INCLUDED_SEARCHES,
  handleMultiMode,
  type AllocationRow,
  type LandingInsert,
  type ProductWriter,
  type QuotaStore,
  type ResearchSessionInsert,
} from '@/lib/chat/research-quota';

function baseState(partial: Partial<AgentState> = {}): AgentState {
  return {
    userId: 'user-1',
    previousSteps: [],
    userIntention: 'audifonos',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

function memoryQuota(initial: AllocationRow | null) {
  let row = initial;
  const inserted: AllocationRow[] = [];
  const store: QuotaStore = {
    async getAllocation() {
      return row;
    },
    async insertAllocation(_userId, allocatedCount) {
      row = { allocated_count: allocatedCount, used_count: 0 };
      inserted.push(row);
    },
    async consume() {
      if (!row || row.used_count >= row.allocated_count) return { ok: false as const };
      row = { ...row, used_count: row.used_count + 1 };
      return { ok: true as const, used: row.used_count, allocated: row.allocated_count };
    },
    async refund() {
      if (!row || row.used_count <= 0) return;
      row = { ...row, used_count: row.used_count - 1 };
    },
  };
  return {
    store,
    inserted,
    snapshot: () => row,
  };
}

function memoryWriter() {
  const sessions: ResearchSessionInsert[] = [];
  const landings: LandingInsert[] = [];
  const writer: ProductWriter = {
    async insertResearchSession(row) {
      sessions.push(row);
      return { id: `session-${sessions.length}` };
    },
    async insertLanding(row) {
      landings.push(row);
      return { id: `landing-${landings.length}`, slug: row.slug };
    },
  };
  return { writer, sessions, landings };
}

describe('mode=multi persiste y descuenta', () => {
  it('crea la fila del plan si no existe y no responde 403', async () => {
    const quota = memoryQuota(null);
    const writer = memoryWriter();
    const runWorkflow = jest.fn(async () => ({
      content: '¿Qué producto quieres investigar?',
      hasMore: false,
      state: baseState(),
    }));

    const outcome = await handleMultiMode({
      userId: 'user-1',
      messages: [{ role: 'user', content: 'audifonos bluetooth' }],
      quota: quota.store,
      writer: writer.writer,
      runWorkflow,
    });

    expect(outcome.status).toBe(200);
    expect(quota.inserted[0]?.allocated_count).toBe(PLAN_INCLUDED_SEARCHES);
    expect(runWorkflow).toHaveBeenCalled();
  });

  it('al cerrar sourcing guarda la investigación y descuenta un uso', async () => {
    const quota = memoryQuota({ allocated_count: 10, used_count: 0 });
    const writer = memoryWriter();

    const outcome = await handleMultiMode({
      userId: 'user-1',
      messages: [{ role: 'user', content: 'audifonos bluetooth COP 89000' }],
      quota: quota.store,
      writer: writer.writer,
      slugSuffix: 'abc123',
      runWorkflow: async () => ({
        content: 'Investigación lista. PVP COP 89.000',
        hasMore: true,
        state: baseState({
          previousSteps: ['sourcing'],
          sourcingResult: {
            productName: 'Audifonos bluetooth',
            productDescription: 'PVP COP 89000',
            providers: [],
            analysis: { demand: 'Alta', competition: 'Media', margin: 'Medio', risks: [] },
            strategy: { hook: '', trend: '', alternative: '' },
          },
        }),
      }),
    });

    expect(outcome.status).toBe(200);
    expect(writer.sessions).toHaveLength(1);
    expect(writer.sessions[0].status).toBe('proposed');
    expect(quota.snapshot()?.used_count).toBe(1);
    if (outcome.status === 200) {
      expect(outcome.body.state.researchSessionId).toBe('session-1');
    }
  });

  it('al cerrar el landing builder guarda el borrador con hero y precio, sin otro descuento', async () => {
    const quota = memoryQuota({ allocated_count: 10, used_count: 1 });
    const writer = memoryWriter();

    const outcome = await handleMultiMode({
      userId: 'user-1',
      messages: [{ role: 'user', content: 'sí, el PVP es COP 120.000' }],
      state: baseState({ researchSessionId: 'session-1', previousSteps: ['sourcing'] }),
      quota: quota.store,
      writer: writer.writer,
      slugSuffix: 'xyz987',
      runWorkflow: async () => ({
        content: [
          '## LANDING',
          '- **Title:** Audífonos que no se caen',
          '- **Subtitle:** Batería de 20 horas',
          '- **CTA Button:** Comprar ahora',
        ].join('\n'),
        hasMore: false,
        state: baseState({
          researchSessionId: 'session-1',
          previousSteps: ['sourcing', 'landing'],
          sourcingResult: {
            productName: 'Audifonos',
            productDescription: 'listo',
            providers: [],
            analysis: { demand: 'Alta', competition: 'Media', margin: 'Medio', risks: [] },
            strategy: { hook: '', trend: '', alternative: '' },
          },
          landingResult: {
            title: 'Landing for Audifonos',
            subtitle: '',
            benefits: [],
            faq: [],
            cta: 'Buy Now',
          },
        }),
      }),
    });

    expect(outcome.status).toBe(200);
    expect(quota.snapshot()?.used_count).toBe(1);
    expect(writer.landings).toHaveLength(1);
    expect(writer.landings[0].status).toBe('draft');
    expect(writer.landings[0].store_id).toBeNull();
    expect(writer.landings[0].content.hero).toEqual({
      title: 'Audífonos que no se caen',
      subtitle: 'Batería de 20 horas',
      cta: 'Comprar ahora',
    });
    expect(writer.landings[0].content.checkout.price_cop).toBe(120000);
  });

  it('rechaza sin cupo y no llama al modelo ni guarda filas', async () => {
    const quota = memoryQuota({ allocated_count: 10, used_count: 10 });
    const writer = memoryWriter();
    const runWorkflow = jest.fn();

    const outcome = await handleMultiMode({
      userId: 'user-1',
      messages: [{ role: 'user', content: 'otro producto' }],
      quota: quota.store,
      writer: writer.writer,
      runWorkflow,
    });

    expect(outcome.status).toBe(403);
    expect(runWorkflow).not.toHaveBeenCalled();
    expect(writer.sessions).toHaveLength(0);
    expect(writer.landings).toHaveLength(0);
    expect(quota.snapshot()?.used_count).toBe(10);
  });
});
