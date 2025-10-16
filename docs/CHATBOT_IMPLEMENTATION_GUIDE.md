# 🚀 Guia de Implementação Rápida - Chatbot WhatsApp

## 📋 Pré-requisitos

### Contas Necessárias
- [ ] OpenAI API Key (para GPT-5 e embeddings)
- [ ] Qdrant Cloud account (ou Docker local)
- [ ] WhatsApp Business API access (Meta Cloud API)
- [ ] PostgreSQL database
- [ ] Redis instance

### Ferramentas Necessárias
```bash
- Node.js 18+
- npm ou yarn
- Docker (opcional, para desenvolvimento local)
- Git
```

## 🔧 Setup Inicial

### 1. Instalar Dependências

```bash
# Core dependencies
npm install @langchain/openai @langchain/community @langchain/core
npm install @langchain/langgraph
npm install @qdrant/js-client-rest
npm install bullmq ioredis
npm install zod uuid

# Tipos TypeScript
npm install -D @types/uuid
```

### 2. Configurar Variáveis de Ambiente

Crie arquivo `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo  # ou gpt-5 quando disponível
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=svlentes_conversations

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_ACCESS_TOKEN=your-permanent-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_API_VERSION=v18.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/svlentes
REDIS_URL=redis://localhost:6379

# Application
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NODE_ENV=development
```

### 3. Inicializar Qdrant

```typescript
// scripts/init-qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

async function initializeQdrant() {
  console.log('Creating Qdrant collection...');
  
  await client.createCollection('svlentes_conversations', {
    vectors: {
      size: 3072, // text-embedding-3-large
      distance: 'Cosine',
    },
  });

  // Create indexes
  await client.createPayloadIndex('svlentes_conversations', {
    field_name: 'userId',
    field_schema: 'keyword',
  });

  await client.createPayloadIndex('svlentes_conversations', {
    field_name: 'timestamp',
    field_schema: 'datetime',
  });

  await client.createPayloadIndex('svlentes_conversations', {
    field_name: 'intent',
    field_schema: 'keyword',
  });

  console.log('✅ Qdrant collection created successfully!');
}

initializeQdrant().catch(console.error);
```

Executar:
```bash
npx ts-node scripts/init-qdrant.ts
```

### 4. Configurar Database (PostgreSQL)

```sql
-- migrations/001_create_chatbot_tables.sql

-- Tabela de contatos
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
  status VARCHAR(50) DEFAULT 'active',
  intent VARCHAR(50),
  lead_stage VARCHAR(50),
  assigned_agent VARCHAR(255),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  message_id VARCHAR(255) UNIQUE,
  sender_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  sent_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  contact_id UUID REFERENCES whatsapp_contacts(id),
  appointment_date TIMESTAMP NOT NULL,
  appointment_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled',
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
  score INTEGER DEFAULT 0,
  temperature VARCHAR(20),
  interested_plan VARCHAR(100),
  estimated_value DECIMAL(10, 2),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_leads_score ON leads(score DESC);
```

### 5. Configurar WhatsApp Webhook

#### A. Configurar Webhook no Meta for Developers

1. Acesse https://developers.facebook.com/apps
2. Selecione seu app WhatsApp Business
3. Vá em "WhatsApp" > "Configuration"
4. Configure o webhook:
   - **Callback URL**: `https://svlentes.com.br/api/webhooks/whatsapp`
   - **Verify Token**: (use o valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
5. Subscribe aos eventos: `messages`

#### B. Criar API Route

```typescript
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GET: Verificação do webhook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Receber mensagens
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verificar signature (segurança)
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Processar mensagens
    const messages = data.entry?.[0]?.changes?.[0]?.value?.messages;
    
    if (messages && messages.length > 0) {
      for (const message of messages) {
        // Enfileirar para processamento
        await queueMessage(message);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 🎯 Implementação dos Componentes

### 1. Qdrant Memory Service

```typescript
// src/lib/chatbot/memory/qdrant.service.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';

export class QdrantMemoryService {
  private client: QdrantClient;
  private embeddings: OpenAIEmbeddings;
  private collectionName = 'svlentes_conversations';

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async saveMessage(params: {
    userId: string;
    userName: string;
    message: string;
    role: 'user' | 'assistant';
    intent?: string;
    conversationId: string;
  }) {
    const id = uuidv4();
    const embedding = await this.embeddings.embedQuery(params.message);

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id,
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

    return id;
  }

  async getUserHistory(userId: string, limit: number = 10) {
    const results = await this.client.scroll(this.collectionName, {
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      limit,
      with_payload: true,
      order_by: { key: 'timestamp', direction: 'desc' },
    });

    return results.points.map(p => ({
      message: p.payload.message as string,
      role: p.payload.role as 'user' | 'assistant',
      timestamp: p.payload.timestamp as string,
    }));
  }

  async semanticSearch(query: string, userId: string, limit: number = 5) {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      limit,
      with_payload: true,
    });

    return results.map(r => ({
      message: r.payload.message as string,
      role: r.payload.role as 'user' | 'assistant',
      score: r.score,
    }));
  }
}

// Singleton instance
export const qdrantMemory = new QdrantMemoryService();
```

### 2. Sales Agent (Exemplo)

```typescript
// src/lib/chatbot/agents/sales.agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { qdrantMemory } from '../memory/qdrant.service';

