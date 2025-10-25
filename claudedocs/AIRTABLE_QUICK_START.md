# Airtable Integration - Quick Start Guide

**Tempo estimado**: 15 minutos

## 🚀 Setup Rápido

### Passo 1: Criar Base no Airtable (5 min)

1. Acesse https://airtable.com e faça login
2. Clique em "Add a base" → "Start from scratch"
3. Nomeie a base: **"SVLentes WhatsApp Backup"**

### Passo 2: Criar Tabelas (5 min)

#### Tabela 1: Conversations

1. Renomeie a primeira tabela para **"Conversations"**
2. Adicione os seguintes campos:

```
ConversationId    → Single line text (Primary field)
CustomerPhone     → Phone number
CustomerName      → Single line text
Status            → Single select (options: active, closed, escalated)
StartedAt         → Date (include time)
LastActivity      → Date (include time)
MessageCount      → Number (integer)
Intent            → Single line text
Sentiment         → Single line text
Priority          → Single select (options: LOW, MEDIUM, HIGH, CRITICAL)
AssignedAgent     → Single line text
Tags              → Long text
Metadata          → Long text
CreatedAt         → Date (include time)
UpdatedAt         → Date (include time)
```

#### Tabela 2: Interactions

1. Crie nova tabela: **"Interactions"**
2. Adicione os campos:

```
InteractionId     → Single line text (Primary field)
ConversationId    → Single line text
MessageId         → Single line text
Direction         → Single select (options: inbound, outbound)
Content           → Long text
Intent            → Single line text
Response          → Long text
ProcessingTime    → Number (integer)
Status            → Single select (options: sent, delivered, read, failed)
ErrorMessage      → Long text
Timestamp         → Date (include time)
CreatedAt         → Date (include time)
```

#### Tabela 3: Escalations

1. Crie nova tabela: **"Escalations"**
2. Adicione os campos:

```
EscalationId      → Single line text (Primary field)
TicketId          → Single line text
ConversationId    → Single line text
Reason            → Single line text
Priority          → Single select (options: LOW, MEDIUM, HIGH, CRITICAL)
Status            → Single select (options: pending, assigned, resolved)
CustomerPhone     → Phone number
AssignedAgent     → Single line text
CreatedAt         → Date (include time)
ResolvedAt        → Date (include time)
Notes             → Long text
```

### Passo 3: Obter Credenciais (3 min)

1. **API Key**:
   - Acesse https://airtable.com/account
   - Clique em "Generate API key"
   - Copie a chave: `keyXXXXXXXXXXXXXX`

2. **Base ID**:
   - Abra sua base no Airtable
   - Olhe a URL: `https://airtable.com/appXXXXXXXXXXXXXX/tblXXXXXXXXXXXXXX`
   - Copie o `appXXXXXXXXXXXXXX` (é o Base ID)

### Passo 4: Configurar Variáveis de Ambiente (2 min)

1. Edite o arquivo `.env.local`:

```bash
# ========================================
# Airtable Configuration (Backup & Fallback)
# ========================================
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX              # Cole sua API Key aqui
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX              # Cole seu Base ID aqui
AIRTABLE_CONVERSATIONS_TABLE=Conversations       # Não altere
AIRTABLE_INTERACTIONS_TABLE=Interactions         # Não altere
AIRTABLE_ESCALATIONS_TABLE=Escalations           # Não altere
```

2. Salve o arquivo

### Passo 5: Verificar Configuração (1 min)

1. Reinicie a aplicação:

```bash
npm run dev
```

2. Teste a conexão (opcional):

```bash
curl http://localhost:3000/api/airtable/health
```

Ou use o console do navegador:

```javascript
// Abra DevTools → Console
fetch('/api/airtable/health')
  .then(r => r.json())
  .then(console.log)
```

## ✅ Pronto!

O sistema agora está configurado e funcionando:

- ✅ Backup automático no Airtable
- ✅ Fallback em caso de falha do PostgreSQL
- ✅ Sincronização automática a cada 5 minutos

## 🧪 Testar o Sistema

### Teste 1: Enviar Mensagem WhatsApp

1. Envie uma mensagem via WhatsApp para: `(33) 99989-8026`
2. Aguarde a resposta do bot
3. Verifique no Airtable:
   - Tabela **Conversations**: Deve ter 1 novo registro
   - Tabela **Interactions**: Deve ter 1 novo registro

