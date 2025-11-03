# Guia de Configuração do Webhook Stripe

**Data**: 2025-11-03
**Autor**: Dr. Philipe Saraiva Cruz
**Status**: 🔧 CONFIGURAÇÃO NECESSÁRIA

---

## 📋 Resumo

O webhook do Stripe já está **implementado e funcionando** no código em:
```
/root/svlentes-hero-shop/src/app/api/webhooks/stripe/route.ts
```

**Endpoint público**: `https://svlentes.com.br/api/webhooks/stripe`

**Falta apenas**: Configurar no Stripe Dashboard e obter o Webhook Secret.

---

## ✅ Eventos Processados

O webhook processa automaticamente os seguintes eventos:

| Evento | Descrição | Ação no Sistema |
|--------|-----------|-----------------|
| `checkout.session.completed` | Checkout concluído com sucesso | Cria usuário e assinatura no banco |
| `customer.subscription.created` | Nova assinatura criada | Sincroniza assinatura no banco |
| `customer.subscription.updated` | Assinatura atualizada (mudança de plano, etc) | Atualiza status e dados da assinatura |
| `customer.subscription.deleted` | Assinatura cancelada | Marca como CANCELLED no banco |
| `invoice.payment_succeeded` | Pagamento recorrente bem-sucedido | Cria registro de pagamento confirmado |
| `invoice.payment_failed` | Falha no pagamento recorrente | Marca assinatura como OVERDUE |

---

## 🚀 Passo a Passo para Configurar

### **Passo 1: Acessar o Stripe Dashboard**

1. Acesse: https://dashboard.stripe.com/webhooks
2. Certifique-se de estar no ambiente correto:
   - **Teste (Test Mode)**: Para desenvolvimento
   - **Produção (Live Mode)**: Para produção ✅

### **Passo 2: Adicionar Endpoint de Webhook**

1. Clique em **"Add endpoint"** ou **"Adicionar endpoint"**
2. Cole a URL do endpoint:
   ```
   https://svlentes.com.br/api/webhooks/stripe
   ```

3. **Descrição (opcional)**: `SVLentes - Production Webhook`

### **Passo 3: Selecionar Eventos**

Marque os seguintes eventos para ouvir:

#### **✅ Checkout**
- [x] `checkout.session.completed`

#### **✅ Customer**
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`

#### **✅ Invoice**
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`

**Dica**: Use o filtro "subscription" e "checkout" para encontrar rapidamente.

### **Passo 4: Copiar o Webhook Secret**

1. Após salvar, você verá uma página com detalhes do webhook
2. **Copie o Signing Secret** (começa com `whsec_...`)
   - Exemplo: `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

3. **NÃO COMPARTILHE** este secret publicamente!

### **Passo 5: Configurar no Servidor**

Execute no servidor de produção:

```bash
# Editar arquivo de configuração
cd /root/svlentes-hero-shop
nano .env.local
```

Atualize ou adicione a linha:
```bash
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

**Exemplo completo:**
```bash
# Stripe Payment Integration (Production Mode)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui  # ← ADICIONAR AQUI
```

### **Passo 6: Reiniciar Aplicação**

```bash
# Reiniciar Next.js
systemctl restart svlentes-nextjs

# Verificar status
systemctl status svlentes-nextjs

# Verificar logs
journalctl -u svlentes-nextjs -f | grep -i stripe
```

---

## 🧪 Como Testar o Webhook

### **Opção 1: Teste no Stripe Dashboard (Recomendado)**

1. No Stripe Dashboard, vá em: https://dashboard.stripe.com/webhooks
2. Clique no webhook que você criou
3. Clique na aba **"Send test webhook"**
4. Selecione um evento (ex: `checkout.session.completed`)
5. Clique em **"Send test event"**
6. Verifique se recebeu status **200 OK** ✅

### **Opção 2: Teste com Stripe CLI (Avançado)**

```bash
# Instalar Stripe CLI (se não tiver)
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escutar eventos e encaminhar para seu servidor
stripe listen --forward-to https://svlentes.com.br/api/webhooks/stripe

# Em outro terminal, acionar evento de teste
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### **Opção 3: Teste Real com Cartão de Teste**

1. Acesse: https://svlentes.com.br/planos
2. Escolha um plano
3. Use dados de teste do Stripe:
   - **Cartão**: `4242 4242 4242 4242`
   - **Data**: Qualquer data futura
   - **CVC**: Qualquer 3 dígitos
   - **CEP**: Qualquer CEP

4. Complete o checkout
5. Verifique os logs do servidor:
   ```bash
   journalctl -u svlentes-nextjs -f | grep -i "stripe_checkout_completed"
   ```

---

## 📊 Monitoramento do Webhook

### **Ver Logs em Tempo Real**

```bash
# Ver todos os eventos Stripe
journalctl -u svlentes-nextjs -f | grep -i stripe

# Ver apenas eventos de webhook processados
journalctl -u svlentes-nextjs -f | grep "stripe_.*_completed\|stripe_.*_succeeded\|stripe_.*_failed"

