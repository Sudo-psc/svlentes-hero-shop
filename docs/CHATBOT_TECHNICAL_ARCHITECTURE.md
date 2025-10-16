# Arquitetura Técnica - Chatbot WhatsApp com LangChain/LangGraph

## 📐 Visão Geral Arquitetural

Este documento detalha a implementação técnica do chatbot WhatsApp para SV Lentes, utilizando LangChain, LangGraph, GPT-5 e Qdrant para memória vetorial.

## 🎯 Decisões Arquiteturais Chave

### ADR-001: Escolha do LangGraph para Orquestração
**Contexto:** Necessidade de gerenciar fluxos de conversa complexos com múltiplos agentes

**Decisão:** Utilizar LangGraph em vez de chains simples do LangChain

**Justificativa:**
- Fluxos condicionais baseados em estado
- Múltiplos agentes especializados
- Capacidade de backtracking
- Melhor debugging e visualização
- Suporte a ciclos (follow-ups)

### ADR-002: Qdrant como Vector Database
**Contexto:** Necessidade de memória de longo prazo e busca semântica

**Decisão:** Qdrant Cloud em vez de alternativas (Pinecone, Weaviate, ChromaDB)

**Justificativa:**
- Performance superior em português
- API REST simples
- Suporte a filtros complexos
- Menor custo operacional
- Self-hosting disponível

### ADR-003: Arquitetura Serverless com Next.js
**Contexto:** Integração com sistema existente e escalabilidade

**Decisão:** API Routes do Next.js para webhooks + Edge Functions para processamento

**Justificativa:**
- Já utiliza Next.js no projeto
- Zero-config scaling
- Cold start < 100ms
- Custo baseado em uso
- Integração nativa com Vercel

## 🏗️ Diagrama de Componentes Detalhado

```
┌──────────────────────────────────────────────────────────────────┐
│                         CAMADA DE ENTRADA                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   WhatsApp   │        │  Instagram   │        │  Web Widget  │
│   Business   │        │     DM       │        │    (Futuro)  │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                    CAMADA DE WEBHOOK HANDLER                       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │   Next.js API Route: /api/webhooks/whatsapp              │    │
│  │   - Validação de signature                               │    │
│  │   - Rate limiting                                         │    │
│  │   - Request deduplication                                │    │
│  │   - Queue para processamento assíncrono                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────┬────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│                  CAMADA DE PROCESSAMENTO                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              Message Processing Pipeline                  │     │
│  │                                                           │     │
│  │  1. Message Parser                                        │     │
│  │     └─> Extract text, media, metadata                    │     │
│  │                                                           │     │
│  │  2. User Context Retriever                               │     │
│  │     └─> Load from PostgreSQL + Qdrant                   │     │
│  │                                                           │     │
│  │  3. Intent Classifier (GPT-5)                            │     │
│  │     └─> Classify intent + Extract entities              │     │
│  │                                                           │     │
│  │  4. LangGraph Router                                     │     │
│  │     └─> Route to appropriate agent                      │     │
│  └──────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│                    CAMADA DE AGENTES (LangGraph)                    │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Sales     │  │  Support    │  │ Scheduling  │  │  Human   │ │
│  │   Agent     │  │   Agent     │  │   Agent     │  │ Handoff  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │
│         │                │                │              │        │
│         └────────────────┴────────────────┴──────────────┘        │
│                            │                                       │
│         ┌──────────────────▼──────────────────┐                   │
│         │     GPT-5 Language Model             │                   │
│         │  + Custom Prompts + RAG              │                   │
│         └──────────────────┬──────────────────┘                   │
└────────────────────────────┼───────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                    CAMADA DE MEMÓRIA E DADOS                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Qdrant     │  │ PostgreSQL   │  │    Redis     │             │
│  │  Vector DB   │  │  Relational  │  │    Cache     │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│  Conversas         Usuários, Leads,    Sessões,                    │
│  embeddings        Agendamentos        Rate limit                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                 CAMADA DE INTEGRAÇÕES EXTERNAS                      │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Asaas   │  │ Calendar │  │   CRM    │  │   n8n    │          │
│  │ Payment  │  │   API    │  │  (HubSpot│  │ Workflows│          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

## 💻 Implementação Detalhada

### 1. Webhook Handler (Next.js API Route)

```typescript
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppSignature } from '@/lib/whatsapp/security';
import { queueMessage } from '@/lib/queue/message-queue';
import { logWebhookEvent } from '@/lib/logging';

