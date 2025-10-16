# Requisitos Funcionais - Chatbot WhatsApp com LangChain e LangGraph

## 📋 Visão Geral

Sistema de chatbot inteligente para WhatsApp utilizando LangChain, LangGraph e GPT-5, com memória persistente de conversas em banco de dados vetorial Qdrant. O chatbot visa automatizar o atendimento ao cliente, agendamento de consultas, suporte a vendas e acompanhamento pós-venda no contexto do serviço de assinatura de lentes de contato SV Lentes.

## 🎯 Objetivos do Sistema

### Objetivos Principais
- **Atendimento 24/7**: Responder automaticamente a dúvidas comuns fora do horário comercial
- **Qualificação de Leads**: Coletar informações relevantes de potenciais clientes
- **Agendamento Automatizado**: Facilitar marcação de consultas com Dr. Philipe Saraiva
- **Suporte Técnico**: Auxiliar clientes com dúvidas sobre lentes e assinaturas
- **Contexto Persistente**: Manter histórico de conversas para continuidade de atendimento

### Objetivos Secundários
- Reduzir tempo de resposta em 80%
- Aumentar taxa de conversão de leads em 30%
- Melhorar satisfação do cliente (NPS > 8)
- Reduzir carga de trabalho do atendimento humano em 60%

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

```typescript
// Core AI Stack
{
  "llm": "GPT-5 (OpenAI)",
  "framework": "LangChain 0.2+",
  "orchestration": "LangGraph",
  "vectorDB": "Qdrant Cloud/Self-hosted",
  "embeddings": "text-embedding-3-large (OpenAI)",
  "whatsappAPI": "WhatsApp Business API / Twilio / Evolution API"
}
```

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                     WhatsApp Business API                    │
│                 (Webhook Entrada/Saída)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway / Webhook                       │
│              (Next.js API Routes + Middleware)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   LangGraph Agent Router                      │
│         (Gerenciamento de Estado e Fluxo de Conversação)     │
└─────────┬───────────────┬───────────────┬───────────────────┘
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │  Sales  │    │ Support │    │Schedule │
    │  Agent  │    │  Agent  │    │  Agent  │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │    GPT-5 Language Model       │
         │  (Geração de Respostas)       │
         └──────────────┬───────────────┘
                        │
         ┌──────────────┴───────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Qdrant Vector  │          │   PostgreSQL    │
│      Store      │          │  (Structured    │
│  (Memória de    │          │      Data)      │
│   Conversas)    │          └─────────────────┘
└─────────────────┘
         │
         └──────────────┐
                        │
         ┌──────────────┴───────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Knowledge Base │          │  CRM / Asaas    │
│  (FAQ, Docs,    │          │   Integration   │
│   Produtos)     │          └─────────────────┘
└─────────────────┘
```

## 📱 Integração WhatsApp

### Opções de API

#### Opção 1: WhatsApp Business API Oficial (Recomendado)
```typescript
interface WhatsAppConfig {
  provider: 'meta-cloud-api' | 'on-premise';
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  webhookUrl: string;
}
```

**Vantagens:**
- Oficial e estável
- Suporte a recursos avançados (botões, listas, templates)
- Melhor deliverability
- Compliance garantido

**Desvantagens:**
- Custo por conversa (grátis até 1000/mês)
- Processo de aprovação do Meta Business

#### Opção 2: Evolution API (Alternativa Open Source)
```typescript
interface EvolutionAPIConfig {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  qrcode: boolean;
  webhook: {
    url: string;
    events: string[];
  };
}
```

**Vantagens:**
- Open source e gratuito
- Sem limite de mensagens
- Deploy próprio (controle total)

**Desvantagens:**
- Risco de banimento pela WhatsApp
- Menos recursos oficiais
- Manutenção manual

#### Opção 3: Twilio WhatsApp API
```typescript
interface TwilioWhatsAppConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string; // formato: whatsapp:+5533998601427
  webhookUrl: string;
}
```

**Vantagens:**
- Confiável e escalável
- Documentação excelente
- Suporte técnico

**Desvantagens:**
- Custo por mensagem
- Menor controle sobre infraestrutura

### Webhook Structure

```typescript
// Webhook de mensagem recebida
interface IncomingWhatsAppMessage {
  object: 'whatsapp_business_account';
  entry: [{
    id: string;
    changes: [{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: [{
          profile: {
            name: string;
          };
          wa_id: string; // WhatsApp ID
        }];
        messages: [{
          from: string; // Número do usuário
          id: string; // Message ID
          timestamp: string;
          type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          // ... outros tipos
        }];
      };
      field: 'messages';
    }];
  }];
}