# Ver erros do webhook
journalctl -u svlentes-nextjs -f | grep -E "ERROR.*stripe|Invalid Stripe signature"
```

### **Ver no Stripe Dashboard**

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no seu webhook
3. Veja a aba **"Recent events"**
4. Status esperado: ✅ **Succeeded** (200 OK)

**Indicadores de Saúde:**
- ✅ **Success Rate**: > 95%
- ✅ **Response Time**: < 2 segundos
- ✅ **Failures**: < 5% (erros ocasionais são normais)

---

## 🔍 Troubleshooting

### **Erro: "Stripe webhook não está configurado"**

**Causa**: Variável `STRIPE_WEBHOOK_SECRET` não configurada.

**Solução**:
```bash
# Verificar se variável existe
grep STRIPE_WEBHOOK_SECRET /root/svlentes-hero-shop/.env.local

# Se não existir ou estiver vazia, adicione:
echo 'STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui' >> /root/svlentes-hero-shop/.env.local

# Reiniciar
systemctl restart svlentes-nextjs
```

### **Erro: "Assinatura inválida" (Invalid signature)**

**Causa**: Webhook secret incorreto ou corpo da requisição modificado.

**Solução**:
1. Copie novamente o Webhook Secret do Stripe Dashboard
2. Cole exatamente no `.env.local` (sem espaços extras)
3. Reinicie o serviço

### **Erro: "User not found for subscription"**

**Causa**: Email do usuário não está cadastrado no sistema antes do checkout.

**Solução**:
- Certifique-se de que o usuário criou uma conta antes de fazer o checkout
- Ou implemente auto-criação de usuário no evento `checkout.session.completed`

### **Webhook recebe 500 (Internal Server Error)**

**Solução**:
```bash
# Ver erro detalhado nos logs
journalctl -u svlentes-nextjs -n 100 | grep -A10 "ERROR.*stripe"

# Verificar conectividade com banco de dados
npx prisma db pull

# Testar conexão manualmente
curl -X POST https://svlentes.com.br/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Esperado: 400 Bad Request (sem signature é normal)
```

---

## 🔒 Segurança do Webhook

### **O que o Webhook Faz para Proteger:**

1. ✅ **Verificação de Assinatura**: Valida que eventos vêm realmente do Stripe
2. ✅ **Rejeita Eventos Não Assinados**: Retorna 400 se `stripe-signature` estiver ausente
3. ✅ **Valida Estrutura do Evento**: Usa TypeScript para validação de tipos
4. ✅ **Logs Detalhados**: Registra todos os eventos para auditoria
5. ✅ **Idempotência**: Usa `upsert` para evitar registros duplicados

### **Boas Práticas:**

- 🔐 **NUNCA** exponha o `STRIPE_WEBHOOK_SECRET` publicamente
- 🔐 **NUNCA** commite o `.env.local` no Git
- ✅ Use HTTPS (já configurado: `https://svlentes.com.br`)
- ✅ Monitore logs regularmente para detectar tentativas de ataque
- ✅ Configure alertas para taxa de falha > 10%

---

## 📈 Métricas de Sucesso

Após configurar corretamente, você deve ver:

| Métrica | Valor Esperado | Como Verificar |
|---------|----------------|----------------|
| **Taxa de Sucesso** | > 95% | Stripe Dashboard > Webhooks > Recent Events |
| **Tempo de Resposta** | < 2s | Stripe Dashboard > Webhook > Performance |
| **Eventos Recebidos** | 100% dos eventos marcados | Logs do servidor |
| **Assinaturas Sincronizadas** | 100% | `SELECT * FROM subscriptions WHERE provider='stripe'` |
| **Pagamentos Registrados** | 100% | `SELECT * FROM payments WHERE provider='stripe'` |

---

## 📝 Checklist de Configuração

- [ ] Acessei o Stripe Dashboard
- [ ] Adicionei endpoint: `https://svlentes.com.br/api/webhooks/stripe`
- [ ] Selecionei os 6 eventos necessários
- [ ] Copiei o Webhook Secret (`whsec_...`)
- [ ] Adicionei o secret no arquivo `.env.local`
- [ ] Reiniciei o serviço: `systemctl restart svlentes-nextjs`
- [ ] Testei enviando evento de teste pelo Dashboard
- [ ] Verifiquei status 200 OK no Stripe
- [ ] Verifiquei logs do servidor (sem erros)
- [ ] Testei com checkout real usando cartão de teste

---

## 🎉 Conclusão

Após completar este guia, seu sistema estará **100% integrado com o Stripe**, processando:

- ✅ **Checkouts automáticos**
- ✅ **Criação de assinaturas**
- ✅ **Pagamentos recorrentes**
- ✅ **Atualizações de assinatura**
- ✅ **Cancelamentos**
- ✅ **Gestão de inadimplência**

Tudo **sincronizado em tempo real** entre Stripe e seu banco de dados!

---

**Documento gerado em**: 2025-11-03
**Última atualização**: 2025-11-03
**Versão**: 1.0.0
**Status**: Pronto para Uso

**Contato**: saraivavision@gmail.com
