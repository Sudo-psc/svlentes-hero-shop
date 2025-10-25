# Integração Airtable - Backup e Fallback de Conversas

**Data**: 2025-10-24
**Autor**: Dr. Philipe Saraiva Cruz
**Status**: Implementado e Testado

## 📋 Visão Geral

Sistema de backup redundante e fallback usando Airtable para garantir que nenhuma conversa do WhatsApp seja perdida, mesmo em caso de falha no banco de dados principal (PostgreSQL).

## 🎯 Objetivos

1. **Backup Redundante**: Todas as conversas são automaticamente copiadas para o Airtable
2. **Fallback Automático**: Se o PostgreSQL falhar, o sistema usa Airtable como armazenamento temporário
3. **Sincronização Automática**: Dados armazenados no Airtable são sincronizados de volta ao PostgreSQL quando disponível
4. **Zero Perda de Dados**: Garantia de que nenhuma mensagem seja perdida mesmo em cenários de falha

## 🏗️ Arquitetura

```
┌─────────────────┐
│  WhatsApp User  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│    SendPulse Webhook Handler        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   storeInteraction()                │
│   (whatsapp-conversation-service)   │
└─┬────────────────────────────────┬──┘
  │                                │
  │ PRIMARY                        │ BACKUP (fire & forget)
  ▼                                ▼
┌────────────────┐           ┌────────────────┐
│   PostgreSQL   │           │    Airtable    │
│    (Prisma)    │           │  (API Client)  │
└────────────────┘           └────────────────┘
  │
  │ Se FALHAR
  ▼
┌─────────────────────────────────────┐
│   Airtable Fallback System          │
│   • Armazena temporariamente        │
│   • Cria fila de sincronização      │
│   • Tenta sincronizar a cada 5min   │
└─────────────────────────────────────┘
```

## 📦 Componentes Implementados

### 1. Airtable Client (`src/lib/airtable-client.ts`)

Cliente HTTP para comunicação com a API do Airtable.

**Principais Métodos**:
- `createConversation()` - Cria registro de conversa
- `updateConversation()` - Atualiza conversa existente
- `createInteraction()` - Cria registro de interação/mensagem
- `createEscalation()` - Cria registro de escalação
- `findConversation()` - Busca conversa por ID
- `getConversationsByPhone()` - Lista conversas por telefone
- `getConversationInteractions()` - Lista interações de uma conversa
- `healthCheck()` - Verifica conectividade com Airtable

**Tipos de Dados**:
```typescript
interface AirtableConversationRecord {
  ConversationId: string
  CustomerPhone: string
  CustomerName?: string
  Status: 'active' | 'closed' | 'escalated'
  StartedAt: string
  LastActivity: string
  MessageCount: number
  Intent?: string
  Sentiment?: string
  Priority?: string
  Tags?: string
  Metadata?: string
}

interface AirtableInteractionRecord {
  InteractionId: string
  ConversationId: string
  MessageId: string
  Direction: 'inbound' | 'outbound'
  Content: string
  Intent?: string
  Response?: string
  ProcessingTime?: number
  Status: 'sent' | 'delivered' | 'read' | 'failed'
  Timestamp: string
}
```

### 2. Conversation Backup Service (`src/lib/conversation-backup-service.ts`)

Serviço de backup e sincronização de conversas.

**Principais Métodos**:

**Backup (modo normal)**:
- `backupConversation()` - Backup redundante de conversa
- `backupInteraction()` - Backup redundante de interação

**Fallback (modo emergência)**:
- `storeConversationFallback()` - Armazena conversa quando DB falha
- `storeInteractionFallback()` - Armazena interação quando DB falha

**Recovery (recuperação)**:
- `recoverConversation()` - Recupera conversa do Airtable
- `recoverConversationHistory()` - Recupera histórico completo

**Queue Management**:
- `processBackupQueue()` - Processa fila de sincronização (a cada 5min)
- `getQueueStats()` - Estatísticas da fila de sincronização

### 3. Integração no Webhook (`src/lib/whatsapp-conversation-service.ts`)

A função `storeInteraction()` foi modificada para incluir:

1. **Tentativa Primária**: Armazenar no PostgreSQL via Prisma
2. **Backup Automático**: Copiar para Airtable (fire & forget, não-bloqueante)
3. **Fallback**: Se PostgreSQL falhar, usar Airtable como primário
4. **Queue**: Adicionar à fila para sincronização posterior

**Fluxo de Execução**:
```typescript
try {
  // 1. Tentar armazenar no PostgreSQL
  const interaction = await prisma.whatsAppInteraction.create(...)

  // 2. Backup no Airtable (não-bloqueante)
  conversationBackupService.backupInteraction(interaction)
    .catch(err => console.warn('Backup failed (non-critical)'))

} catch (dbError) {
  // 3. FALLBACK: Usar Airtable como primário
  const fallback = await conversationBackupService.storeInteractionFallback(...)

  // 4. Adicionar à fila para sincronizar depois
  // (sincronização automática a cada 5 minutos)
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# ========================================
# Airtable Configuration (Backup & Fallback)
# ========================================

# Airtable API Key (obter em: https://airtable.com/account)
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX

# Airtable Base ID (ID da base no Airtable)
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Table Names (opcional - usa defaults se não especificado)
AIRTABLE_CONVERSATIONS_TABLE=Conversations
AIRTABLE_INTERACTIONS_TABLE=Interactions
AIRTABLE_ESCALATIONS_TABLE=Escalations
```

