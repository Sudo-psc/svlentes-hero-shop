# Teste do Painel do Assinante - Guia Completo

## ✅ Assinatura de Teste Criada

Foi criada uma assinatura de teste completa para o usuário **Dr. Philipe Saraiva Cruz**.

### 📋 Dados da Assinatura

**Usuário:**
- Nome: Dr. Philipe Saraiva Cruz
- Email: drphilipe.saraiva.oftalmo@gmail.com
- Telefone/WhatsApp: +55 33 99989-8026
- Firebase UID: lCvWf8Y5iTRx9zlS3aSUTkXPyBN2

**Assinatura:**
- ID: cmgwgd5c80002kotqbrl7r6z2
- Status: ACTIVE
- Plano: Lentes Diárias Premium
- Valor Mensal: R$ 99,90
- Data de Início: 18/10/2025
- Data de Renovação: 18/11/2025

**Benefícios:**
1. **Lentes mensais** (1/12 utilizadas)
   - Caixa de lentes entregue mensalmente
2. **Consultas de acompanhamento** (0/2 utilizadas)
   - Consultas oftalmológicas
3. **Suporte por WhatsApp** (Ilimitado)
   - Atendimento prioritário

**Pedidos:**
- 1 pedido entregue (R$ 99,90)
- Data: 18/10/2025
- Status: DELIVERED

**Pagamentos:**
- 1 pagamento confirmado
- Valor: R$ 99,90
- Método: CREDIT_CARD (final 4242)
- Data: 18/10/2025

## 🔐 Credenciais de Acesso

```
Email: drphilipe.saraiva.oftalmo@gmail.com
Senha: Teste123!
```

## 🧪 Como Testar o Painel

### 1. Iniciar o Servidor de Desenvolvimento

```bash
cd /root/svlentes-hero-shop
npm run dev
```

O servidor estará disponível em: http://localhost:3000

### 2. Acessar a Página de Login

Navegue até: http://localhost:3000/area-assinante/login

### 3. Fazer Login

Use as credenciais acima:
- Email: drphilipe.saraiva.oftalmo@gmail.com
- Senha: Teste123!

### 4. Verificar o Dashboard

Após o login, você será redirecionado para: http://localhost:3000/area-assinante/dashboard

### 5. Funcionalidades para Testar

**No Dashboard:**
- ✅ Visualização do status da assinatura (ACTIVE)
- ✅ Informações do plano (nome, valor, próxima cobrança)
- ✅ Forma de pagamento (Cartão de crédito •••• 4242)
- ✅ Endereço de entrega completo
- ✅ Lista de benefícios com progresso de uso
- ✅ Botão "Atualizar Dados" (refetch)
- ✅ Informações de contato de emergência

**Modais Disponíveis:**
- 📦 **Ver Histórico de Pedidos**
  - Deve mostrar 1 pedido entregue
- 📄 **Baixar Fatura**
  - Deve listar faturas disponíveis
- ⚙️ **Configurações**
  - Redireciona para página de configurações

## 📁 Scripts Utilitários Criados

### 1. create-test-subscription.ts
```bash
npx tsx scripts/create-test-subscription.ts
```
Cria uma assinatura de teste completa com usuário, assinatura, benefícios, pedidos e pagamentos.

### 2. verify-test-subscription.ts
```bash
npx tsx scripts/verify-test-subscription.ts
```
Verifica todos os dados da assinatura de teste no banco.

### 3. create-firebase-user.ts
```bash
npx tsx scripts/create-firebase-user.ts
```
Cria ou verifica usuário no Firebase Authentication e atualiza o UID no banco de dados.

### 4. test-subscriber-panel.ts
```bash
npx tsx scripts/test-subscriber-panel.ts
```
Testa a configuração completa do painel (banco, Firebase, API).

### 5. update-user-firebase-uid.ts
```bash
npx tsx scripts/update-user-firebase-uid.ts
```
Atualiza manualmente o Firebase UID de um usuário no banco.

## 🔍 Verificação da API

### Testar Endpoint de Assinatura

```bash
# 1. Obter token do Firebase (após login)
# 2. Fazer requisição GET
curl -H "Authorization: Bearer <FIREBASE_TOKEN>" \
     http://localhost:3000/api/assinante/subscription
```

