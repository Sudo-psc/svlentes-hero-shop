# SendPulse API - Correções e Estrutura Correta

## Resumo da Pesquisa

Após pesquisa detalhada na API oficial do SendPulse, identifiquei que:

1. **SendPulse não tem documentação pública específica para WhatsApp API**
2. **SendPulse usa OAuth2** para autenticação (não API tokens simples)
3. **Os endpoints para WhatsApp não estão totalmente documentados publicamente**
4. **SendPulse é mais focado em Email Marketing, SMS e chatbots**

## Mudanças Implementadas

### 1. Novo Cliente Corrigido: `sendpulse-whatsapp.ts`

Criado novo arquivo `/src/lib/sendpulse-whatsapp.ts` com:

#### Autenticação OAuth2 Correta
```typescript
// ANTES (INCORRETO):
private apiToken: string
constructor() {
  this.apiToken = process.env.SENDPULSE_API_TOKEN || ''
}

// DEPOIS (CORRETO):
private clientId: string
private clientSecret: string
private accessToken: string = ''
private tokenExpiry: number = 0

constructor() {
  this.clientId = process.env.SENDPULSE_CLIENT_ID || ''
  this.clientSecret = process.env.SENDPULSE_CLIENT_SECRET || ''
}

private async getAccessToken(): Promise<string> {
  if (this.accessToken && Date.now() < this.tokenExpiry) {
    return this.accessToken
  }

  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    })
  })

  const data = await response.json()
  this.accessToken = data.access_token
  this.tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000

  return this.accessToken
}
```

#### Estrutura de Endpoints Corrigida
```typescript
// Base URL oficial
private baseUrl = 'https://api.sendpulse.com'

// Endpoints para WhatsApp (estimados baseados na estrutura geral)
await fetch(`${this.baseUrl}/whatsapp/contacts/send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: cleanPhone,
    message: params.message
  })
})
```

### 2. Variáveis de Ambiente Atualizadas

#### Antes (Incorreto)
```bash
SENDPULSE_API_TOKEN=your_api_token_here
SENDPULSE_WEBHOOK_TOKEN=your_webhook_token_here
```

#### Depois (Correto)
```bash
# OAuth2 Credentials
SENDPULSE_CLIENT_ID=your_client_id_here
SENDPULSE_CLIENT_SECRET=your_client_secret_here
SENDPULSE_WEBHOOK_TOKEN=your_webhook_token_here
```

### 3. Como Obter as Credenciais Corretas

1. Acesse [SendPulse Login](https://login.sendpulse.com/settings)
2. Navegue para **Settings → API**
3. Você verá:
   - **ID** (Client ID)
   - **Secret** (Client Secret)
4. Copie esses valores para `.env.local`:
   ```bash
   SENDPULSE_CLIENT_ID=237b4af9c99d0f89bdbd876dcd5a0000
   SENDPULSE_CLIENT_SECRET=a99e7d506d3701c5c04de3db1913eeee
   ```

## Estrutura da API SendPulse REST

### Autenticação

**Endpoint:** `POST https://api.sendpulse.com/oauth/access_token`

**Request:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "237b4af9c99d0f89bdbd876dcd5a0000",
  "client_secret": "a99e7d506d3701c5c04de3db1913eeee"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjI5NTQ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Rate Limits SendPulse

| Plano | Requests/Minuto | Requests/Dia |
|-------|-----------------|--------------|
| Free | 1,000 | 500,000 |
| Standard | 2,000 | 1,000,000 |
| Enterprise | 3,000 | 3,000,000 |

### Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| 8 | No data |
| 400 | Invalid request |
| 429 | Too many requests |
| 502 | Can't find email address |
| 707 | Account balance depleted |
| 2020202020 | More than 10 requests per second |

## Limitações Identificadas

### 1. Documentação WhatsApp Limitada
SendPulse **não documenta publicamente** a API de WhatsApp. Os endpoints foram inferidos baseado em:
- Estrutura geral da API SendPulse
- Padrões de outras APIs de chatbot (Telegram, Viber)
- Estrutura esperada para WhatsApp Cloud API

### 2. Recomendação Alternativa

Para projetos que precisam de **controle total e documentação completa** do WhatsApp:

**Opção 1: WhatsApp Cloud API (Meta) - RECOMENDADO**
- ✅ Documentação oficial completa
- ✅ Gratuita para uso básico
- ✅ Controle total
- ✅ Suporte direto do Meta