// Resposta enviada pelo chatbot
interface OutgoingWhatsAppMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string; // Número do destinatário
  type: 'text' | 'interactive' | 'template';
  text?: {
    preview_url: boolean;
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}
```

## 🧠 LangChain + LangGraph Architecture

### LangChain Components

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferWindowMemory } from 'langchain/memory';

// Configuração do modelo GPT-5
const llm = new ChatOpenAI({
  modelName: 'gpt-5-turbo', // ou 'gpt-5' quando disponível
  temperature: 0.7,
  maxTokens: 1000,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Embeddings para busca semântica
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Vector Store para memória
const vectorStore = await QdrantVectorStore.fromExistingCollection(
  embeddings,
  {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: 'svlentes_conversations',
  }
);
```

### LangGraph State Management

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

// Definição do estado da conversa
interface ConversationState {
  messages: BaseMessage[];
  userId: string;
  userName: string;
  userPhone: string;
  intent: 'sales' | 'support' | 'scheduling' | 'information' | 'unknown';
  context: {
    currentPlan?: string;
    appointmentDate?: string;
    leadStage?: 'awareness' | 'consideration' | 'decision' | 'customer';
    previousConversations?: number;
    lastInteraction?: Date;
  };
  needsHumanHandoff: boolean;
  metadata: {
    conversationStarted: Date;
    messagesCount: number;
    averageResponseTime: number;
  };
}

// Nós do grafo
const workflow = new StateGraph<ConversationState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  },
});

// Adicionar nós (agents)
workflow.addNode('intent_classifier', classifyIntent);
workflow.addNode('sales_agent', handleSalesConversation);
workflow.addNode('support_agent', handleSupportConversation);
workflow.addNode('scheduling_agent', handleScheduling);
workflow.addNode('information_agent', provideInformation);
workflow.addNode('human_handoff', transferToHuman);

// Definir transições
workflow.addEdge('intent_classifier', 'router');

workflow.addConditionalEdges(
  'router',
  routeByIntent,
  {
    sales: 'sales_agent',
    support: 'support_agent',
    scheduling: 'scheduling_agent',
    information: 'information_agent',
    human: 'human_handoff',
  }
);

workflow.addEdge('sales_agent', END);
workflow.addEdge('support_agent', END);
workflow.addEdge('scheduling_agent', END);
workflow.addEdge('information_agent', END);

// Compilar o grafo
const app = workflow.compile();
```

### Intent Classification

```typescript
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

const intentSchema = z.object({
  intent: z.enum(['sales', 'support', 'scheduling', 'information', 'complaint']),
  confidence: z.number().min(0).max(1),
  entities: z.object({
    planMentioned: z.string().optional(),
    dateMentioned: z.string().optional(),
    problemType: z.string().optional(),
  }),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  needsHuman: z.boolean(),
});

async function classifyIntent(state: ConversationState) {
  const parser = StructuredOutputParser.fromZodSchema(intentSchema);
  
  const prompt = PromptTemplate.fromTemplate(`
    Analise a mensagem do usuário e classifique a intenção da conversa.
    
    Histórico da conversa: {chat_history}
    Mensagem atual: {current_message}
    
    Contexto do usuário:
    - Nome: {user_name}
    - Cliente existente: {is_customer}
    - Conversas anteriores: {previous_conversations}
    
    {format_instructions}
  `);

  const chain = RunnableSequence.from([
    prompt,
    llm,
    parser,
  ]);

  const result = await chain.invoke({
    chat_history: formatChatHistory(state.messages),
    current_message: getLastUserMessage(state.messages),
    user_name: state.userName,
    is_customer: state.context.leadStage === 'customer',
    previous_conversations: state.context.previousConversations || 0,
    format_instructions: parser.getFormatInstructions(),
  });

  return {
    ...state,
    intent: result.intent,
    needsHumanHandoff: result.needsHuman,
  };
}
```

## 💾 Qdrant Vector Database

### Configuração e Schema

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

// Cliente Qdrant
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// Estrutura de coleção
const COLLECTION_NAME = 'svlentes_conversations';

async function initializeQdrant() {
  // Criar coleção se não existir
  const collections = await qdrantClient.getCollections();
  
  if (!collections.collections.find(c => c.name === COLLECTION_NAME)) {
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 3072, // text-embedding-3-large dimension
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 2,
    });
    
    // Criar índices para filtragem rápida
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'userId',
      field_schema: 'keyword',
    });
    
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'timestamp',
      field_schema: 'datetime',
    });
    
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'intent',
      field_schema: 'keyword',
    });
  }
}

// Estrutura de documento
interface ConversationDocument {
  id: string; // UUID
  userId: string; // WhatsApp phone number
  userName: string;
  message: string;
  role: 'user' | 'assistant';
  intent?: string;
  timestamp: Date;
  metadata: {
    conversationId: string;
    messageIndex: number;
    wasHandedOff: boolean;
    responseTime?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}
```

### Operações de Memória