const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const salesPrompt = PromptTemplate.fromTemplate(`
Você é um consultor de vendas da SV Lentes, especializado em lentes de contato.

PLANOS DISPONÍVEIS:
- Mensal: R$ 179,00/mês - 2 caixas/mês - 1 consulta a cada 6 meses
- Trimestral: R$ 499,00 (R$ 166,33/mês) - 6 caixas - Desconto 7%
- Semestral: R$ 899,00 (R$ 149,83/mês) - 12 caixas - Desconto 16%

CONTEXTO DO CLIENTE:
- Nome: {userName}
- Cliente ativo: {isCustomer}
- Conversas anteriores: {previousConversations}

HISTÓRICO:
{chatHistory}

MENSAGEM DO CLIENTE:
{userMessage}

INSTRUÇÕES:
- Seja empático e consultivo
- Destaque a economia vs compra avulsa
- Mencione acompanhamento médico com Dr. Philipe Saraiva
- Use emojis moderadamente (👓 💚 📅)
- Se alta intenção, ofereça link de pagamento

Responda de forma natural:
`);

export async function handleSalesConversation(state: any) {
  const { userId, userName, messages } = state;
  
  // Recuperar histórico
  const history = await qdrantMemory.getUserHistory(userId, 5);
  
  const chatHistory = history
    .map(h => `${h.role}: ${h.message}`)
    .join('\n');
  
  const userMessage = messages[messages.length - 1].content;
  
  // Gerar resposta
  const chain = salesPrompt.pipe(llm);
  const response = await chain.invoke({
    userName,
    isCustomer: state.context.isCustomer,
    previousConversations: history.length,
    chatHistory,
    userMessage,
  });
  
  // Salvar resposta
  await qdrantMemory.saveMessage({
    userId,
    userName,
    message: response.content as string,
    role: 'assistant',
    intent: 'sales',
    conversationId: state.metadata.conversationId,
  });
  
  return {
    ...state,
    messages: [...messages, response],
  };
}
```

### 3. WhatsApp Sender

```typescript
// src/lib/whatsapp/sender.ts
import axios from 'axios';

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export async function sendWhatsAppMessage(params: {
  to: string;
  type: 'text' | 'interactive';
  text?: { body: string; preview_url?: boolean };
  interactive?: any;
}) {
  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: params.to,
        type: params.type,
        ...params,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
```

## 🧪 Testando o Sistema

### 1. Teste do Webhook

```bash
# Enviar uma mensagem de teste para seu número WhatsApp Business
curl -X POST "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5533998601427",
    "type": "text",
    "text": {
      "body": "Olá! Este é um teste do chatbot SV Lentes."
    }
  }'
```

### 2. Teste do Qdrant

```typescript
// scripts/test-qdrant.ts
import { qdrantMemory } from '../src/lib/chatbot/memory/qdrant.service';

async function testQdrant() {
  // Salvar mensagem de teste
  const id = await qdrantMemory.saveMessage({
    userId: '5533998601427',
    userName: 'Teste',
    message: 'Olá, quero saber sobre os planos',
    role: 'user',
    intent: 'sales',
    conversationId: 'test-conv-1',
  });

  console.log('Mensagem salva:', id);

  // Recuperar histórico
  const history = await qdrantMemory.getUserHistory('5533998601427');
  console.log('Histórico:', history);

  // Busca semântica
  const results = await qdrantMemory.semanticSearch(
    'quanto custa',
    '5533998601427'
  );
  console.log('Busca semântica:', results);
}

testQdrant().catch(console.error);
```

### 3. Teste E2E

```typescript
// tests/chatbot.e2e.test.ts
import { sendWhatsAppMessage } from '../src/lib/whatsapp/sender';

describe('Chatbot E2E', () => {
  it('should handle sales conversation', async () => {
    // Simular conversa de vendas
    const responses = [];
    
    // Mensagem 1
    await sendTestMessage('Olá');
    responses.push(await waitForResponse());
    
    // Mensagem 2
    await sendTestMessage('Quero saber sobre planos');
    responses.push(await waitForResponse());
    
    expect(responses[0]).toContain('Bem-vindo');
    expect(responses[1]).toContain('planos');
  });
});
```

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Add environment variables
vercel env add OPENAI_API_KEY
vercel env add QDRANT_URL
# ... (adicionar todas as variáveis)

# 5. Deploy
vercel --prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build e run
docker build -t svlentes-chatbot .
docker run -p 3000:3000 --env-file .env.production svlentes-chatbot
```

## 📊 Monitoramento

### Logs
```bash
# Ver logs em produção (Vercel)
vercel logs

# Ver logs locais
npm run dev
```

### Métricas
- Dashboard Qdrant: https://cloud.qdrant.io
- OpenAI Usage: https://platform.openai.com/usage
- WhatsApp Analytics: Meta Business Suite

## 🐛 Troubleshooting

### Erro: "Webhook verification failed"
- Verifique se `WHATSAPP_WEBHOOK_VERIFY_TOKEN` está correto
- Confirme que a URL está acessível publicamente

### Erro: "Qdrant connection failed"
- Verifique se `QDRANT_URL` e `QDRANT_API_KEY` estão corretos
- Teste conexão: `curl https://your-cluster.qdrant.io:6333/collections`

### Erro: "OpenAI API error"
- Verifique saldo da conta OpenAI
- Confirme que `OPENAI_API_KEY` é válida
- Verifique rate limits

### Mensagens não chegam
- Verifique webhook no Meta for Developers
- Confirme que o número está aprovado
- Teste com curl direto na API do WhatsApp

## 📚 Próximos Passos

1. ✅ Implementar Sales Agent completo
2. ✅ Adicionar Support Agent
3. ✅ Criar Scheduling Agent
4. ✅ Implementar handoff para humano
5. ✅ Adicionar analytics dashboard
6. ✅ Configurar alertas e monitoring
7. ✅ Fazer testes de carga
8. ✅ Lançar beta fechado

---

**Dúvidas?** Consulte a [documentação completa](./CHATBOT_README.md) ou entre em contato com a equipe técnica.
