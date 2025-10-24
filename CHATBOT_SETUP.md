# 🤖 Guia de Configuração do Chatbot WhatsApp

## Status Atual

✅ **Código corrigido e funcionando**
✅ **Webhook endpoint acessível:** `https://svlentes.com.br/api/webhooks/sendpulse`
✅ **SendPulse conectado**
⚠️ **PENDENTE: Configurar webhook no painel SendPulse**

## Problema Identificado

O bot **não está respondendo** porque o SendPulse não está enviando as mensagens para o webhook.

**Evidência:**
- 71 mensagens não lidas no inbox do SendPulse
- Webhook testado e funcionando (retorna 200 OK)
- Bugs de código corrigidos

## 🔧 Solução: Configurar Webhook no SendPulse

### Passo 1: Acessar o Painel SendPulse

1. Acesse: https://login.sendpulse.com/messengers/whatsapp/
2. Faça login com suas credenciais
3. Você verá o bot **SVlentes** (telefone: +55 33 99989-8026)

### Passo 2: Configurar o Webhook

1. Clique no bot **SVlentes**
2. Procure por uma das opções:
   - "Settings" / "Configurações"
   - "Webhook"
   - "API"
   - "Integrations" / "Integrações"
   
3. Configure:
   - **Webhook URL:** `https://svlentes.com.br/api/webhooks/sendpulse`
   - **Eventos:** Marque "Incoming Messages" ou "Mensagens Recebidas"
   - **Status:** Ative o webhook

4. Salve as configurações

### Passo 3: Testar

Após configurar o webhook:

1. Envie uma mensagem do WhatsApp para: **+55 33 99989-8026**
2. O bot deve responder automaticamente com:
   - Autenticação automática (se cadastrado)
   - Mensagem de boas-vindas personalizada
   - Menu de opções
   - Ou resposta via IA (LangChain + OpenAI)

## 📊 Verificar Status

Execute o comando para verificar o status atual:

```bash
npm run test:chatbot
```

## 🔍 Debug

### Ver mensagens não lidas no SendPulse:

```bash
npx tsx --env-file=.env.local scripts/check-sendpulse-inbox.ts
```

### Testar webhook localmente:

```bash
curl -X POST https://svlentes.com.br/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d '[{"title":"incoming_message","service":"whatsapp","info":{"message":{"id":"test123","channel_data":{"message":{"type":"text","text":{"body":"olá"}}}}},"contact":{"phone":"5533998980026","name":"Test"}}]'
```

## 📝 Informações Técnicas

### Bot Details
- **Bot ID:** `68f176502ca6f03a9705c489`
- **Nome:** SVlentes
- **Telefone:** +55 33 99989-8026
- **Status:** ✅ Ativo
- **Mensagens inbox:** 83 total (71 não lidas)

### Webhook Endpoint
- **URL:** https://svlentes.com.br/api/webhooks/sendpulse
- **Método:** POST
- **Status:** ✅ Acessível (retorna 200)
- **Formato:** SendPulse native format (array de eventos)

### Bugs Corrigidos
1. ✅ OAuth endpoint incorreto
2. ✅ Bot ID faltando na criação de contatos  
3. ✅ Normalização de telefone com código do país (+55)

## 🚨 Importante

Se você **NÃO** tiver acesso ao painel SendPulse para configurar o webhook:

1. Use o painel web do SendPulse (não tem API para configurar webhook)
2. Ou entre em contato com o suporte do SendPulse
3. Ou forneça as credenciais de acesso para que possamos configurar

## ✅ Após Configurar

Quando o webhook estiver configurado, o chatbot irá:

1. ✅ Receber mensagens automaticamente
2. ✅ Autenticar usuários pelo telefone
3. ✅ Processar com IA (LangChain + OpenAI + GPT-5-mini)
4. ✅ Responder automaticamente
5. ✅ Criar tickets quando necessário
6. ✅ Escalar para humano quando apropriado
7. ✅ Rastrear tudo no LangSmith

## 📞 Suporte

Para mais ajuda, execute:

```bash
npm run test:chatbot
```

Isso mostrará o status completo do sistema.