```typescript
// Salvar conversa no Qdrant
async function saveConversationToQdrant(
  conversation: ConversationDocument
): Promise<void> {
  // Gerar embedding do texto
  const embedding = await embeddings.embedQuery(conversation.message);
  
  // Inserir no Qdrant
  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: conversation.id,
        vector: embedding,
        payload: {
          userId: conversation.userId,
          userName: conversation.userName,
          message: conversation.message,
          role: conversation.role,
          intent: conversation.intent,
          timestamp: conversation.timestamp.toISOString(),
          metadata: conversation.metadata,
        },
      },
    ],
  });
}

// Buscar conversas anteriores do usuário
async function retrieveUserHistory(
  userId: string,
  limit: number = 10
): Promise<ConversationDocument[]> {
  const results = await qdrantClient.scroll(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'userId',
          match: { value: userId },
        },
      ],
    },
    limit: limit,
    with_payload: true,
    with_vector: false,
    order_by: { key: 'timestamp', direction: 'desc' },
  });
  
  return results.points.map(point => ({
    id: point.id as string,
    userId: point.payload.userId as string,
    userName: point.payload.userName as string,
    message: point.payload.message as string,
    role: point.payload.role as 'user' | 'assistant',
    intent: point.payload.intent as string,
    timestamp: new Date(point.payload.timestamp as string),
    metadata: point.payload.metadata as any,
  }));
}

// Busca semântica de conversas similares
async function semanticSearch(
  query: string,
  userId: string,
  limit: number = 5
): Promise<Array<{ document: ConversationDocument; score: number }>> {
  const queryEmbedding = await embeddings.embedQuery(query);
  
  const results = await qdrantClient.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    filter: {
      must: [
        {
          key: 'userId',
          match: { value: userId },
        },
      ],
    },
    limit: limit,
    with_payload: true,
  });
  
  return results.map(result => ({
    document: {
      id: result.id as string,
      userId: result.payload.userId as string,
      userName: result.payload.userName as string,
      message: result.payload.message as string,
      role: result.payload.role as 'user' | 'assistant',
      intent: result.payload.intent as string,
      timestamp: new Date(result.payload.timestamp as string),
      metadata: result.payload.metadata as any,
    },
    score: result.score,
  }));
}
```

## 🎭 Agentes Especializados

### 1. Sales Agent (Vendas)

```typescript
async function handleSalesConversation(state: ConversationState) {
  const prompt = PromptTemplate.fromTemplate(`
    Você é um consultor de vendas especializado em lentes de contato da SV Lentes.
    
    INFORMAÇÕES DOS PLANOS:
    
    Plano Mensal:
    - R$ 179,00/mês
    - 2 caixas de lentes por mês
    - 1 consulta médica a cada 6 meses
    - Suporte WhatsApp
    
    Plano Trimestral:
    - R$ 499,00 a cada 3 meses (R$ 166,33/mês)
    - 6 caixas de lentes
    - 1 consulta médica no período
    - Suporte prioritário
    - Desconto de 7%
    
    Plano Semestral:
    - R$ 899,00 a cada 6 meses (R$ 149,83/mês)
    - 12 caixas de lentes
    - 2 consultas médicas
    - Suporte VIP 24/7
    - Marcas premium incluídas
    - Desconto de 16%
    
    CONTEXTO DO CLIENTE:
    Nome: {user_name}
    Histórico de conversas: {previous_conversations}
    Estágio do lead: {lead_stage}
    
    HISTÓRICO DA CONVERSA:
    {chat_history}
    
    MENSAGEM ATUAL:
    {current_message}
    
    INSTRUÇÕES:
    - Seja empático e consultivo, não agressivo
    - Destaque a economia em relação à compra avulsa
    - Mencione o acompanhamento médico com Dr. Philipe Saraiva (CRM 65.870)
    - Se houver dúvidas sobre prescrição, peça para agendar consulta
    - Se o cliente demonstrar interesse alto, ofereça link de pagamento
    - Mantenha tom profissional mas amigável
    - Use emojis moderadamente (👓 💚 📅)
    
    Responda ao cliente de forma natural e útil:
  `);

  const chain = RunnableSequence.from([prompt, llm]);
  
  // Buscar conversas anteriores relevantes
  const relevantHistory = await semanticSearch(
    getLastUserMessage(state.messages),
    state.userId,
    3
  );
  
  const response = await chain.invoke({
    user_name: state.userName,
    previous_conversations: state.context.previousConversations || 0,
    lead_stage: state.context.leadStage || 'awareness',
    chat_history: formatChatHistory(state.messages),
    current_message: getLastUserMessage(state.messages),
  });

  // Salvar no Qdrant
  await saveConversationToQdrant({
    id: generateUUID(),
    userId: state.userId,
    userName: state.userName,
    message: response.content as string,
    role: 'assistant',
    intent: 'sales',
    timestamp: new Date(),
    metadata: {
      conversationId: state.metadata.conversationStarted.toISOString(),
      messageIndex: state.messages.length + 1,
      wasHandedOff: false,
    },
  });

  return {
    ...state,
    messages: [...state.messages, response],
  };
}
```