// Verificação do webhook (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Recebimento de mensagens (POST)
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Validar signature
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();
    
    if (!verifyWhatsAppSignature(body, signature)) {
      logWebhookEvent('signature_verification_failed', { signature });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // 2. Validar formato
    if (data.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 });
    }

    // 3. Extrair mensagens
    const messages = data.entry?.[0]?.changes?.[0]?.value?.messages;
    
    if (!messages || messages.length === 0) {
      // Status updates ou outras notificações - apenas ACK
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 4. Enfileirar para processamento assíncrono
    for (const message of messages) {
      await queueMessage({
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        content: message,
        metadata: {
          phoneNumberId: data.entry[0].changes[0].value.metadata.phone_number_id,
          receivedAt: new Date().toISOString(),
        },
      });
    }

    // 5. Responder imediatamente (200 OK)
    logWebhookEvent('messages_queued', {
      count: messages.length,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    logWebhookEvent('webhook_error', { error: error.message });
    
    // Ainda retornar 200 para evitar retry do WhatsApp
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// Rate limiting middleware
export const config = {
  runtime: 'edge',
  regions: ['gru1'], // São Paulo region
};
```

### 2. Message Queue System

```typescript
// src/lib/queue/message-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { processIncomingMessage } from '../chatbot/message-processor';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Fila de mensagens
export const messageQueue = new Queue('whatsapp-messages', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

// Worker para processar mensagens
export const messageWorker = new Worker(
  'whatsapp-messages',
  async (job) => {
    const { messageId, from, content, metadata } = job.data;

    console.log(`Processing message ${messageId} from ${from}`);

    try {
      // Processar mensagem através do LangGraph
      const result = await processIncomingMessage({
        messageId,
        userId: from,
        content,
        metadata,
      });

      return result;
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 messages in parallel
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // per 1 second
    },
  }
);

// Event handlers
messageWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// Helper to add message to queue
export async function queueMessage(data: any) {
  return await messageQueue.add('process-message', data, {
    jobId: data.messageId, // Deduplication
  });
}
```

### 3. LangGraph Implementation

```typescript
// src/lib/chatbot/graph/workflow.ts
import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

// State definition
export interface AgentState {
  messages: BaseMessage[];
  userId: string;
  userName: string;
  userPhone: string;
  intent: 'sales' | 'support' | 'scheduling' | 'information' | 'unknown' | null;
  entities: Record<string, any>;
  context: {
    isCustomer: boolean;
    currentPlan?: string;
    leadStage?: string;
    conversationHistory: any[];
  };
  needsHumanHandoff: boolean;
  currentStep: string;
  metadata: Record<string, any>;
}

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Node functions
async function loadUserContext(state: AgentState): Promise<Partial<AgentState>> {
  // Load user data from PostgreSQL
  const user = await getUserFromDB(state.userId);
  
  // Load conversation history from Qdrant
  const history = await retrieveUserHistory(state.userId, 10);
  
  return {
    userName: user?.name || 'Cliente',
    context: {
      isCustomer: user?.isCustomer || false,
      currentPlan: user?.currentPlan,
      leadStage: user?.leadStage,
      conversationHistory: history,
    },
  };
}

async function classifyIntent(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  const classificationPrompt = `
    Analise a mensagem e classifique a intenção:
    
    Mensagem: "${lastMessage.content}"
    
    Contexto:
    - Cliente existente: ${state.context.isCustomer}
    - Conversas anteriores: ${state.context.conversationHistory.length}
    
    Retorne JSON com:
    {
      "intent": "sales" | "support" | "scheduling" | "information",
      "entities": { ... },
      "urgency": "low" | "medium" | "high" | "emergency",
      "needsHuman": boolean
    }
  `;
  
  const response = await llm.invoke([new HumanMessage(classificationPrompt)]);
  const classification = JSON.parse(response.content as string);
  
  return {
    intent: classification.intent,
    entities: classification.entities,
    needsHumanHandoff: classification.needsHuman || classification.urgency === 'emergency',
    currentStep: 'classified',
  };
}

async function routeToAgent(state: AgentState): Promise<string> {
  if (state.needsHumanHandoff) {
    return 'human_handoff';
  }
  
  switch (state.intent) {
    case 'sales':
      return 'sales_agent';
    case 'support':
      return 'support_agent';
    case 'scheduling':
      return 'scheduling_agent';
    case 'information':
      return 'information_agent';
    default:
      return 'information_agent';
  }
}

async function salesAgent(state: AgentState): Promise<Partial<AgentState>> {
  const { handleSalesConversation } = await import('../agents/sales.agent');
  return await handleSalesConversation(state);
}

async function supportAgent(state: AgentState): Promise<Partial<AgentState>> {
  const { handleSupportConversation } = await import('../agents/support.agent');
  return await handleSupportConversation(state);
}

async function schedulingAgent(state: AgentState): Promise<Partial<AgentState>> {
  const { handleScheduling } = await import('../agents/scheduling.agent');
  return await handleScheduling(state);
}

async function informationAgent(state: AgentState): Promise<Partial<AgentState>> {
  const { provideInformation } = await import('../agents/information.agent');
  return await provideInformation(state);
}

async function humanHandoff(state: AgentState): Promise<Partial<AgentState>> {
  // Notify human agents
  await notifyHumanAgents(state);
  
  // Send message to user
  const handoffMessage = new AIMessage(
    'Entendi sua necessidade. Estou transferindo você para um especialista da nossa equipe. ' +
    'Em breve alguém entrará em contato. Obrigado pela paciência! 🙏'
  );
  
  return {
    messages: [...state.messages, handoffMessage],
    currentStep: 'handed_off',
  };
}

// Build the graph
export function buildChatbotGraph() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      userId: {
        value: (x: string | null, y: string) => y ?? x,
        default: () => null,
      },
      intent: {
        value: (x: string | null, y: string) => y ?? x,
        default: () => null,
      },
      context: {
        value: (x: any, y: any) => ({ ...x, ...y }),
        default: () => ({}),
      },
      needsHumanHandoff: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false,
      },
    },
  });

  // Add nodes
  workflow.addNode('load_context', loadUserContext);
  workflow.addNode('classify_intent', classifyIntent);
  workflow.addNode('sales_agent', salesAgent);
  workflow.addNode('support_agent', supportAgent);
  workflow.addNode('scheduling_agent', schedulingAgent);
  workflow.addNode('information_agent', informationAgent);
  workflow.addNode('human_handoff', humanHandoff);

  // Add edges
  workflow.addEdge(START, 'load_context');
  workflow.addEdge('load_context', 'classify_intent');
  
  // Conditional routing
  workflow.addConditionalEdges('classify_intent', routeToAgent);
  
  // All agents end the flow
  workflow.addEdge('sales_agent', END);
  workflow.addEdge('support_agent', END);
  workflow.addEdge('scheduling_agent', END);
  workflow.addEdge('information_agent', END);
  workflow.addEdge('human_handoff', END);

  return workflow.compile();
}

