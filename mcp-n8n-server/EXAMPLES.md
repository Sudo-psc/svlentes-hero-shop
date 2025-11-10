# 📚 Exemplos de Uso - MCP Server n8n

## 🎯 Casos de Uso Práticos

### 1. Automação de Email Marketing

**Cenário:** Enviar emails personalizados para clientes

**No Claude Desktop:**
```
Liste os workflows ativos do n8n
```

**Resposta esperada:**
```json
{
  "data": [{
    "id": "1",
    "name": "Email Marketing Campaign",
    "active": true
  }]
}
```

**Executar o workflow:**
```
Execute o workflow 1 com os dados:
{
  "customers": [
    {"name": "João", "email": "joao@example.com"},
    {"name": "Maria", "email": "maria@example.com"}
  ]
}
```

### 2. Integração WhatsApp

**Cenário:** Enviar mensagem WhatsApp quando cliente faz pedido

**Criar workflow via Claude:**
```
Preciso de um workflow que:
1. Receba webhook com dados do pedido
2. Formate mensagem personalizada
3. Envie via WhatsApp API
4. Salve log no PostgreSQL

Você pode me ajudar a criar isso no n8n?
```

**Testar o workflow:**
```
Execute o workflow "WhatsApp Notification" com:
{
  "order_id": "12345",
  "customer": "João Silva",
  "total": "R$ 150,00"
}
```

### 3. Sincronização de Dados

**Cenário:** Sincronizar pedidos entre sistemas

**Verificar status:**
```
Mostre as últimas 10 execuções do workflow "Sync Orders"
```

**Analisar erros:**
```
Mostre detalhes da execução abc123 que falhou
```

### 4. Monitoramento Automático

**Cenário:** Verificar se workflows críticos estão rodando

```
Verifique o status de todos os workflows
Liste apenas os workflows ativos
Mostre workflows que falharam nas últimas 24h
```

### 5. Gestão de Workflows

**Ativar/Desativar workflows:**
```
Desative o workflow "Test Campaign" temporariamente
Ative o workflow "Production Email Sender"
Liste todos os workflows inativos
```

## 🔄 Workflows Comuns para E-commerce

### Workflow 1: Novo Pedido → Notificações
```json
{
  "name": "Order Notifications",
  "trigger": "webhook",
  "actions": [
    "Send email to customer",
    "Send WhatsApp to admin", 
    "Update CRM",
    "Create invoice"
  ]
}
```

**Executar:**
```
Execute o workflow "Order Notifications" com:
{
  "order_id": "ORD-001",
  "customer": {
    "name": "João",
    "email": "joao@email.com",
    "phone": "+5511999999999"
  },
  "items": [
    {"product": "Lentes de Contato", "qty": 2, "price": 75.00}
  ],
  "total": 150.00
}
```

### Workflow 2: Abandono de Carrinho
```json
{
  "name": "Cart Abandonment",
  "trigger": "schedule_daily",
  "actions": [
    "Find abandoned carts > 2 hours",
    "Send recovery email",
    "Send WhatsApp reminder",
    "Track conversions"
  ]
}
```

**Executar:**
```
Execute o workflow "Cart Abandonment" agora
```

### Workflow 3: Feedback Pós-Compra
```json
{
  "name": "Post Purchase Feedback",
  "trigger": "schedule",
  "actions": [
    "Wait 7 days after delivery",
    "Send feedback email",
    "Track NPS score",
    "Update customer profile"
  ]
}
```

## 💡 Dicas de Uso com Claude

### Análise Inteligente
```
Analise as execuções do workflow "Sales Report" e me diga:
1. Quantas falharam?
2. Qual o tempo médio de execução?
3. Existem padrões de erro?
```

### Criação de Workflows
```
Quero criar um workflow que:
- Monitore novos clientes no Stripe
- Adicione no CRM
- Envie email de boas-vindas
- Agende follow-up em 3 dias

Me ajude a estruturar isso no n8n
```

### Debug e Troubleshooting
```
O workflow "Email Campaign" está falhando.
Mostre as últimas 5 execuções e identifique o problema.
```

### Otimização
```
Liste todos os workflows e me diga:
- Quais não são usados há mais de 30 dias
- Quais têm taxa de erro > 10%
- Quais demoram mais de 1 minuto
```

## 🎨 Templates de Workflows

### Template 1: API para Database
```javascript
// Workflow: Sync API → PostgreSQL
{
  "nodes": [
    {
      "type": "HTTP Request",
      "url": "https://api.example.com/orders",
      "method": "GET"
    },
    {
      "type": "PostgreSQL",
      "operation": "insert",
      "table": "orders"
    }
  ]
}
```

### Template 2: Webhook → Multi-channel
```javascript
// Workflow: Webhook → Email + WhatsApp + Slack
{
  "trigger": "webhook",
  "nodes": [
    {
      "type": "Send Email",
      "to": "{{ $json.email }}"
    },
    {
      "type": "WhatsApp",
      "phone": "{{ $json.phone }}"
    },
    {
      "type": "Slack",
      "channel": "#notifications"
    }
  ]
}
```

### Template 3: Schedule → Report
```javascript
// Workflow: Daily Report
{
  "trigger": "schedule:daily:9am",
  "nodes": [
    {
      "type": "PostgreSQL",
      "query": "SELECT * FROM sales WHERE date = CURRENT_DATE"
    },
    {
      "type": "Google Sheets",
      "operation": "append"
    },
    {
      "type": "Send Email",
      "subject": "Daily Sales Report"
    }
  ]
}
```

## 🔐 Exemplo de Segurança

### Validação de Webhook
```javascript
// Workflow: Secure Webhook
{
  "trigger": "webhook",
  "nodes": [
    {
      "type": "Function",
      "code": `
        // Validate signature
        const signature = $input.headers['x-signature'];
        const valid = validateSignature(signature, $input.body);
        if (!valid) throw new Error('Invalid signature');
        return $input.all();
      `
    }
  ]
}
```

## 📊 Métricas e Monitoramento

```
# Ver performance de workflows
Liste todas as execuções das últimas 24 horas
Calcule o tempo médio de cada workflow
Identifique workflows com mais de 3 falhas

# Alertas
Crie um workflow que me avise se:
- Qualquer workflow falhar 3x seguidas
- Tempo de execução > 5 minutos
- Taxa de erro > 20%
```

## 🚀 Integração com Outros Serviços

### Stripe → n8n → Database
```
Quando Stripe receber pagamento:
1. Webhook do Stripe → n8n
2. n8n processa dados
3. Salva no PostgreSQL
4. Envia email confirmação
5. Atualiza CRM
```

### Sendpulse → n8n → WhatsApp
```
Quando chatbot Sendpulse receber mensagem:
1. Webhook → n8n
2. n8n analisa intenção
3. Busca dados no CRM
4. Responde via WhatsApp API
5. Loga conversa
```

## 🎓 Recursos de Aprendizado

- [n8n Workflow Gallery](https://n8n.io/workflows/)
- [n8n Community Forum](https://community.n8n.io/)
- [Video Tutorials](https://www.youtube.com/c/n8n-io)

---

**Dica:** Comece simples e vá aumentando a complexidade!