### 2. Support Agent (Suporte Técnico)

```typescript
async function handleSupportConversation(state: ConversationState) {
  const prompt = PromptTemplate.fromTemplate(`
    Você é um especialista em suporte técnico para lentes de contato da SV Lentes.
    
    BASE DE CONHECIMENTO:
    
    Problemas Comuns:
    1. Lentes secas/desconfortáveis:
       - Usar colírio lubrificante específico
       - Verificar tempo de uso (máximo 10-12h/dia)
       - Não dormir com lentes (exceto se aprovadas)
       
    2. Lentes rasgadas/danificadas:
       - Substituir imediatamente
       - Não reutilizar lentes descartáveis
       - Clientes podem solicitar reposição via assinatura
       
    3. Irritação/vermelhidão:
       - Remover lentes imediatamente
       - Lavar olhos com soro fisiológico
       - Consultar oftalmologista se persistir > 24h
       - EMERGÊNCIA: orientar a procurar atendimento
       
    4. Perda de lentes:
       - Assinantes têm reposição incluída (1x por mês)
       - Solicitar via WhatsApp com confirmação do plano
       
    5. Dificuldade para colocar/remover:
       - Enviar vídeo tutorial do YouTube
       - Agendar orientação por vídeo-chamada
    
    CONTEXTO DO CLIENTE:
    Nome: {user_name}
    Cliente ativo: {is_customer}
    Plano: {current_plan}
    
    HISTÓRICO:
    {chat_history}
    
    MENSAGEM:
    {current_message}
    
    INSTRUÇÕES:
    - Priorize a saúde ocular do cliente
    - Se for emergência (dor intensa, perda de visão), encaminhe para hospital
    - Para problemas técnicos, ofereça solução prática
    - Se precisar de avaliação médica, ofereça agendamento com Dr. Philipe
    - Seja claro sobre quando é necessário trocar as lentes
    - Não dê diagnósticos médicos, apenas orientações gerais
    
    Responda de forma clara e segura:
  `);

  const chain = RunnableSequence.from([prompt, llm]);
  
  const response = await chain.invoke({
    user_name: state.userName,
    is_customer: state.context.leadStage === 'customer',
    current_plan: state.context.currentPlan || 'Não identificado',
    chat_history: formatChatHistory(state.messages),
    current_message: getLastUserMessage(state.messages),
  });

  await saveConversationToQdrant({
    id: generateUUID(),
    userId: state.userId,
    userName: state.userName,
    message: response.content as string,
    role: 'assistant',
    intent: 'support',
    timestamp: new Date(),
    metadata: {
      conversationId: state.metadata.conversationStarted.toISOString(),
      messageIndex: state.messages.length + 1,
      wasHandedOff: false,
    },
  });

  return {
    ...state,
    messages: [...state.messages, response],
  };
}
```

### 3. Scheduling Agent (Agendamento)

