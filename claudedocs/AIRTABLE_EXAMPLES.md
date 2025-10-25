# Airtable Integration - Exemplos Práticos

**Guia**: Exemplos de código para usar a integração Airtable

## 📖 Índice

1. [Verificar Configuração](#verificar-configuração)
2. [Backup Manual](#backup-manual)
3. [Recovery de Dados](#recovery-de-dados)
4. [Monitoramento](#monitoramento)
5. [Testes](#testes)
6. [API Endpoints](#api-endpoints)

## 🔧 Verificar Configuração

### Exemplo 1: Verificar se Airtable está configurado

```typescript
import { airtableClient } from '@/lib/airtable-client'

// Verificar configuração
const isConfigured = airtableClient.isConfigured()
console.log('Airtable configurado:', isConfigured)

if (!isConfigured) {
  console.error('Airtable não configurado! Configure as variáveis:')
  console.error('- AIRTABLE_API_KEY')
  console.error('- AIRTABLE_BASE_ID')
}
```

### Exemplo 2: Health Check Completo

```typescript
import { airtableClient } from '@/lib/airtable-client'

async function checkAirtableHealth() {
  const isConfigured = airtableClient.isConfigured()

  if (!isConfigured) {
    return { status: 'not_configured' }
  }

  const isHealthy = await airtableClient.healthCheck()

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    configured: isConfigured,
    healthy: isHealthy
  }
}

// Usar
const health = await checkAirtableHealth()
console.log('Airtable status:', health)
```

### Exemplo 3: Via HTTP

```bash
# Usando curl
curl http://localhost:3000/api/airtable/health | jq

# Usando httpie
http GET localhost:3000/api/airtable/health

# Usando fetch no browser console
fetch('/api/airtable/health')
  .then(r => r.json())
  .then(data => {
    console.log('Status:', data.status)
    console.log('Healthy:', data.healthy)
    console.log('Queue size:', data.queue?.size)
  })
```

## 💾 Backup Manual

### Exemplo 1: Backup de Conversa

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function backupConversationExample() {
  const conversationData = {
    id: 'conv-123',
    customerPhone: '5533999898026',
    customerName: 'João Silva',
    status: 'active',
    startedAt: new Date('2025-10-24T10:00:00Z'),
    lastActivity: new Date(),
    messageCount: 5,
    intent: 'subscription_inquiry',
    sentiment: 'positive',
    priority: 'MEDIUM',
    tags: ['new_customer', 'subscription'],
    metadata: {
      source: 'whatsapp',
      channel: 'sendpulse'
    },
    createdAt: new Date('2025-10-24T10:00:00Z')
  }

  const result = await conversationBackupService.backupConversation(conversationData)

  if (result.success) {
    console.log('✅ Backup successful!')
    console.log('Airtable ID:', result.airtableId)
  } else {
    console.error('❌ Backup failed:', result.error)
  }
}
```

### Exemplo 2: Backup de Interação

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function backupInteractionExample() {
  const interactionData = {
    id: 'int-456',
    conversationId: 'conv-123',
    messageId: 'msg-789',
    customerPhone: '5533999898026',
    userId: 'user-123',
    content: 'Quero cancelar minha assinatura',
    direction: 'inbound' as const,
    intent: 'subscription_cancellation',
    sentiment: 'neutral',
    response: 'Entendo que deseja cancelar. Posso ajudar com isso.',
    processingTime: 250,
    status: 'sent' as const,
    timestamp: new Date(),
    createdAt: new Date()
  }

  const result = await conversationBackupService.backupInteraction(interactionData)

  console.log('Backup result:', result)
}
```

### Exemplo 3: Backup em Lote

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function backupMultipleInteractions(interactions: any[]) {
  const results = await Promise.allSettled(
    interactions.map(interaction =>
      conversationBackupService.backupInteraction(interaction)
    )
  )

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success)
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success)

  console.log(`✅ ${successful.length} backups successful`)
  console.log(`❌ ${failed.length} backups failed`)

  return { successful: successful.length, failed: failed.length }
}
```

## 🔄 Recovery de Dados

### Exemplo 1: Recuperar Conversa

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function recoverConversationExample() {
  const conversationId = 'conv-123'

  console.log(`🔍 Buscando conversa ${conversationId} no Airtable...`)

  const conversation = await conversationBackupService.recoverConversation(conversationId)

  if (conversation) {
    console.log('✅ Conversa recuperada!')
    console.log('Cliente:', conversation.customerName)
    console.log('Telefone:', conversation.customerPhone)
    console.log('Status:', conversation.status)
    console.log('Mensagens:', conversation.messageCount)
    return conversation
  } else {
    console.log('❌ Conversa não encontrada no Airtable')
    return null
  }
}
```

### Exemplo 2: Recuperar Histórico Completo

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function recoverFullHistory() {
  const conversationId = 'conv-123'

  // Recuperar conversa
  const conversation = await conversationBackupService.recoverConversation(conversationId)

  // Recuperar todas interações
  const history = await conversationBackupService.recoverConversationHistory(conversationId)

  console.log(`📋 Conversa: ${conversation?.customerName}`)
  console.log(`💬 Total de mensagens: ${history.length}`)

  // Exibir histórico
  history.forEach((interaction, index) => {
    console.log(`\n--- Mensagem ${index + 1} ---`)
    console.log(`Direção: ${interaction.direction}`)
    console.log(`Conteúdo: ${interaction.content}`)
    console.log(`Resposta: ${interaction.response}`)
    console.log(`Data: ${interaction.timestamp}`)
  })

  return { conversation, history }
}
```

### Exemplo 3: Recovery e Restauração

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'
import { prisma } from '@/lib/prisma'

async function recoverAndRestoreToDatabase() {
  const conversationId = 'conv-123'

  // 1. Recuperar do Airtable
  const conversation = await conversationBackupService.recoverConversation(conversationId)
  const history = await conversationBackupService.recoverConversationHistory(conversationId)

  if (!conversation) {
    throw new Error('Conversa não encontrada no Airtable')
  }

  // 2. Restaurar no PostgreSQL
  try {
    // Criar conversa
    await prisma.whatsAppConversation.upsert({
      where: { id: conversationId },
      create: {
        id: conversationId,
        customerPhone: conversation.customerPhone,
        customerName: conversation.customerName,
        status: conversation.status.toUpperCase(),
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastActivity,
        messageCount: conversation.messageCount,
        lastIntent: conversation.intent,
        lastSentiment: conversation.sentiment
      },
      update: {
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastActivity
      }
    })

    // Criar interações
    for (const interaction of history) {
      await prisma.whatsAppInteraction.upsert({
        where: { id: interaction.id },
        create: {
          id: interaction.id,
          conversationId: interaction.conversationId,
          messageId: interaction.messageId,
          customerPhone: interaction.customerPhone,
          userId: interaction.userId,
          content: interaction.content,
          isFromCustomer: interaction.direction === 'inbound',
          intent: interaction.intent,
          sentiment: interaction.sentiment,
          response: interaction.response,
          createdAt: interaction.timestamp
        },
        update: {}
      })
    }

    console.log('✅ Conversa restaurada no PostgreSQL!')
    return { success: true, messagesRestored: history.length }

  } catch (error) {
    console.error('❌ Erro ao restaurar:', error)
    throw error
  }
}
```

## 📊 Monitoramento

### Exemplo 1: Estatísticas da Fila

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'

function monitorQueue() {
  const stats = conversationBackupService.getQueueStats()

  console.log('📊 Queue Statistics:')
  console.log('═'.repeat(50))
  console.log(`Total items: ${stats.size}`)
  console.log(`\nDetalhes:`)

  stats.items.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.type}`)
    console.log(`   Timestamp: ${item.timestamp}`)
    console.log(`   Retries: ${item.retries}`)
    console.log(`   In Airtable: ${item.hasAirtableId ? '✅' : '❌'}`)
  })

  return stats
}

// Executar a cada 30 segundos
setInterval(monitorQueue, 30000)
```

### Exemplo 2: Dashboard Simples

```typescript
import { airtableClient } from '@/lib/airtable-client'
import { conversationBackupService } from '@/lib/conversation-backup-service'

async function displayDashboard() {
  // Health
  const isHealthy = await airtableClient.healthCheck()

  // Queue
  const queueStats = conversationBackupService.getQueueStats()

  console.clear()
  console.log('╔════════════════════════════════════════╗')
  console.log('║     Airtable Backup Dashboard          ║')
  console.log('╠════════════════════════════════════════╣')
  console.log(`║ Status: ${isHealthy ? '🟢 Healthy' : '🔴 Unhealthy'}           ║`)
  console.log(`║ Queue Size: ${queueStats.size.toString().padEnd(3)} items            ║`)
  console.log(`║ Pending Sync: ${queueStats.items.filter(i => !i.hasAirtableId).length}                     ║`)
  console.log('╚════════════════════════════════════════╝')
}

// Atualizar a cada 10 segundos
setInterval(displayDashboard, 10000)
```

### Exemplo 3: Alertas

```typescript
import { conversationBackupService } from '@/lib/conversation-backup-service'
import { airtableClient } from '@/lib/airtable-client'

async function checkAndAlert() {
  // Verificar saúde
  const isHealthy = await airtableClient.healthCheck()

  if (!isHealthy) {
    console.error('🚨 ALERTA: Airtable não está respondendo!')
    // Aqui você poderia enviar email, notificação, etc.
  }

  // Verificar fila
  const stats = conversationBackupService.getQueueStats()

  if (stats.size > 10) {
    console.warn(`⚠️ AVISO: Fila com ${stats.size} items pendentes`)
  }

  if (stats.size > 50) {
    console.error(`🚨 ALERTA: Fila muito grande! ${stats.size} items`)
    // Aqui você poderia enviar alerta crítico
  }

  // Verificar itens com muitas tentativas
  const failedItems = stats.items.filter(item => item.retries > 2)

  if (failedItems.length > 0) {
    console.error(`🚨 ALERTA: ${failedItems.length} items falhando repetidamente`)
  }
}

// Executar a cada 5 minutos
setInterval(checkAndAlert, 5 * 60 * 1000)
```

## 🧪 Testes

### Exemplo 1: Teste de Backup

```typescript
async function testBackup() {
  console.log('🧪 Testando backup no Airtable...')

  const testInteraction = {
    id: `test-${Date.now()}`,
    conversationId: 'test-conv-123',
    messageId: `msg-${Date.now()}`,
    customerPhone: '5533999898026',
    userId: 'test-user',
    content: 'Mensagem de teste',
    direction: 'inbound' as const,
    intent: 'test',
    response: 'Resposta de teste',
    processingTime: 100,
    status: 'sent' as const,
    timestamp: new Date(),
    createdAt: new Date()
  }

  const result = await conversationBackupService.backupInteraction(testInteraction)

  if (result.success) {
    console.log('✅ Teste passou!')
    console.log('Airtable ID:', result.airtableId)
    return true
  } else {
    console.log('❌ Teste falhou:', result.error)
    return false
  }
}
```

### Exemplo 2: Teste de Fallback

```typescript
async function testFallback() {
  console.log('🧪 Testando sistema de fallback...')

  const testData = {
    id: `fallback-test-${Date.now()}`,
    conversationId: 'test-conv-456',
    messageId: `msg-${Date.now()}`,
    customerPhone: '5533999898026',
    content: 'Teste de fallback',
    direction: 'inbound' as const,
    status: 'sent' as const,
    timestamp: new Date(),
    createdAt: new Date()
  }

  // Forçar fallback (simular falha do DB)
  const result = await conversationBackupService.storeInteractionFallback(testData)

  console.log('Fallback result:', result)
  console.log('Fallback usado:', result.fallbackUsed)

  // Verificar fila
  const stats = conversationBackupService.getQueueStats()
  console.log('Items na fila:', stats.size)

  return result.success
}
```

### Exemplo 3: Teste End-to-End

```typescript
async function testE2E() {
  console.log('🧪 Teste End-to-End completo...\n')

  // 1. Verificar configuração
  console.log('1️⃣ Verificando configuração...')
  const isConfigured = airtableClient.isConfigured()
  console.log(`   ${isConfigured ? '✅' : '❌'} Configurado\n`)

  if (!isConfigured) {
    console.error('❌ Airtable não configurado. Abortando teste.')
    return false
  }

  // 2. Health check
  console.log('2️⃣ Testando conectividade...')
  const isHealthy = await airtableClient.healthCheck()
  console.log(`   ${isHealthy ? '✅' : '❌'} Conectividade\n`)

  if (!isHealthy) {
    console.error('❌ Airtable não está respondendo. Abortando teste.')
    return false
  }

  // 3. Teste de backup
  console.log('3️⃣ Testando backup...')
  const backupSuccess = await testBackup()
  console.log(`   ${backupSuccess ? '✅' : '❌'} Backup\n`)

  // 4. Teste de recovery
  console.log('4️⃣ Testando recovery...')
  const conversation = await conversationBackupService.recoverConversation('test-conv-123')
  const recoverySuccess = conversation !== null
  console.log(`   ${recoverySuccess ? '✅' : '❌'} Recovery\n`)

  // 5. Verificar fila
  console.log('5️⃣ Verificando fila...')
  const stats = conversationBackupService.getQueueStats()
  console.log(`   📊 ${stats.size} items na fila\n`)

  // Resultado final
  console.log('═'.repeat(50))
  const allPassed = isConfigured && isHealthy && backupSuccess
  console.log(`Resultado: ${allPassed ? '✅ PASSOU' : '❌ FALHOU'}`)
  console.log('═'.repeat(50))

  return allPassed
}
```

## 🌐 API Endpoints

### Endpoint 1: Health Check

```bash
# GET /api/airtable/health

# Exemplo com curl
curl http://localhost:3000/api/airtable/health

# Resposta esperada:
{
  "status": "healthy",
  "message": "Airtable is configured and responding",
  "configured": true,
  "healthy": true,
  "queue": {
    "size": 0,
    "pendingSync": 0,
    "inAirtable": 0
  },
  "config": {
    "conversationsTable": "Conversations",
    "interactionsTable": "Interactions",
    "escalationsTable": "Escalations"
  },
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

### Endpoint 2: Via JavaScript

```javascript
// Função helper
async function checkAirtableHealth() {
  try {
    const response = await fetch('/api/airtable/health')
    const data = await response.json()

    if (data.healthy) {
      console.log('✅ Airtable healthy')
      console.log('Queue size:', data.queue.size)
    } else {
      console.error('❌ Airtable unhealthy:', data.message)
    }

    return data
  } catch (error) {
    console.error('❌ Erro ao verificar health:', error)
    return null
  }
}

// Usar
const health = await checkAirtableHealth()
```

### Endpoint 3: Com React Hook

```typescript
import { useEffect, useState } from 'react'

function useAirtableHealth() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/airtable/health')
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Health check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // A cada 30s

    return () => clearInterval(interval)
  }, [])

  return { health, loading }
}

// Usar no componente
function AirtableStatus() {
  const { health, loading } = useAirtableHealth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h3>Airtable Status</h3>
      <p>Status: {health?.status}</p>
      <p>Healthy: {health?.healthy ? '✅' : '❌'}</p>
      <p>Queue: {health?.queue?.size} items</p>
    </div>
  )
}
```

## 🎯 Scripts Úteis

### Script 1: Monitoramento Contínuo

```typescript
#!/usr/bin/env tsx
// scripts/monitor-airtable.ts