### Teste 2: Ver Backups no Airtable

1. Acesse sua base no Airtable
2. Navegue pelas tabelas
3. Você verá todas as conversas e mensagens sendo armazenadas

### Teste 3: Estatísticas da Fila

No código ou API:

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

const stats = conversationBackupService.getQueueStats()
console.log('Queue size:', stats.size)
console.log('Items:', stats.items)
```

## 📊 Visualizar Dados no Airtable

### Views Recomendadas

1. **Active Conversations** (Tabela Conversations):
   - Filtro: `Status = "active"`
   - Ordenar: `LastActivity` (mais recente primeiro)

2. **Recent Messages** (Tabela Interactions):
   - Ordenar: `Timestamp` (mais recente primeiro)
   - Limite: 50 registros

3. **Escalations Pending** (Tabela Escalations):
   - Filtro: `Status = "pending"`
   - Ordenar: `Priority` (CRITICAL primeiro)

### Fórmulas Úteis

1. **Tempo de Resposta** (em Interactions):
```
DATETIME_DIFF(CreatedAt, Timestamp, 'seconds')
```

2. **Idade da Conversa** (em Conversations):
```
DATETIME_DIFF(NOW(), StartedAt, 'hours')
```

3. **Taxa de Escalação**:
```
(COUNT(Escalations) / MessageCount) * 100
```

## 🔍 Troubleshooting

### "Failed to create Airtable record"

**Causa**: API Key ou Base ID incorretos
**Solução**:
```bash
# Verificar variáveis
echo $AIRTABLE_API_KEY
echo $AIRTABLE_BASE_ID

# Re-copiar do Airtable e atualizar .env.local
```

### "Table not found"

**Causa**: Nomes das tabelas não correspondem
**Solução**:
- Verifique os nomes exatos no Airtable
- Compare com variáveis `AIRTABLE_*_TABLE` no `.env.local`

### "Rate limit exceeded"

**Causa**: Muitas requisições (>5 por segundo)
**Solução**:
- Airtable Free: 5 req/s
- Considerar upgrade de plano se necessário

## 📱 Monitoramento no Airtable

### Dashboard Simples

1. Crie uma nova **View** tipo **Grid**
2. Adicione campos de resumo:
   - Total de Conversas
   - Conversas Ativas
   - Total de Mensagens Hoje
   - Escalações Pendentes

3. Use **Grouping** por:
   - Status (Conversations)
   - Priority (Escalations)
   - Direction (Interactions)

### Automações Recomendadas

1. **Alerta de Escalação**:
   - Trigger: Novo registro em Escalations
   - Action: Enviar email para suporte@svlentes.shop

2. **Relatório Diário**:
   - Trigger: Todos os dias às 9h
   - Action: Enviar resumo de conversas do dia anterior

3. **Limpeza Automática**:
   - Trigger: Conversas fechadas há >90 dias
   - Action: Arquivar ou deletar

## 🔐 Segurança

### Boas Práticas

1. **API Key**:
   - Nunca commitar no Git
   - Usar variáveis de ambiente
   - Rotacionar periodicamente

2. **Permissões**:
   - Configurar acesso por usuário
   - Limitar permissões de edição
   - Revisar logs de acesso

3. **LGPD**:
   - Dados pessoais protegidos
   - Direito de exclusão implementado
   - Audit trail disponível

## 💡 Dicas

1. **Performance**: Backup é não-bloqueante, não afeta performance
2. **Custos**: Monitorar número de registros (limite do plano gratuito)
3. **Analytics**: Use Airtable para análises sem sobrecarregar PostgreSQL
4. **Exports**: Airtable permite exportar para CSV/Excel facilmente

## 📚 Próximos Passos

- [ ] Configurar views personalizadas
- [ ] Criar automações no Airtable
- [ ] Integrar com Zapier (opcional)
- [ ] Configurar alertas de escalação
- [ ] Exportar relatórios periódicos

## 🆘 Suporte

- **Documentação Completa**: `claudedocs/AIRTABLE_INTEGRATION.md`
- **Airtable Docs**: https://airtable.com/developers/web/api/introduction
- **Email**: philipe.saraiva@svlentes.shop

---

**Última Atualização**: 2025-10-24
**Autor**: Dr. Philipe Saraiva Cruz