```typescript
import { Calendar } from '@google/calendar'; // ou integração escolhida

async function handleScheduling(state: ConversationState) {
  const prompt = PromptTemplate.fromTemplate(`
    Você é um assistente de agendamento de consultas oftalmológicas com Dr. Philipe Saraiva.
    
    INFORMAÇÕES DO MÉDICO:
    - Nome: Dr. Philipe Saraiva Cruz
    - CRM: 65.870
    - Especialidade: Oftalmologia
    - Atendimento: Presencial e Telemedicina
    - Horários: Segunda a Sexta, 8h às 18h
    - Duração consulta: 30 minutos
    - Localização: [Endereço da clínica]
    
    TIPOS DE CONSULTA:
    1. Primeira consulta (avaliação completa) - 45 minutos
    2. Consulta de acompanhamento - 30 minutos
    3. Adaptação de lentes - 30 minutos
    4. Emergência - Encaixe no mesmo dia
    
    FLUXO DE AGENDAMENTO:
    1. Perguntar tipo de consulta
    2. Verificar disponibilidade do cliente (dia/horário preferencial)
    3. Consultar agenda do médico
    4. Confirmar dados do paciente (nome completo, CPF, telefone)
    5. Enviar confirmação por WhatsApp
    6. Adicionar lembrete 24h antes
    
    CONTEXTO:
    Cliente: {user_name}
    Telefone: {user_phone}
    
    HISTÓRICO:
    {chat_history}
    
    MENSAGEM:
    {current_message}
    
    INSTRUÇÕES:
    - Seja cordial e eficiente
    - Ofereça 3 opções de horário quando possível
    - Se agenda cheia, ofereça lista de espera
    - Confirme sempre os dados antes de finalizar
    - Para emergências, priorize atendimento no dia
    
    Ajude o cliente a agendar:
  `);

  const chain = RunnableSequence.from([prompt, llm]);
  
  const response = await chain.invoke({
    user_name: state.userName,
    user_phone: state.userPhone,
    chat_history: formatChatHistory(state.messages),
    current_message: getLastUserMessage(state.messages),
  });

  // Se detectar intenção de confirmação, integrar com sistema de agendamento
  if (detectConfirmationIntent(response.content as string)) {
    const appointmentDetails = extractAppointmentDetails(state.messages);
    await createAppointment(appointmentDetails);
    
    // Enviar confirmação via WhatsApp com botões
    await sendInteractiveMessage(state.userPhone, {
      type: 'button',
      body: `✅ Consulta agendada!\n\n📅 ${appointmentDetails.date}\n⏰ ${appointmentDetails.time}\n👨‍⚕️ Dr. Philipe Saraiva\n\nDeseja adicionar ao calendário?`,
      buttons: [
        { id: 'add_calendar', title: 'Adicionar à agenda' },
        { id: 'cancel', title: 'Cancelar consulta' },
      ],
    });
  }

  await saveConversationToQdrant({
    id: generateUUID(),
    userId: state.userId,
    userName: state.userName,
    message: response.content as string,
    role: 'assistant',
    intent: 'scheduling',
    timestamp: new Date(),
    metadata: {
      conversationId: state.metadata.conversationStarted.toISOString(),
      messageIndex: state.messages.length + 1,
      wasHandedOff: false,
      appointmentScheduled: detectConfirmationIntent(response.content as string),
    },
  });

  return {
    ...state,
    messages: [...state.messages, response],
  };
}
```

## 🔄 Fluxos de Conversação

### Fluxo 1: Lead Qualification (Qualificação de Lead)

```mermaid
graph TD
    A[Mensagem Inicial] --> B{Novo ou Recorrente?}
    B -->|Novo| C[Apresentação SV Lentes]
    B -->|Recorrente| D[Recuperar Histórico Qdrant]
    C --> E[Identificar Necessidade]
    D --> E
    E --> F{Tipo de Interesse}
    F -->|Preço| G[Sales Agent - Planos]
    F -->|Dúvida| H[Information Agent]
    F -->|Consulta| I[Scheduling Agent]
    G --> J{Alta Intenção?}
    J -->|Sim| K[Enviar Link Pagamento]
    J -->|Não| L[Nurturing - Salvar em CRM]
    K --> M[Fim]
    L --> M
    H --> M
    I --> M
```

### Fluxo 2: Customer Support (Suporte ao Cliente)

```mermaid
graph TD
    A[Cliente Envia Problema] --> B[Classificar Urgência]
    B --> C{Urgência}
    C -->|Emergência| D[Transferir para Humano IMEDIATO]
    C -->|Alta| E[Support Agent + Notificar Equipe]
    C -->|Média| F[Support Agent]
    C -->|Baixa| G[Information Agent + FAQ]
    E --> H{Resolvido?}
    F --> H
    G --> H
    H -->|Sim| I[Solicitar Feedback]
    H -->|Não| J[Escalar para Humano]
    I --> K[Salvar em Qdrant]
    J --> K
    D --> K
    K --> L[Fim]
```

### Fluxo 3: Appointment Scheduling (Agendamento)

```mermaid
graph TD
    A[Solicitação de Agendamento] --> B[Tipo de Consulta]
    B --> C[Consultar Disponibilidade]
    C --> D{Horários Disponíveis?}
    D -->|Sim| E[Apresentar Opções]
    D -->|Não| F[Lista de Espera]
    E --> G[Cliente Escolhe]
    G --> H[Confirmar Dados Paciente]
    H --> I[Criar Agendamento]
    I --> J[Enviar Confirmação WhatsApp]
    J --> K[Adicionar Lembrete 24h]
    K --> L[Salvar em Qdrant]
    F --> M[Notificar quando abrir vaga]
    M --> L
    L --> N[Fim]
```

## 📊 Requisitos Funcionais Detalhados

### RF01: Recepção e Processamento de Mensagens
**Descrição:** Sistema deve receber mensagens do WhatsApp via webhook e processar em tempo real  
**Prioridade:** Crítica  
**Critérios de Aceitação:**
- Receber mensagens em < 2 segundos após envio
- Suportar texto, imagens, áudio, documentos
- Validar e sanitizar entrada antes de processar
- Responder com ACK ao WhatsApp
- Enfileirar mensagens se sistema sobrecarregado