// Export compiled graph
export const chatbotGraph = buildChatbotGraph();
```

### 4. Qdrant Memory Service

```typescript
// src/lib/chatbot/memory/qdrant.service.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from '@langchain/openai';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const COLLECTION_NAME = 'svlentes_conversations';

export class QdrantMemoryService {
  async initialize() {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072,
          distance: 'Cosine',
        },
      });

      // Create indexes
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'userId',
        field_schema: 'keyword',
      });

      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'timestamp',
        field_schema: 'datetime',
      });
    }
  }

  async saveMessage(params: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    role: 'user' | 'assistant';
    intent?: string;
    conversationId: string;
  }) {
    const embedding = await embeddings.embedQuery(params.message);

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: params.id,
          vector: embedding,
          payload: {
            userId: params.userId,
            userName: params.userName,
            message: params.message,
            role: params.role,
            intent: params.intent,
            conversationId: params.conversationId,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });
  }

  async getUserHistory(userId: string, limit: number = 10) {
    const results = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      limit,
      with_payload: true,
      order_by: { key: 'timestamp', direction: 'desc' },
    });

    return results.points.map(p => ({
      id: p.id,
      message: p.payload.message,
      role: p.payload.role,
      timestamp: p.payload.timestamp,
    }));
  }

  async semanticSearch(query: string, userId: string, limit: number = 5) {
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      limit,
      with_payload: true,
    });

    return results.map(r => ({
      message: r.payload.message,
      role: r.payload.role,
      score: r.score,
      timestamp: r.payload.timestamp,
    }));
  }

  async deleteUserData(userId: string) {
    // LGPD compliance - delete all user data
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
    });
  }
}

