# Dashboard Improvements - Gerenciamento de Assinatura com Asaas

## Resumo das Melhorias

Implementação completa de funcionalidades de gerenciamento de assinatura no dashboard do assinante, com integração total ao Asaas para:
- ✅ Mudança de plano
- ✅ Atualização de endereço de entrega
- ✅ Alteração de forma de pagamento

## Estrutura Implementada

### 1. Endpoints da API

#### `/api/subscription/change-plan` (POST)
**Funcionalidade:** Alterar plano de assinatura
**Integração Asaas:**
- Atualiza valor e descrição da assinatura via `asaas.updateSubscription()`
- Sincroniza alterações com banco de dados Prisma
- Suporta autenticação por Firebase UID ou Database ID

**Validação:**
```typescript
{
  newPlanId: string (obrigatório)
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "subscription": {
    "id": "...",
    "planType": "Plano Premium Mensal",
    "monthlyValue": 158.00,
    "status": "ACTIVE",
    "renewalDate": "2025-11-19",
    "benefits": [...]
  }
}
```

#### `/api/subscription/update-address` (POST)
**Funcionalidade:** Atualizar endereço de entrega
**Integração Asaas:**
- Atualiza dados do cliente no Asaas via `asaas.updateCustomer()`
- Atualiza `shippingAddress` na assinatura do banco de dados
- Validação completa de CEP com integração ViaCEP

**Validação:**
```typescript
{
  zipCode: string (formato: 00000-000)
  street: string (mín. 3 caracteres)
  number: string (obrigatório)
  complement?: string (opcional)
  neighborhood: string (mín. 2 caracteres)
  city: string (mín. 2 caracteres)
  state: string (2 letras)
}
```

#### `/api/subscription/update-payment` (POST)
**Funcionalidade:** Alterar forma de pagamento
**Integração Asaas:**
- Atualiza `billingType` da assinatura
- Para cartão de crédito: tokeniza e armazena dados de forma segura
- Suporta: PIX, Boleto Bancário, Cartão de Crédito

**Validação:**
```typescript
{
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  creditCard?: {
    holderName: string
    number: string (13-19 dígitos)
    expiryMonth: string (MM)
    expiryYear: string (AAAA)
    ccv: string (3-4 dígitos)
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string (11 dígitos)
    postalCode: string
    addressNumber: string
    phone: string (10-11 dígitos)
  }
}
```

### 2. Componentes UI

#### `ChangePlanModal`
**Localização:** `src/components/assinante/ChangePlanModal.tsx`

**Funcionalidades:**
- Listagem de todos os planos disponíveis
- Comparação visual entre plano atual e novos planos
- Cálculo automático de diferença de preço
- Indicadores visuais de plano atual
- Mensagens de sucesso/erro
- Loading states durante operações assíncronas

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  currentPlan: { id: string, name: string, price: number }
  availablePlans: PricingPlan[]
  onPlanChange: (newPlanId: string) => Promise<void>
}
```

#### `UpdateAddressModal`
**Localização:** `src/components/assinante/UpdateAddressModal.tsx`

**Funcionalidades:**
- Busca automática de endereço por CEP (ViaCEP)
- Preenchimento automático de rua, bairro, cidade e estado
- Validação completa de todos os campos
- Suporte a complemento opcional
- Máscara para CEP
- Loading durante busca de CEP

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  currentAddress?: AddressData | null
  onAddressUpdate: (address: AddressData) => Promise<void>
}
```

#### `UpdatePaymentModal`
**Localização:** `src/components/assinante/UpdatePaymentModal.tsx`