import { airtableClient } from '../src/lib/airtable-client'
import { conversationBackupService } from '../src/lib/conversation-backup-service'

async function monitor() {
  while (true) {
    const isHealthy = await airtableClient.healthCheck()
    const stats = conversationBackupService.getQueueStats()

    const timestamp = new Date().toISOString()
    const status = isHealthy ? '🟢' : '🔴'

    console.log(`[${timestamp}] ${status} Health: ${isHealthy} | Queue: ${stats.size}`)

    await new Promise(resolve => setTimeout(resolve, 10000)) // 10s
  }
}

monitor().catch(console.error)
```

### Script 2: Exportar Dados

```typescript
#!/usr/bin/env tsx
// scripts/export-airtable.ts

import { airtableClient } from '../src/lib/airtable-client'
import fs from 'fs'

async function exportConversations(phone: string) {
  const conversations = await airtableClient.getConversationsByPhone(phone)

  const filename = `export-${phone}-${Date.now()}.json`
  fs.writeFileSync(filename, JSON.stringify(conversations, null, 2))

  console.log(`✅ Exported ${conversations.length} conversations to ${filename}`)
}

const phone = process.argv[2]
if (!phone) {
  console.error('Usage: tsx scripts/export-airtable.ts <phone>')
  process.exit(1)
}

exportConversations(phone)
```

---

**Última Atualização**: 2025-10-24
**Autor**: Dr. Philipe Saraiva Cruz
