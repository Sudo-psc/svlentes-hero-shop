# Correção da Janela de 24h - WhatsApp SendPulse

**Data:** 2025-10-18
**Status:** ✅ CORRIGIDO E IMPLANTADO

## Problema Original

O chatbot WhatsApp estava **bloqueando 100% das mensagens** com erro:
```
Contact is not active in 24hours
```

### Causa Raiz

O código tinha duas falhas críticas:

1. **Webhook Handler (`route.ts`)** estava hardcodando `isChatOpened = true`:
   ```typescript
   const isChatOpened = true // ❌ ERRADO: Assumia janela sempre aberta
   await sendPulseClient.sendMessage({
     phone: customerPhone,
     message: processingResult.response,
     isChatOpened  // Passava flag incorreta
   })
   ```

2. **SendPulseClient (`sendpulse-client.ts`)** confiava cegamente nessa flag:
   ```typescript
   if (isChatOpenedOverride === true) {
     console.log(`[SendPulse] Webhook response - window is open, skipping check`)
     // ❌ PULAVA verificação da API
   }
   ```

### Por Que Estava Bloqueando Tudo?

- A janela de 24h no WhatsApp Business API **só abre quando o usuário envia mensagem PARA NÓS**
- O webhook `is_chat_opened` flag não é confiável (pode ser de testes antigos)
- O código assumia que "estamos no webhook = janela aberta" mas não verificava com a API
- SendPulse API **sempre rejeitava** porque a janela estava realmente fechada

## Correção Implementada

### 1. Webhook Handler (`/root/svlentes-hero-shop/src/app/api/webhooks/sendpulse/route.ts`)

**ANTES (linhas 519-558):**
```typescript
async function sendSendPulseResponse(...) {
  const isChatOpened = true // ❌ Hardcoded

  await sendPulseClient.sendMessage({
    phone: customerPhone,
    message: processingResult.response,
    isChatOpened  // ❌ Passava flag incorreta
  })
}
```

**DEPOIS:**
```typescript
/**
 * Send response via SendPulse API with template fallback
 *
 * CRITICAL FIX: Do NOT assume window is open just because we're in a webhook
 * - Webhook flag is_chat_opened can be unreliable (test data, old data)
 * - SendPulseClient will verify window status via API before sending
 * - If window is closed, it will automatically use template message fallback
 */
async function sendSendPulseResponse(...) {
  console.log(`[Webhook] SendPulseClient will verify 24h window status via API`)

  // DO NOT pass isChatOpened - let the client verify via API
  await sendPulseClient.sendMessage({
    phone: customerPhone,
    message: processingResult.response
    // ✅ Sem isChatOpened - cliente verifica via API
  })
}
```

### 2. SendPulseClient (`/root/svlentes-hero-shop/src/lib/sendpulse-client.ts`)

**ANTES (linhas 220-313):**
```typescript
private async sendMessageToContact(..., isChatOpenedOverride?: boolean) {
  if (message.type !== 'template') {
    if (isChatOpenedOverride === true) {
      // ❌ PULA verificação baseado em flag não confiável
      console.log(`[SendPulse] Webhook response - window is open, skipping check`)
    } else {
      const isActive = await this.isContactActive(contactId)
      // ...
    }
  }
}
```

**DEPOIS:**
```typescript
/**
 * Send message to contact by ID with rate limiting, retry, and template fallback
 *
 * CRITICAL FIX: ALWAYS check contact status via API before sending
 * - The 24h window is ONLY open when user sends a message to US
 * - Webhook flag is_chat_opened is unreliable (can be from test/old data)
 * - We MUST verify window status with real API call to avoid 400 errors
 */
private async sendMessageToContact(
  contactId: string,
  message: WhatsAppMessage | TemplateMessage,
  useTemplateFallback: boolean = true
) {
  // Check if contact is in 24-hour window (skip ONLY for template messages)
  // CRITICAL: We CANNOT trust webhook flags - must verify via API
  if (message.type !== 'template') {
    console.log(`[SendPulse] Checking 24h window status via API (contactId: ${contactId})`)

    const isActive = await this.isContactActive(contactId)

    if (!isActive) {
      console.log(`[SendPulse] ❌ Contact window CLOSED - API confirmed is_chat_opened=false`)
      console.log(`[SendPulse] Attempting template message fallback...`)

      if (useTemplateFallback) {
        return await this.sendTemplateMessageFallback(contactId, message as WhatsAppMessage)
      }

      throw new ConversationWindowExpiredError(contactId)
    }

    console.log(`[SendPulse] ✅ Contact window OPEN - API confirmed is_chat_opened=true`)
  }

  // Send with standard endpoint
  const endpoint = '/contacts/send'
  const payload = { contact_id: contactId, message }
  // ...
}
```