export const qdrantMemory = new QdrantMemoryService();
```

### 5. Message Processor (Main Entry Point)

```typescript
// src/lib/chatbot/message-processor.ts
import { HumanMessage } from '@langchain/core/messages';
import { chatbotGraph } from './graph/workflow';
import { qdrantMemory } from './memory/qdrant.service';
import { sendWhatsAppMessage } from '../whatsapp/client';
import { v4 as uuidv4 } from 'uuid';

export async function processIncomingMessage(params: {
  messageId: string;
  userId: string;
  content: any;
  metadata: any;
}) {
  const { messageId, userId, content, metadata } = params;

  try {
    // 1. Extract text from message
    const messageText = extractMessageText(content);

    // 2. Save user message to Qdrant
    await qdrantMemory.saveMessage({
      id: messageId,
      userId,
      userName: content.profile?.name || 'Cliente',
      message: messageText,
      role: 'user',
      conversationId: metadata.conversationId || uuidv4(),
    });

    // 3. Initialize state
    const initialState = {
      messages: [new HumanMessage(messageText)],
      userId,
      userName: '',
      userPhone: userId,
      intent: null,
      entities: {},
      context: {
        isCustomer: false,
        conversationHistory: [],
      },
      needsHumanHandoff: false,
      currentStep: 'started',
      metadata: {
        messageId,
        conversationId: metadata.conversationId || uuidv4(),
      },
    };

    // 4. Run through LangGraph
    const result = await chatbotGraph.invoke(initialState);

    // 5. Extract bot response
    const botMessage = result.messages[result.messages.length - 1];
    const botMessageText = botMessage.content as string;

    // 6. Save bot response to Qdrant
    const botMessageId = uuidv4();
    await qdrantMemory.saveMessage({
      id: botMessageId,
      userId,
      userName: result.userName,
      message: botMessageText,
      role: 'assistant',
      intent: result.intent || undefined,
      conversationId: metadata.conversationId || uuidv4(),
    });

    // 7. Send response via WhatsApp
    await sendWhatsAppMessage({
      to: userId,
      type: 'text',
      text: {
        body: botMessageText,
        preview_url: true,
      },
    });

    return {
      success: true,
      messageId: botMessageId,
      intent: result.intent,
      handedOff: result.needsHumanHandoff,
    };
  } catch (error) {
    console.error('Error processing message:', error);

    // Send error message to user
    await sendWhatsAppMessage({
      to: userId,
      type: 'text',
      text: {
        body: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente em alguns instantes.',
      },
    });

    throw error;
  }
}