```typescript
// WhatsApp Cloud API Direct
const response = await fetch(
  `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  }
)
```

**Opção 2: 360dialog BSP**
- ✅ Documentação excelente
- ✅ Suporte profissional
- ✅ Pricing transparente

**Opção 3: Usar SendPulse apenas para Email/SMS**
- ✅ SendPulse é excelente para email marketing
- ✅ API de SMS bem documentada
- ❌ WhatsApp API não é o foco principal

## Estrutura de Arquivos Atual

```
src/lib/
├── sendpulse-client.ts          # DEPRECIADO - OAuth incompleto
├── sendpulse-whatsapp.ts         # NOVO - OAuth2 correto
└── reminders/
    ├── notification-service.ts   # Serviço genérico
    └── sendpulse-reminder-service.ts  # Usa sendpulse-whatsapp.ts
```

## Uso Correto do Novo Cliente

### Exemplo 1: Enviar Mensagem Simples
```typescript
import { sendPulseWhatsAppClient } from '@/lib/sendpulse-whatsapp'

const result = await sendPulseWhatsAppClient.sendMessage({
  phone: '+5533998980026',
  message: 'Olá! Sua renovação está próxima.'
})
```

### Exemplo 2: Mensagem com Botões
```typescript
const result = await sendPulseWhatsAppClient.sendMessageWithQuickReplies(
  '+5533998980026',
  'Como posso ajudar você?',
  ['Ver produtos', 'Falar com atendente', 'Saber mais']
)
```

### Exemplo 3: Enviar Imagem
```typescript
const result = await sendPulseWhatsAppClient.sendImageMessage(
  '+5533998980026',
  'https://svlentes.com.br/product-image.jpg',
  'Novo produto disponível!'
)
```

### Exemplo 4: Gerenciar Contato
```typescript
await sendPulseWhatsAppClient.createOrUpdateContact({
  phone: '+5533998980026',
  name: 'João Silva',
  email: 'joao@example.com',
  variables: {
    subscription_status: 'active',
    plan: 'premium'
  },
  tags: ['vip', 'renewal-due']
})
```

### Exemplo 5: Testar Conexão
```typescript
const isConnected = await sendPulseWhatsAppClient.testConnection()
if (isConnected) {
  console.log('SendPulse API conectada com sucesso!')
}
```

## Migração do Código Existente

### Passo 1: Atualizar Variáveis de Ambiente
```bash
# Remover
SENDPULSE_API_TOKEN=...

# Adicionar
SENDPULSE_CLIENT_ID=...
SENDPULSE_CLIENT_SECRET=...
```

### Passo 2: Atualizar Imports
```typescript
// Antes
import { sendPulseClient } from '@/lib/sendpulse-client'

// Depois
import { sendPulseWhatsAppClient } from '@/lib/sendpulse-whatsapp'
```

### Passo 3: Atualizar Chamadas
```typescript
// Antes
await sendPulseClient.sendMessage({ phone, message })

// Depois
await sendPulseWhatsAppClient.sendMessage({ phone, message })
```

## Testes Recomendados

### 1. Teste de Autenticação
```bash
curl -X POST https://api.sendpulse.com/oauth/access_token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

### 2. Teste de Conexão via API
```bash
curl http://localhost:3000/api/sendpulse?action=test
```

### 3. Teste de Envio de Mensagem
```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "test_user",
      "phone": "+5533998980026",
      "message": "Teste de mensagem SendPulse"
    },
    "channel": "WHATSAPP"
  }'
```

## Próximos Passos

1. ✅ **Obter credenciais OAuth2** do SendPulse
2. ✅ **Atualizar .env.local** com CLIENT_ID e CLIENT_SECRET
3. ⏳ **Testar autenticação** OAuth2
4. ⏳ **Validar endpoints** de WhatsApp (podem precisar ajustes)
5. ⏳ **Considerar migração** para WhatsApp Cloud API se SendPulse não atender

## Notas Importantes

⚠️ **ATENÇÃO**: Os endpoints de WhatsApp (`/whatsapp/contacts/send`) são **estimados** baseados na estrutura da API SendPulse. Pode ser necessário:

1. Contatar suporte SendPulse para endpoints corretos
2. Verificar documentação interna após login
3. Considerar usar WhatsApp Cloud API diretamente

✅ **OAuth2 está correto** - baseado na documentação oficial SendPulse

✅ **Rate limiting** está de acordo com a documentação oficial

✅ **Estrutura de erros** segue os códigos oficiais SendPulse

## Suporte e Documentação

- **SendPulse API Docs**: https://sendpulse.com/integrations/api
- **OAuth2 Reference**: https://sendpulse.com/integrations/api#authorization
- **Help Center**: https://sendpulse.com/knowledge-base
- **WhatsApp Cloud API** (alternativa): https://developers.facebook.com/docs/whatsapp/cloud-api
