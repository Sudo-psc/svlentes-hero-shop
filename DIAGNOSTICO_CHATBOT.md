# 🔍 Diagnóstico Completo do Chatbot WhatsApp

## ✅ O QUE ESTÁ FUNCIONANDO

### 1. Código e Bugs Corrigidos
- ✅ OAuth SendPulse endpoint corrigido
- ✅ Bot ID automático na criação de contatos
- ✅ Normalização de telefone com código do país (+55)
- ✅ Webhook endpoint acessível: https://svlentes.com.br/api/webhooks/sendpulse
- ✅ Integração LangChain + OpenAI configurada
- ✅ LangSmith observability habilitado

### 2. Infraestrutura
- ✅ Servidor Next.js rodando
- ✅ Nginx proxy reverso funcionando
- ✅ Rota do webhook compilada e acessível

### 3. SendPulse
- ✅ Bot ativo: SVlentes (ID: 68f176502ca6f03a9705c489)
- ✅ Telefone: +55 33 99989-8026
- ✅ API conectada e autenticada

## ❌ O PROBLEMA

**O SendPulse NÃO está enviando as mensagens recebidas para o webhook.**

### Evidências:
1. Webhook testado manualmente: ✅ Retorna 200 OK
2. Logs do Nginx: ❌ Nenhuma chamada do SendPulse
3. Logs da aplicação: ❌ Nenhuma mensagem processada
4. Inbox do SendPulse: Mensagens chegam mas não são processadas

## 🔧 SOLUÇÃO

### O webhook PRECISA ser configurado manualmente no painel do SendPulse.

**POR QUE?**
A API do SendPulse NÃO permite configurar o webhook programaticamente. Tentamos 3 endpoints diferentes, todos retornaram 404.

### COMO CONFIGURAR:

#### Passo 1: Acessar o Painel
1. Vá para: https://login.sendpulse.com/messengers/whatsapp/
2. Faça login
3. Você verá o bot "SVlentes"

#### Passo 2: Configurar Webhook
1. Clique no bot "SVlentes"
2. Procure por uma destas opções no menu:
   - "Settings" ou "Configurações"
   - "Webhook"  
   - "API Settings"
   - "Integrations"
   - "Automation" → "Webhook"

3. **Configure:**
   ```
   URL do Webhook: https://svlentes.com.br/api/webhooks/sendpulse
   Eventos: Mensagens Recebidas (Incoming Messages)
   Método: POST
   Status: ATIVO
   ```

4. Salve

#### Passo 3: Testar
Após configurar:
1. Envie uma mensagem do seu WhatsApp para: **+55 33 99989-8026**
2. O bot deve responder automaticamente

## 📊 VERIFICAR STATUS

### Verificar se o webhook está sendo chamado:
```bash
# Monitorar logs do Nginx
tail -f /var/log/nginx/access.log | grep sendpulse

# Monitorar logs da aplicação  
journalctl -u svlentes-nextjs -f | grep -i webhook
```

### Verificar inbox do SendPulse:
```bash
cd /root/svlentes-hero-shop
npx tsx --env-file=.env.local scripts/check-sendpulse-inbox.ts
```

### Status geral do chatbot:
```bash
npm run test:chatbot
```

## 🎯 PRÓXIMOS PASSOS

1. **CONFIGURAR O WEBHOOK NO PAINEL SENDPULSE** ← MAIS IMPORTANTE
2. Testar enviando mensagem para o bot
3. Verificar logs para confirmar que webhook está sendo chamado
4. Ajustar respostas do bot conforme necessário

## 💡 DICAS DE TROUBLESHOOTING

### Se o bot não responder após configurar:

1. **Verificar se o webhook está ativo:**
   - Volte ao painel SendPulse
   - Verifique se o webhook está HABILITADO
   - Verifique se a URL está correta

2. **Testar o webhook manualmente:**
   ```bash
   curl -X POST https://svlentes.com.br/api/webhooks/sendpulse \
     -H "Content-Type: application/json" \
     -d '[{"title":"incoming_message","service":"whatsapp","info":{"message":{"id":"test","channel_data":{"message":{"type":"text","text":{"body":"teste"}}}}},"contact":{"phone":"5533998980026","name":"Test"}}]'
   ```

3. **Ver logs em tempo real:**
   ```bash
   # Terminal 1: Nginx
   tail -f /var/log/nginx/access.log | grep sendpulse
   
   # Terminal 2: Aplicação
   journalctl -u svlentes-nextjs -f
   ```

4. **Verificar se a aplicação está rodando:**
   ```bash
   systemctl status svlentes-nextjs
   curl http://localhost:5000/api/webhooks/sendpulse
   ```

## 📞 CONTATO TÉCNICO

- **Webhook URL:** https://svlentes.com.br/api/webhooks/sendpulse
- **Bot ID:** 68f176502ca6f03a9705c489
- **Telefone Bot:** +55 33 99989-8026
- **Formato:** SendPulse Native (array de eventos)

## ✅ CHECKLIST

- [x] Código corrigido
- [x] Webhook endpoint funcionando
- [x] SendPulse conectado
- [ ] **Webhook configurado no painel SendPulse** ← PENDENTE
- [ ] Bot respondendo automaticamente

---

**Resumo:** O código está pronto e funcionando. A única coisa faltando é **configurar o webhook no painel web do SendPulse** para que ele envie as mensagens recebidas para o nosso endpoint.