function extractMessageText(content: any): string {
  switch (content.type) {
    case 'text':
      return content.text.body;
    case 'image':
      return '[Imagem enviada]';
    case 'audio':
      return '[Áudio enviado - transcrição em desenvolvimento]';
    case 'video':
      return '[Vídeo enviado]';
    case 'document':
      return '[Documento enviado]';
    default:
      return '[Mensagem não suportada]';
  }
}
```

## 🔧 Configuração e Deploy

### Environment Variables

```bash
# .env.production
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo  # or gpt-5 when available
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Qdrant
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=xxx
QDRANT_COLLECTION=svlentes_conversations

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx
WHATSAPP_API_VERSION=v18.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/svlentes
REDIS_URL=redis://host:6379

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
```

### Docker Compose (Local Development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env.local
    depends_on:
      - postgres
      - redis
      - qdrant

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: svlentes
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

## 📊 Monitoring e Observability

### Métricas Importantes

```typescript
// src/lib/monitoring/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const metrics = {
  // Mensagens
  messagesReceived: new Counter({
    name: 'chatbot_messages_received_total',
    help: 'Total de mensagens recebidas',
    labelNames: ['type'],
  }),

  messagesProcessed: new Counter({
    name: 'chatbot_messages_processed_total',
    help: 'Total de mensagens processadas',
    labelNames: ['intent', 'success'],
  }),

  // Performance
  processingTime: new Histogram({
    name: 'chatbot_processing_time_seconds',
    help: 'Tempo de processamento de mensagens',
    labelNames: ['agent'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  // Conversas
  activeConversations: new Gauge({
    name: 'chatbot_active_conversations',
    help: 'Número de conversas ativas',
  }),

  // Handoffs
  humanHandoffs: new Counter({
    name: 'chatbot_human_handoffs_total',
    help: 'Total de transferências para humano',
    labelNames: ['reason'],
  }),

  // Errors
  errors: new Counter({
    name: 'chatbot_errors_total',
    help: 'Total de erros',
    labelNames: ['type', 'component'],
  }),
};
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test -- src/lib/chatbot/
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests with Playwright
```typescript
// tests/e2e/chatbot.spec.ts
test('should handle complete sales conversation', async () => {
  // Mock WhatsApp webhook
  // Simulate conversation flow
  // Assert responses and database state
});
```

## 📚 Referências de Código

### Exemplo de Prompt Template

```typescript
// src/lib/chatbot/prompts/sales.prompt.ts
export const salesPromptTemplate = `
Você é um consultor de vendas da SV Lentes, especializado em lentes de contato por assinatura.

PERSONA:
- Nome: Assistente Virtual SV Lentes
- Tom: Profissional, empático, consultivo
- Objetivo: Ajudar clientes a encontrar o melhor plano

INFORMAÇÕES DOS PLANOS:
{plans_info}

CONTEXTO DO CLIENTE:
- Nome: {user_name}
- Cliente existente: {is_customer}
- Conversas anteriores: {previous_conversations}
- Estágio: {lead_stage}

HISTÓRICO DA CONVERSA:
{chat_history}

MENSAGEM ATUAL:
{current_message}

DIRETRIZES:
1. Seja empático e ouça as necessidades
2. Destaque a economia e conveniência
3. Mencione acompanhamento médico
4. Use emojis moderadamente 👓 💚
5. Se alta intenção, ofereça link de pagamento
6. Se dúvidas médicas, agende consulta

Responda de forma natural e útil:
`;
```

---

**Versão:** 1.0  
**Data:** Outubro 2025  
**Autor:** Equipe SV Lentes  
**Status:** Arquitetura Técnica Aprovada