### RF02: Classificação de Intenção
**Descrição:** Identificar automaticamente a intenção do usuário (vendas, suporte, agendamento, informação)  
**Prioridade:** Crítica  
**Critérios de Aceitação:**
- Precisão de classificação > 85%
- Suportar português brasileiro com gírias e erros ortográficos
- Detectar múltiplas intenções em uma mensagem
- Reclassificar se conversa mudar de tópico
- Extrair entidades (planos mencionados, datas, problemas)

### RF03: Geração de Respostas Contextuais
**Descrição:** Gerar respostas naturais e contextualizadas usando GPT-5  
**Prioridade:** Crítica  
**Critérios de Aceitação:**
- Tempo de resposta < 5 segundos
- Manter contexto de até 10 mensagens anteriores
- Personalizar resposta com nome do usuário
- Adaptar tom conforme perfil do cliente
- Incluir emojis e formatação apropriados

### RF04: Memória de Conversas (Qdrant)
**Descrição:** Armazenar e recuperar histórico completo de conversas de cada usuário  
**Prioridade:** Crítica  
**Critérios de Aceitação:**
- Salvar 100% das mensagens (entrada e saída)
- Busca semântica com score > 0.7
- Recuperar histórico em < 1 segundo
- Manter dados por mínimo 2 anos
- Permitir filtros por data, intent, usuário
- LGPD compliant (permitir exclusão de dados)

### RF05: Agendamento de Consultas
**Descrição:** Permitir agendamento de consultas médicas via conversação  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Integração com Google Calendar ou sistema próprio
- Verificar disponibilidade em tempo real
- Confirmar por WhatsApp com botões interativos
- Enviar lembrete 24h antes
- Permitir reagendamento/cancelamento via chat
- Sincronizar com CRM/sistema médico

### RF06: Qualificação de Leads
**Descrição:** Coletar informações relevantes e classificar leads  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Coletar nome, email, telefone, interesse
- Classificar em hot/warm/cold lead
- Calcular lead score baseado em interações
- Integrar com CRM (salvar em PostgreSQL)
- Notificar equipe de vendas para leads quentes
- Fazer follow-up automático após 48h se sem resposta

### RF07: Suporte Técnico Automatizado
**Descrição:** Resolver dúvidas comuns sobre lentes sem intervenção humana  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Base de conhecimento com 50+ perguntas frequentes
- Taxa de resolução automática > 70%
- Detectar problemas de saúde e escalar
- Oferecer tutoriais em vídeo quando relevante
- Coletar feedback sobre qualidade da resposta

### RF08: Handoff para Atendimento Humano
**Descrição:** Transferir conversa para atendente humano quando necessário  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Detectar automaticamente necessidade de handoff
- Permitir usuário solicitar atendente humano a qualquer momento
- Notificar equipe via Slack/Email/Dashboard
- Transferir contexto completo da conversa
- Tempo de handoff < 30 segundos durante horário comercial
- Informar tempo de espera ao usuário

### RF09: Envio de Links de Pagamento
**Descrição:** Gerar e enviar links de pagamento Asaas para checkout  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Integração com API Asaas
- Gerar link único por cliente
- Suportar PIX, boleto, cartão
- Rastrear conversão de link
- Notificar equipe quando pagamento confirmado
- Enviar comprovante via WhatsApp

### RF10: Analytics e Métricas
**Descrição:** Coletar e exibir métricas de performance do chatbot  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Dashboard com métricas em tempo real
- Métricas: volume de conversas, taxa de resolução, tempo médio de resposta, CSAT
- Análise de sentimento das conversas
- Identificar tópicos mais frequentes
- Relatório semanal automático para gestão
- Exportação de dados para BI

### RF11: Modo Fora do Horário Comercial
**Descrição:** Comportamento diferenciado fora do horário de atendimento  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Detectar automaticamente horário (8h-18h, seg-sex)
- Mensagem de auto-resposta personalizada
- Coletar informações para retorno no próximo dia útil
- Priorizar emergências mesmo fora do horário
- Notificar equipe no início do expediente

### RF12: Multicanal (Futuro)
**Descrição:** Expandir para outros canais além do WhatsApp  
**Prioridade:** Baixa  
**Critérios de Aceitação:**
- Suporte a Instagram DM
- Suporte a Telegram
- Suporte a chat no site
- Unificar histórico de todas as plataformas
- Identificar usuário entre canais

## 🔐 Requisitos Não-Funcionais

### RNF01: Performance
- Tempo de resposta médio < 3 segundos
- Suportar 1000 conversas simultâneas
- Latência de API < 200ms (p95)
- Uptime > 99.5%

### RNF02: Escalabilidade
- Escalar horizontalmente (múltiplas instâncias)
- Suportar crescimento de 300% em 12 meses
- Cache de respostas comuns (Redis)
- Queue system para picos de demanda (Bull/Redis)