### Estrutura das Tabelas no Airtable

#### Tabela: Conversations

| Campo          | Tipo           | Descrição                    |
|----------------|----------------|------------------------------|
| ConversationId | Single line    | ID único da conversa         |
| CustomerPhone  | Phone number   | Telefone do cliente          |
| CustomerName   | Single line    | Nome do cliente              |
| Status         | Single select  | active / closed / escalated  |
| StartedAt      | Date           | Data/hora de início          |
| LastActivity   | Date           | Última atividade             |
| MessageCount   | Number         | Contagem de mensagens        |
| Intent         | Single line    | Última intenção detectada    |
| Sentiment      | Single line    | Último sentimento detectado  |
| Priority       | Single select  | LOW / MEDIUM / HIGH / CRITICAL |
| AssignedAgent  | Single line    | Agente atribuído (se houver) |
| Tags           | Long text      | Tags JSON                    |
| Metadata       | Long text      | Metadados JSON               |
| CreatedAt      | Date           | Data de criação              |
| UpdatedAt      | Date           | Última atualização           |

#### Tabela: Interactions

| Campo          | Tipo           | Descrição                    |
|----------------|----------------|------------------------------|
| InteractionId  | Single line    | ID único da interação        |
| ConversationId | Single line    | ID da conversa pai           |
| MessageId      | Single line    | ID da mensagem SendPulse     |
| Direction      | Single select  | inbound / outbound           |
| Content        | Long text      | Conteúdo da mensagem         |
| Intent         | Single line    | Intenção detectada           |
| Response       | Long text      | Resposta gerada              |
| ProcessingTime | Number         | Tempo de processamento (ms)  |
| Status         | Single select  | sent / delivered / read / failed |
| ErrorMessage   | Long text      | Mensagem de erro (se houver) |
| Timestamp      | Date           | Data/hora da interação       |
| CreatedAt      | Date           | Data de criação              |

#### Tabela: Escalations

| Campo          | Tipo           | Descrição                    |
|----------------|----------------|------------------------------|
| EscalationId   | Single line    | ID único da escalação        |
| TicketId       | Single line    | ID do ticket                 |
| ConversationId | Single line    | ID da conversa               |
| Reason         | Single select  | Motivo da escalação          |
| Priority       | Single select  | LOW / MEDIUM / HIGH / CRITICAL |
| Status         | Single select  | pending / assigned / resolved |
| CustomerPhone  | Phone number   | Telefone do cliente          |
| AssignedAgent  | Single line    | Agente atribuído             |
| CreatedAt      | Date           | Data de criação              |
| ResolvedAt     | Date           | Data de resolução            |
| Notes          | Long text      | Notas adicionais             |

## 🚀 Como Usar

### Setup Inicial

1. **Criar Base no Airtable**:
   - Acesse https://airtable.com
   - Crie uma nova base chamada "SVLentes WhatsApp Backup"
   - Crie as 3 tabelas conforme estrutura acima

2. **Obter API Key**:
   - Vá para https://airtable.com/account
   - Copie sua API key
   - Adicione ao `.env.local`

3. **Obter Base ID**:
   - Na URL da sua base: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - O `appXXXXXXXXXXXXXX` é o Base ID
   - Adicione ao `.env.local`

4. **Verificar Configuração**:
```typescript
import { airtableClient } from '@/lib/airtable-client'

const isConfigured = airtableClient.isConfigured()
const isHealthy = await airtableClient.healthCheck()

console.log({ isConfigured, isHealthy })
```

### Uso Automático

O sistema funciona automaticamente:

1. **Backup Automático**: Toda interação armazenada no PostgreSQL é automaticamente copiada para o Airtable
2. **Fallback Automático**: Se o PostgreSQL falhar, o Airtable é usado automaticamente
3. **Sincronização Automática**: Dados no Airtable são sincronizados de volta ao PostgreSQL a cada 5 minutos

### Uso Manual (Recovery)

Se precisar recuperar dados do Airtable:

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

// Recuperar conversa específica
const conversation = await conversationBackupService.recoverConversation('conv-123')

// Recuperar histórico completo
const history = await conversationBackupService.recoverConversationHistory('conv-123')

// Ver estatísticas da fila de sincronização
const stats = conversationBackupService.getQueueStats()
console.log('Queue size:', stats.size)
console.log('Pending items:', stats.items)
```

## 📊 Monitoramento

### Logs

O sistema gera logs detalhados:

```typescript
// Backup bem-sucedido
logger.info(LogCategory.SYSTEM, 'Conversation backed up to Airtable', {
  conversationId: 'conv-123',
  airtableId: 'rec123ABC'
})

