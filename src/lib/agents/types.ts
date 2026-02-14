/**
 * Tipos compartidos entre agentes del flujo multi-agente
 */

export interface AgentState {
  // Información del usuario
  userId: string;
  email?: string;

  // Contexto del flujo
  currentStep: 'orchestrate' | 'sourcing' | 'landing' | 'content' | 'media' | 'complete';
  previousSteps: string[];
  nextAgent?: string; // Próximo agente a ejecutar cuando usuario confirme

  // Datos recopilados
  userIntention: string; // Descripción inicial del usuario
  selectedProduct?: {
    name: string;
    description: string;
    providerUrl?: string;
    priceRange?: string;
    margin?: string;
    demandLevel?: 'alta' | 'media' | 'baja';
  };

  // Resultados de agentes
  sourcingResult?: {
    productName: string;
    productDescription: string;
    providers: Array<{
      name: string;
      contactUrl: string;
      priceProvider: string;
      suggestedPVP: string;
    }>;
    analysis: {
      demand: 'Alta' | 'Media' | 'Baja';
      competition: 'Alta' | 'Media' | 'Baja';
      margin: 'Bajo' | 'Medio' | 'Alto';
      risks: string[];
    };
    strategy: {
      hook: string;
      trend: string;
      alternative: string;
    };
  };

  landingResult?: {
    title: string;
    subtitle: string;
    benefits: string[];
    faq: Array<{ question: string; answer: string }>;
    cta: string;
    colorPalette?: string;
    sections?: string[];
  };

  contentResult?: {
    instagram: { post: string; hashtags: string };
    tiktok: { post: string; hashtags: string };
    facebook: { post: string; hashtags: string };
  };

  mediaResult?: {
    imagePrompts: string[];
    videoGuides: string[];
    visualStrategy: string;
  };

  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  nextStep?: 'sourcing' | 'landing' | 'content' | 'media' | 'checkout' | 'complete';
  data?: any;
  error?: string;
  state?: AgentState;
}