### RNF03: Segurança
- Autenticação webhook com token secreto
- Criptografia de dados em repouso (Qdrant)
- Criptografia de dados em trânsito (TLS 1.3)
- Não armazenar dados sensíveis de saúde sem consentimento
- Rate limiting (100 mensagens/minuto por usuário)
- Detecção de spam/abuse

### RNF04: Conformidade LGPD
- Consentimento explícito para armazenar dados
- Permitir usuário solicitar exclusão de dados
- Anonimizar dados após 2 anos de inatividade
- Logs de acesso a dados pessoais
- Política de privacidade clara

### RNF05: Observabilidade
- Logs estruturados (Winston/Pino)
- Tracing distribuído (OpenTelemetry)
- Métricas em tempo real (Prometheus)
- Alertas automáticos (PagerDuty/Slack)
- Dashboard de saúde do sistema

### RNF06: Manutenibilidade
- Código TypeScript com cobertura de testes > 80%
- Documentação completa de APIs
- Deploy com zero-downtime
- Rollback automático em caso de erro
- Versionamento de prompts (Git)

## 🗄️ Estrutura de Dados

### PostgreSQL (Dados Estruturados)

```sql
-- Tabela de usuários/contatos
CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de conversas
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES whatsapp_contacts(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- active, closed, handed_off
  intent VARCHAR(50), -- sales, support, scheduling, information
  lead_stage VARCHAR(50), -- awareness, consideration, decision, customer
  assigned_agent VARCHAR(255), -- null para bot, nome se humano
  metadata JSONB DEFAULT '{}'
);

-- Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  message_id VARCHAR(255) UNIQUE, -- WhatsApp message ID
  sender_type VARCHAR(20) NOT NULL, -- user, bot, agent
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document
  sent_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  contact_id UUID REFERENCES whatsapp_contacts(id),
  appointment_date TIMESTAMP NOT NULL,
  appointment_type VARCHAR(100), -- first_consultation, follow_up, lens_fitting
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
  doctor_name VARCHAR(255) DEFAULT 'Dr. Philipe Saraiva',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES whatsapp_contacts(id),
  source VARCHAR(100) DEFAULT 'whatsapp_chatbot',
  score INTEGER DEFAULT 0, -- 0-100
  temperature VARCHAR(20), -- cold, warm, hot
  interested_plan VARCHAR(100),
  estimated_value DECIMAL(10, 2),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_leads_score ON leads(score DESC);
```

### Qdrant (Memória Vetorial)

```typescript
// Schema de coleção
{
  "name": "svlentes_conversations",
  "vectors": {
    "size": 3072,
    "distance": "Cosine"
  },
  "payload_schema": {
    "userId": { "type": "keyword", "indexed": true },
    "userName": { "type": "text" },
    "message": { "type": "text" },
    "role": { "type": "keyword", "indexed": true },
    "intent": { "type": "keyword", "indexed": true },
    "timestamp": { "type": "datetime", "indexed": true },
    "conversationId": { "type": "keyword", "indexed": true },
    "sentiment": { "type": "keyword", "indexed": true },
    "wasHandedOff": { "type": "bool", "indexed": true }
  }
}
```

## 🚀 Implementação

### Estrutura de Projeto

```
src/
├── chatbot/
│   ├── agents/
│   │   ├── sales.agent.ts
│   │   ├── support.agent.ts
│   │   ├── scheduling.agent.ts
│   │   └── information.agent.ts
│   ├── graph/
│   │   ├── workflow.ts
│   │   ├── nodes.ts
│   │   └── edges.ts
│   ├── memory/
│   │   ├── qdrant.service.ts
│   │   ├── conversation.memory.ts
│   │   └── context.manager.ts
│   ├── prompts/
│   │   ├── sales.prompt.ts
│   │   ├── support.prompt.ts
│   │   ├── scheduling.prompt.ts
│   │   └── system.prompt.ts
│   ├── utils/
│   │   ├── intent.classifier.ts
│   │   ├── entity.extractor.ts
│   │   ├── message.formatter.ts
│   │   └── sentiment.analyzer.ts
│   └── config/
│       ├── langchain.config.ts
│       ├── qdrant.config.ts
│       └── whatsapp.config.ts
├── api/
│   ├── webhooks/
│   │   └── whatsapp.webhook.ts
│   ├── routes/
│   │   ├── messages.route.ts
│   │   └── analytics.route.ts
│   └── middleware/
│       ├── auth.middleware.ts
│       └── ratelimit.middleware.ts
├── database/
│   ├── models/
│   │   ├── contact.model.ts
│   │   ├── conversation.model.ts
│   │   └── message.model.ts
│   └── repositories/
│       ├── contact.repository.ts
│       └── conversation.repository.ts
└── integrations/
    ├── whatsapp/
    │   ├── client.ts
    │   └── message.sender.ts
    ├── asaas/
    │   └── payment.service.ts
    └── calendar/
        └── appointment.service.ts
```