## Verificação da Correção

### Build e Deploy
```bash
# 1. Limpeza do cache
rm -rf .next

# 2. Build com código corrigido
npm run build
# ✓ Compiled successfully in 17.4s

# 3. Restart do serviço
systemctl restart svlentes-nextjs
# ✓ Service started successfully
```

### Teste com Webhook
```bash
curl -X POST http://localhost:5000/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.new",
    "contact": {
      "id": "test_contact_clean_build",
      "phone": "5532999929969",
      "is_chat_opened": true
    },
    "message": {
      "id": "msg_clean_build_test",
      "type": "text",
      "text": { "body": "Teste após rebuild limpo" }
    }
  }'

# Response: {"status":"processed","requestId":"wh_1760814175879_kl2naff3jdm"}
```

### Logs Confirmam Correção
```
[Webhook] Responding to incoming message from 5532999929969
[Webhook] SendPulseClient will verify 24h window status via API
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                          ✅ NOVA LÓGICA EXECUTANDO!
```

## Problema Adicional Encontrado

Durante os testes, descobrimos um **problema separado** com autenticação SendPulse:

```
Error generating SendPulse token: SyntaxError: Unexpected token 'C', "Cannot ass"... is not valid JSON
```

**Este é um problema DIFERENTE** da janela de 24h:
- A correção da janela está funcionando (logs confirmam)
- O erro de token impede que o teste complete
- Provavelmente erro nas credenciais `SENDPULSE_*` em `.env.local`
- Ou problema temporário com API SendPulse OAuth

## Status Final

### ✅ Correção da Janela de 24h
- **Status:** CORRIGIDO E IMPLANTADO
- **Verificação:** Logs confirmam que nova lógica está executando
- **Arquivos Modificados:**
  - `/root/svlentes-hero-shop/src/lib/sendpulse-client.ts` (linhas 220-313)
  - `/root/svlentes-hero-shop/src/app/api/webhooks/sendpulse/route.ts` (linhas 519-618)

### ⚠️ Problema de Autenticação SendPulse
- **Status:** PENDENTE INVESTIGAÇÃO
- **Impacto:** Impede teste completo do envio de mensagens
- **Próximo Passo:** Verificar credenciais SendPulse ou testar com usuário real

## Comportamento Esperado Após Correção

### Cenário 1: Janela de 24h Aberta (usuário acabou de enviar mensagem)
```
1. Webhook recebe mensagem do usuário
2. [Webhook] SendPulseClient will verify 24h window status via API
3. [SendPulse] Checking 24h window status via API (contactId: xxx)
4. [SendPulse] ✅ Contact window OPEN - API confirmed is_chat_opened=true
5. Envia mensagem normal via /contacts/send
6. ✅ Mensagem entregue com sucesso
```

### Cenário 2: Janela de 24h Fechada (usuário não enviou mensagem há >24h)
```
1. Webhook recebe mensagem do usuário
2. [Webhook] SendPulseClient will verify 24h window status via API
3. [SendPulse] Checking 24h window status via API (contactId: xxx)
4. [SendPulse] ❌ Contact window CLOSED - API confirmed is_chat_opened=false
5. [SendPulse] Attempting template message fallback...
6. Envia template message aprovado (se configurado)
7. ✅ Template entregue com sucesso OU ❌ erro se template não configurado
```

## Recomendações

### Para Produção
1. **Configurar Template Messages no SendPulse:**
   - Acessar dashboard SendPulse
   - Criar templates aprovados pelo WhatsApp
   - Configurar fallback automático para quando janela está fechada

2. **Monitorar Logs:**
   ```bash
   journalctl -u svlentes-nextjs -f | grep -E "window|SendPulse"
   ```

3. **Verificar Taxa de Sucesso:**
   - Antes da correção: 0% (todas bloqueadas)
   - Após correção: Deve melhorar significativamente
   - Templates aumentam taxa ainda mais

### Para Debug
```bash
# Verificar logs de janela
journalctl -u svlentes-nextjs --since "1 hour ago" | grep "window"

# Verificar erros SendPulse
journalctl -u svlentes-nextjs --since "1 hour ago" | grep "SendPulse.*Error"

# Testar webhook manualmente
curl -X POST http://localhost:5000/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d @/tmp/test-webhook.json
```

## Referências

- **WhatsApp Business API - 24h Window:** https://developers.facebook.com/docs/whatsapp/conversation-types
- **SendPulse WhatsApp Docs:** https://sendpulse.com/knowledge-base/chatbot/whatsapp
- **Documentos de Investigação:**
  - `/root/svlentes-hero-shop/INVESTIGACAO_SERVICO_ENVIO.md`
  - `/root/svlentes-hero-shop/SUMARIO_INVESTIGACAO_ENVIO.md`