**Funcionalidades:**
- Seleção visual entre PIX, Boleto e Cartão de Crédito
- Formulário completo para dados de cartão de crédito
- Validação de número de cartão, validade e CVV
- Coleta de dados do titular para Asaas
- Máscaras de entrada para campos numéricos
- Mensagens informativas sobre cada tipo de pagamento

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  currentPaymentMethod?: { type: PaymentType, last4?: string }
  onPaymentUpdate: (paymentData: any) => Promise<void>
}
```

#### `Modal` (Componente Base)
**Localização:** `src/components/ui/Modal.tsx`

**Funcionalidades:**
- Portal do React para renderização fora da árvore DOM
- Fechamento por ESC ou clique no overlay
- Prevenção de scroll no body quando aberto
- Tamanhos configuráveis: sm, md, lg, xl, full
- Animações de entrada/saída
- Máxima altura de 90vh com scroll interno

### 3. Integração no Dashboard

**Arquivo:** `src/app/area-assinante/dashboard/page.tsx`

**Novos Elementos:**
1. **Botões de Ação:**
   - "Mudar Plano" - Card de Status da Assinatura
   - "Forma Pagamento" - Card de Pagamento e Entrega
   - "Endereço" - Card de Pagamento e Entrega

2. **Handlers Assíncronos:**
   - `handlePlanChange()` - Chamada ao endpoint de mudança de plano
   - `handleAddressUpdate()` - Chamada ao endpoint de atualização de endereço
   - `handlePaymentUpdate()` - Chamada ao endpoint de mudança de pagamento
   - Todos com tratamento de erro e refresh automático após sucesso

3. **Gerenciamento de Estado:**
   - Loading dos planos disponíveis
   - Controle de abertura/fechamento de modals
   - Refresh automático da assinatura após mudanças

## Fluxos de Usuário

### Mudança de Plano
1. Usuário clica em "Mudar Plano" no dashboard
2. Modal abre mostrando plano atual e opções disponíveis
3. Usuário seleciona novo plano
4. Sistema calcula diferença de preço e mostra aviso sobre proporcionalidade
5. Usuário confirma alteração
6. Requisição enviada para `/api/subscription/change-plan`
7. Asaas atualiza assinatura
8. Banco de dados sincronizado
9. Dashboard atualizado automaticamente

### Atualização de Endereço
1. Usuário clica em "Endereço" no dashboard
2. Modal abre com formulário de endereço
3. Usuário digita CEP → Sistema busca dados via ViaCEP
4. Campos preenchidos automaticamente
5. Usuário completa/ajusta informações
6. Confirma alteração
7. Requisição enviada para `/api/subscription/update-address`
8. Asaas atualiza dados do cliente
9. Banco de dados atualizado com novo endereço

### Mudança de Forma de Pagamento
1. Usuário clica em "Forma Pagamento" no dashboard
2. Modal abre com opções: PIX, Boleto, Cartão
3. Se cartão:
   - Preenche dados do cartão
   - Preenche dados do titular
4. Usuário confirma
5. Requisição enviada para `/api/subscription/update-payment`
6. Asaas atualiza método de pagamento da assinatura
7. Próximas cobranças usarão novo método

## Segurança

### Autenticação
- Todos os endpoints validam `x-user-id` header
- Suporte dual: Firebase UID e Database ID
- Rejeição automática de requisições não autenticadas (401)

### Validação de Dados
- **Zod schemas** em todos os endpoints
- Validação de formatos: CEP, CPF, telefone, email
- Sanitização de entrada de dados
- Mensagens de erro descritivas

### PCI Compliance (Cartão de Crédito)
- Dados de cartão enviados diretamente ao Asaas
- Apenas últimos 4 dígitos armazenados no banco
- Sem armazenamento de CVV
- Tokenização gerenciada pelo Asaas

## Tratamento de Erros

### Frontend
- Estados de loading durante operações
- Mensagens de erro amigáveis
- Desabilitação de botões durante processamento
- Feedback visual de sucesso

### Backend
- Try-catch em todas as operações
- Logs detalhados no console
- Códigos HTTP apropriados (400, 401, 404, 500)
- Mensagens de erro específicas

## Melhorias Futuras Sugeridas

1. **Histórico de Alterações:**
   - Log de mudanças de plano/endereço/pagamento
   - Timeline de modificações

2. **Upgrade/Downgrade Proativo:**
   - Cálculo automático de créditos/débitos
   - Previsualização de próxima fatura

3. **Validação de Cartão:**
   - Verificação de BIN (primeiros 6 dígitos)
   - Detecção de bandeira do cartão
   - Validação de algoritmo de Luhn

4. **Notificações:**
   - Email de confirmação após mudanças
   - WhatsApp para alterações críticas
   - Push notifications

5. **Testes:**
   - Testes E2E com Playwright
   - Testes de integração com Asaas sandbox
   - Testes unitários dos componentes

## Checklist de Testes

- [ ] Mudança de plano - upgrade
- [ ] Mudança de plano - downgrade
- [ ] Mudança de plano - mesmo plano (deve rejeitar)
- [ ] Atualização de endereço - CEP válido
- [ ] Atualização de endereço - CEP inválido
- [ ] Atualização de endereço - campos obrigatórios
- [ ] Mudança para PIX
- [ ] Mudança para Boleto
- [ ] Mudança para Cartão de Crédito - válido
- [ ] Mudança para Cartão de Crédito - inválido
- [ ] Validação de autenticação em todos endpoints
- [ ] Refresh automático após mudanças
- [ ] Mensagens de erro apropriadas
- [ ] Loading states funcionando

## Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Asaas API v3** - Gateway de pagamento
- **Prisma** - ORM de banco de dados
- **Zod** - Validação de schemas
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **ViaCEP** - Busca de endereços

## Comandos Úteis

```bash
# Build de produção
npm run build

# Reiniciar serviço
systemctl restart svlentes-nextjs

# Ver logs em tempo real
journalctl -u svlentes-nextjs -f

# Verificar status
systemctl status svlentes-nextjs

# Testar endpoint (exemplo)
curl -X POST https://svlentes.shop/api/subscription/change-plan \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{"newPlanId": "premium"}'
```

## Suporte

Para problemas ou dúvidas:
- **Email:** saraivavision@gmail.com
- **WhatsApp:** (33) 98606-1427
- **Médico Responsável:** Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