### Variáveis de Ambiente

```bash
# OpenAI (GPT-5)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=svlentes_conversations

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
WHATSAPP_API_VERSION=v18.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/svlentes
REDIS_URL=redis://localhost:6379

# Integrations
ASAAS_API_KEY=your-asaas-key
GOOGLE_CALENDAR_API_KEY=your-calendar-key

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## 📈 Métricas de Sucesso

### KPIs Principais
- **Taxa de Resolução Automática**: > 70%
- **Tempo Médio de Resposta**: < 3 segundos
- **CSAT (Customer Satisfaction)**: > 4.5/5
- **Taxa de Conversão de Leads**: > 15%
- **Uptime**: > 99.5%

### Métricas Operacionais
- Volume diário de conversas
- Taxa de handoff para humanos
- Tempo médio de handoff
- Conversas por intent
- Taxa de reengajamento (retorno em 30 dias)

### Métricas de Negócio
- Leads qualificados gerados
- Agendamentos realizados
- Receita gerada via chatbot
- Redução de custo de atendimento
- NPS do canal WhatsApp

## 🔄 Roadmap de Desenvolvimento

### Fase 1: MVP (4-6 semanas)
- [ ] Setup infraestrutura (Qdrant, PostgreSQL, Redis)
- [ ] Integração WhatsApp Business API
- [ ] Webhook handler básico
- [ ] LangChain + GPT-5 setup
- [ ] Intent classifier
- [ ] Sales Agent (planos e preços)
- [ ] Information Agent (FAQ)
- [ ] Memória básica em Qdrant
- [ ] Deploy staging

### Fase 2: Funcionalidades Avançadas (4-6 semanas)
- [ ] LangGraph workflow completo
- [ ] Support Agent com base de conhecimento
- [ ] Scheduling Agent + integração agenda
- [ ] Handoff para humano
- [ ] Busca semântica avançada
- [ ] Analytics dashboard
- [ ] Geração de links de pagamento
- [ ] Deploy produção (beta fechado)

### Fase 3: Otimização (4-6 semanas)
- [ ] Prompt engineering e fine-tuning
- [ ] Cache de respostas comuns
- [ ] Sistema de feedback e avaliação
- [ ] A/B testing de prompts
- [ ] Melhorias de performance
- [ ] Expansão da base de conhecimento
- [ ] Lançamento público

### Fase 4: Expansão (Futuro)
- [ ] Multicanal (Instagram, Telegram, site)
- [ ] Voz (transcrição de áudios)
- [ ] Imagens (análise de prescrição)
- [ ] Proatividade (follow-ups automáticos)
- [ ] Personalização avançada com ML
- [ ] Integração CRM completa

## 🧪 Testes

### Testes Unitários
```typescript
describe('Intent Classifier', () => {
  it('should classify sales intent correctly', async () => {
    const message = 'Quanto custa o plano mensal?';
    const result = await classifyIntent(message);
    expect(result.intent).toBe('sales');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### Testes de Integração
```typescript
describe('WhatsApp Webhook', () => {
  it('should process incoming message and respond', async () => {
    const mockMessage = createMockWhatsAppMessage();
    const response = await handleWebhook(mockMessage);
    expect(response.status).toBe(200);
  });
});
```

### Testes E2E
```typescript
describe('Sales Flow', () => {
  it('should complete full sales conversation', async () => {
    // Simular conversa completa de lead até conversão
    await sendMessage('Olá');
    await expectResponse(/Bem-vindo/);
    await sendMessage('Quero saber sobre planos');
    await expectResponse(/Plano Mensal|Trimestral|Semestral/);
    // ... continuar fluxo
  });
});
```

## 📚 Documentação de Referência

### Tecnologias
- [LangChain Documentation](https://js.langchain.com/docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OpenAI GPT-5 API](https://platform.openai.com/docs/models)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)

### Integrações
- [Asaas API](https://docs.asaas.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)

## 🤝 Contribuição e Manutenção

### Processo de Atualização de Prompts
1. Criar branch `prompts/feature-name`
2. Modificar prompts em `src/chatbot/prompts/`
3. Testar com casos de uso reais
4. Medir impacto em métricas
5. Code review
6. Deploy gradual (canary)

### Monitoring e Alertas
- Alertar se taxa de resolução < 60%
- Alertar se tempo de resposta > 10s
- Alertar se erro rate > 5%
- Alertar se handoff rate > 40%
- Dashboard em tempo real no Grafana

### Backup e Disaster Recovery
- Backup diário do Qdrant
- Backup horário do PostgreSQL
- Retenção: 30 dias
- RTO: 1 hora
- RPO: 15 minutos

---

**Versão:** 1.0  
**Data:** Outubro 2025  
**Autor:** Equipe SV Lentes  
**Status:** Documentação de Requisitos