**Resposta Esperada:**
```json
{
  "subscription": {
    "id": "cmgwgd5c80002kotqbrl7r6z2",
    "status": "active",
    "plan": {
      "name": "Lentes Diárias Premium",
      "price": 99.9,
      "billingCycle": "monthly"
    },
    "nextBillingDate": "2025-11-18T00:00:00.000Z",
    "benefits": [...],
    "shippingAddress": {...},
    "paymentMethod": "CREDIT_CARD",
    "paymentMethodLast4": "4242"
  },
  "user": {
    "id": "cmgwgd5bu0000kotq7b3e379f",
    "name": "Dr. Philipe Saraiva Cruz",
    "email": "drphilipe.saraiva.oftalmo@gmail.com"
  }
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Relacionadas

```
users
├── id: cmgwgd5bu0000kotq7b3e379f
├── email: drphilipe.saraiva.oftalmo@gmail.com
├── firebaseUid: lCvWf8Y5iTRx9zlS3aSUTkXPyBN2
└── subscriptions
    └── id: cmgwgd5c80002kotqbrl7r6z2
        ├── benefits (3 itens)
        ├── orders (1 item)
        └── payments (1 item)
```

### Consultas SQL Úteis

```sql
-- Ver usuário
SELECT * FROM users WHERE email = 'drphilipe.saraiva.oftalmo@gmail.com';

-- Ver assinatura
SELECT * FROM subscriptions WHERE user_id = 'cmgwgd5bu0000kotq7b3e379f';

-- Ver benefícios
SELECT * FROM subscription_benefits WHERE subscription_id = 'cmgwgd5c80002kotqbrl7r6z2';

-- Ver pedidos
SELECT * FROM orders WHERE subscription_id = 'cmgwgd5c80002kotqbrl7r6z2';

-- Ver pagamentos
SELECT * FROM payments WHERE subscription_id = 'cmgwgd5c80002kotqbrl7r6z2';
```

## ⚠️ Troubleshooting

### Problema: "Usuário não encontrado"
**Solução:** Verifique se o Firebase UID está correto no banco
```bash
npx tsx scripts/create-firebase-user.ts
```

### Problema: "Token inválido ou expirado"
**Solução:** Faça logout e login novamente no painel

### Problema: "Assinatura não encontrada"
**Solução:** Execute o script de criação da assinatura
```bash
npx tsx scripts/create-test-subscription.ts
```

### Problema: Firebase não inicializado
**Solução:** Verifique se `FIREBASE_SERVICE_ACCOUNT_KEY` está em `.env.local`

## 📊 Monitoramento

### Logs do Servidor
```bash
# Ver logs em tempo real
journalctl -u svlentes-nextjs -f

# Ou se usando npm run dev
# Os logs aparecerão no terminal
```

### Verificar Estado do Banco
```bash
npx prisma studio
```
Isso abrirá uma interface visual para explorar o banco de dados.

## 🚀 Próximos Passos

Após validar o painel de teste, você pode:

1. **Testar fluxos completos:**
   - Atualização de endereço
   - Visualização de faturas
   - Histórico de pedidos

2. **Criar mais assinaturas de teste:**
   - Diferentes status (OVERDUE, SUSPENDED, etc.)
   - Diferentes planos
   - Diferentes formas de pagamento

3. **Validar integrações:**
   - Webhook do Asaas
   - Envio de emails (Resend)
   - Notificações WhatsApp (SendPulse)

4. **Testar em produção:**
   - Deploy em https://svlentes.com.br
   - Teste com usuários reais

## 📝 Notas Importantes

- ✅ Firebase configurado e funcionando
- ✅ Banco de dados PostgreSQL conectado
- ✅ Dados de teste completos e consistentes
- ✅ API de assinatura funcionando corretamente
- ✅ Autenticação Firebase integrada
- ✅ Hook `useSubscription` funcionando

---

**Data de criação:** 2025-10-18
**Ambiente:** Desenvolvimento (localhost:3000)
**Banco de dados:** PostgreSQL (localhost:5433/svlentes_subscribers)