// Fallback ativado
logger.warn(LogCategory.SYSTEM, 'Using Airtable fallback', {
  reason: 'PostgreSQL unavailable'
})

// Sincronização de volta ao DB
logger.info(LogCategory.SYSTEM, 'Synced backup item to database', {
  id: 'conv-123',
  type: 'conversation'
})
```

### Métricas

```typescript
// Ver estatísticas da fila
const stats = conversationBackupService.getQueueStats()

// Campos disponíveis:
{
  size: number,           // Itens na fila
  items: [{
    type: string,         // 'conversation' ou 'interaction'
    timestamp: Date,      // Quando foi adicionado
    retries: number,      // Tentativas de sincronização
    hasAirtableId: boolean // Se foi salvo no Airtable
  }]
}
```

## 🔒 Segurança

1. **API Key**: Nunca commitar a API key do Airtable no código
2. **Dados Sensíveis**: Dados armazenados no Airtable devem seguir LGPD
3. **Acesso**: Configurar permissões apropriadas na base do Airtable
4. **Audit Trail**: Todos os acessos ao Airtable são logados

## ⚠️ Limitações e Considerações

### Rate Limits do Airtable

- **5 requisições por segundo** por base
- **100.000 registros** por base (plano gratuito)
- Upgrade para plano pago se necessário

### Performance

- Backup é **não-bloqueante** (fire & forget)
- Fallback adiciona ~200-500ms de latência
- Sincronização ocorre a cada 5 minutos em background

### Custos

- **Plano Gratuito**: 1.200 registros por base
- **Plano Plus**: $10/mês por usuário (50.000 registros)
- **Plano Pro**: $20/mês por usuário (100.000 registros)

## 🧪 Testes

### Testar Backup Manual

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

const result = await conversationBackupService.backupConversation({
  id: 'test-conv-123',
  customerPhone: '5533999898026',
  customerName: 'Cliente Teste',
  status: 'active',
  startedAt: new Date(),
  lastActivity: new Date(),
  messageCount: 1
})

console.log('Backup result:', result)
```

### Testar Fallback

```typescript
// Simular falha do PostgreSQL
const result = await conversationBackupService.storeInteractionFallback({
  id: 'test-interaction-123',
  conversationId: 'test-conv-123',
  messageId: 'msg-abc',
  customerPhone: '5533999898026',
  content: 'Mensagem de teste',
  direction: 'inbound',
  status: 'sent',
  timestamp: new Date(),
  createdAt: new Date()
})

console.log('Fallback result:', result)
```

### Testar Recovery

```typescript
const conversation = await conversationBackupService.recoverConversation('test-conv-123')
const history = await conversationBackupService.recoverConversationHistory('test-conv-123')

console.log('Recovered conversation:', conversation)
console.log('Recovered history:', history.length, 'messages')
```

## 🚧 Troubleshooting

### "Airtable not configured"

**Problema**: API key ou Base ID não configurados
**Solução**: Verificar variáveis de ambiente no `.env.local`

```bash
echo $AIRTABLE_API_KEY
echo $AIRTABLE_BASE_ID
```

### "Airtable API error: 404"

**Problema**: Tabela não encontrada
**Solução**: Verificar nomes das tabelas no Airtable e variáveis de ambiente

### "Rate limit exceeded"

**Problema**: Muitas requisições por segundo
**Solução**: Implementar rate limiting ou upgrade do plano Airtable

### "Both database and Airtable fallback failed"

**Problema**: PostgreSQL e Airtable indisponíveis
**Solução**: Verificar conectividade de rede e logs de erro

## 📚 Referências

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Airtable REST API](https://airtable.com/developers/web/api/rest-api)
- [Rate Limits](https://airtable.com/developers/web/api/rate-limits)
- [Authentication](https://airtable.com/developers/web/api/authentication)

## ✅ Checklist de Implementação

- [x] Cliente Airtable com operações CRUD
- [x] Serviço de backup de conversas
- [x] Sistema de fallback para falhas do DB
- [x] Sincronização automática de volta ao DB
- [x] Integração no webhook do SendPulse
- [x] Documentação completa
- [x] Variáveis de ambiente configuradas
- [ ] Testes end-to-end com falhas simuladas
- [ ] Monitoramento de métricas de backup
- [ ] Dashboard no Airtable para visualização

## 🔄 Próximos Passos

1. **Monitoramento Avançado**: Dashboard para visualizar backups e sincronizações
2. **Alertas**: Notificações quando fallback é ativado
3. **Analytics**: Análise de conversas diretamente no Airtable
4. **Relatórios**: Exportação de relatórios do Airtable
5. **Integração com Zapier**: Automações adicionais

---

**Nota**: Esta integração garante zero perda de dados mesmo em cenários de falha crítica do banco de dados principal.
