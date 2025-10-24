# Fase 4 - Frontend Integration Plan

**Data de Início**: 2025-10-24
**Status**: 🔄 Em Andamento
**Responsável**: Frontend Architect AI

## Objetivo

Integrar componentes frontend existentes com as APIs do backend da Fase 3, criando uma experiência completa e funcional para os assinantes gerenciarem:
- Prescrições médicas (upload e histórico)
- Histórico de pagamentos com paginação
- Preferências de entrega personalizadas

## Estado Atual

### ✅ Backend APIs (Fase 3 - Completa)

As seguintes APIs foram implementadas e testadas:

1. **Prescription Management**
   - `GET /api/assinante/prescription` - Listar prescrições
   - `POST /api/assinante/prescription` - Upload de prescrição
   - `GET /api/assinante/prescription/[id]` - Detalhes da prescrição
   - `DELETE /api/assinante/prescription/[id]` - Excluir prescrição

2. **Payment History**
   - `GET /api/assinante/payment-history` - Histórico paginado
   - Suporte a filtros: `status`, `startDate`, `endDate`, `paymentMethod`
   - Paginação: `page`, `limit`

3. **Delivery Preferences**
   - `GET /api/assinante/delivery-preferences` - Obter preferências
   - `PUT /api/assinante/delivery-preferences` - Atualizar preferências
   - Campos: endereço, horário preferido, instruções, notificações

### ✅ Componentes Frontend (Criados mas não integrados)

Os componentes já foram desenvolvidos mas **não estão conectados às APIs**:

1. **PrescriptionManager.tsx** (24.665 bytes)
   - Interface completa para gerenciar prescrições
   - Upload de arquivos com preview
   - Exibição de histórico
   - ❌ Usando dados mock (não conectado à API)

2. **PaymentHistoryTable.tsx** (22.278 bytes)
   - Tabela com paginação
   - Filtros por status e período
   - Download de comprovantes
   - ❌ Usando dados mock (não conectado à API)

3. **DeliveryPreferences.tsx** (22.710 bytes)
   - Formulário de preferências
   - Validação de endereço
   - Configurações de notificação
   - ❌ Usando dados mock (não conectado à API)

### ⚠️ Dashboard Principal

O arquivo `src/app/area-assinante/dashboard/page.tsx`:
- ✅ Está funcionando com outros componentes (AccessibleDashboard, modals, etc.)
- ❌ **NÃO** está importando/usando os componentes da Fase 3:
  - PrescriptionManager
  - PaymentHistoryTable
  - DeliveryPreferences

## Tarefas da Fase 4

### 1. Integração de Componentes com APIs

#### 1.1 PrescriptionManager → API Integration
**Arquivo**: `src/components/assinante/PrescriptionManager.tsx`

**Mudanças necessárias**:
- [ ] Substituir dados mock por chamadas reais à API
- [ ] Implementar upload usando `FormData` e `multipart/form-data`
- [ ] Conectar histórico com `GET /api/assinante/prescription`
- [ ] Adicionar loading states e error handling
- [ ] Implementar retry logic para uploads falhados
- [ ] Adicionar validação de tamanho e tipo de arquivo

**API Endpoints a usar**:
```typescript
// Listar prescrições
fetch('/api/assinante/prescription', {
  headers: { 'x-user-id': userId }
})

// Upload prescrição
const formData = new FormData()
formData.append('file', prescriptionFile)
formData.append('expiresAt', expirationDate)
fetch('/api/assinante/prescription', {
  method: 'POST',
  headers: { 'x-user-id': userId },
  body: formData
})

// Excluir prescrição
fetch(`/api/assinante/prescription/${prescriptionId}`, {
  method: 'DELETE',
  headers: { 'x-user-id': userId }
})
```

#### 1.2 PaymentHistoryTable → API Integration
**Arquivo**: `src/components/assinante/PaymentHistoryTable.tsx`

**Mudanças necessárias**:
- [ ] Substituir dados mock por chamadas à API com paginação
- [ ] Implementar filtros funcionais (status, data, método)
- [ ] Adicionar paginação com controle de página
- [ ] Conectar download de comprovante
- [ ] Loading states para fetch inicial e paginação
- [ ] Error handling com retry

**API Endpoint a usar**:
```typescript
// Buscar histórico paginado
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  status: filterStatus,
  startDate: startDate?.toISOString(),
  endDate: endDate?.toISOString(),
  paymentMethod: filterMethod
})
fetch(`/api/assinante/payment-history?${params}`, {
  headers: { 'x-user-id': userId }
})
```

#### 1.3 DeliveryPreferences → API Integration
**Arquivo**: `src/components/assinante/DeliveryPreferences.tsx`

**Mudanças necessárias**:
- [ ] Carregar preferências existentes da API
- [ ] Conectar formulário de atualização
- [ ] Validação de CEP com API externa (ViaCEP)
- [ ] Loading states para load e save
- [ ] Success/error feedback com toast
- [ ] Optimistic UI updates

**API Endpoints a usar**:
```typescript
// Carregar preferências
fetch('/api/assinante/delivery-preferences', {
  headers: { 'x-user-id': userId }
})

// Atualizar preferências
fetch('/api/assinante/delivery-preferences', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify(preferences)
})
```

### 2. Integração no Dashboard

#### 2.1 Atualizar Dashboard Page
**Arquivo**: `src/app/area-assinante/dashboard/page.tsx`

**Mudanças necessárias**:
- [ ] Importar os 3 componentes da Fase 3
- [ ] Criar tabs ou sections para organizar conteúdo
- [ ] Adicionar navegação entre seções
- [ ] Responsividade mobile-first
- [ ] Lazy loading dos componentes pesados

**Estrutura proposta**:
```tsx
<DashboardLayout>
  <Tabs>
    <TabsList>
      <TabsTrigger value="overview">Visão Geral</TabsTrigger>
      <TabsTrigger value="prescription">Prescrição</TabsTrigger>
      <TabsTrigger value="payments">Pagamentos</TabsTrigger>
      <TabsTrigger value="delivery">Entrega</TabsTrigger>
    </TabsList>

    <TabsContent value="overview">
      <AccessibleDashboard ... />
    </TabsContent>

    <TabsContent value="prescription">
      <PrescriptionManager userId={user.id} />
    </TabsContent>

    <TabsContent value="payments">
      <PaymentHistoryTable userId={user.id} />
    </TabsContent>

    <TabsContent value="delivery">
      <DeliveryPreferences userId={user.id} />
    </TabsContent>
  </Tabs>
</DashboardLayout>
```

### 3. User Experience Enhancements

#### 3.1 Loading States
- [ ] Skeleton screens para carregamento inicial
- [ ] Spinners para ações (upload, save, delete)
- [ ] Shimmer effects para imagens loading
- [ ] Desabilitar botões durante operações

#### 3.2 Error Handling
- [ ] Toast notifications para erros
- [ ] Retry buttons para falhas de rede
- [ ] Fallback UI para componentes com erro
- [ ] Mensagens user-friendly (não técnicas)

#### 3.3 Success Feedback
- [ ] Toast success após ações
- [ ] Animações de sucesso
- [ ] Atualização otimista (optimistic UI)
- [ ] Confirmação antes de ações destrutivas

#### 3.4 Acessibilidade
- [ ] ARIA labels em todos os controles
- [ ] Navegação por teclado
- [ ] Focus management
- [ ] Screen reader announcements

### 4. Testing

#### 4.1 Component Tests
- [ ] Testar upload de prescrição com mock API
- [ ] Testar paginação do histórico de pagamentos
- [ ] Testar save de preferências de entrega
- [ ] Testar estados de loading e erro

#### 4.2 Integration Tests
- [ ] Fluxo completo: login → dashboard → upload prescrição
- [ ] Fluxo: visualizar pagamentos → aplicar filtros
- [ ] Fluxo: atualizar preferências → ver confirmação

#### 4.3 E2E Tests (Playwright)
- [ ] `subscriber-dashboard-phase4.spec.ts`
- [ ] Testar todos os fluxos críticos end-to-end
- [ ] Screenshots para regression testing

## Timeline Estimado

**Fase 4.1 - API Integration** (Prioridade Alta)
- PrescriptionManager integration: 2-3 horas
- PaymentHistoryTable integration: 1-2 horas
- DeliveryPreferences integration: 1-2 horas
- **Total**: ~4-7 horas

**Fase 4.2 - Dashboard Integration** (Prioridade Alta)
- Layout com tabs: 1 hora
- Navigation: 30min
- Responsiveness: 1 hora
- **Total**: ~2-3 horas

**Fase 4.3 - UX Polish** (Prioridade Média)
- Loading states: 1 hora
- Error handling: 1 hora
- Success feedback: 30min
- Acessibilidade: 1 hora
- **Total**: ~3-4 horas

**Fase 4.4 - Testing** (Prioridade Alta)
- Component tests: 2 horas
- Integration tests: 1 hora
- E2E tests: 2 horas
- **Total**: ~5 horas

**TOTAL ESTIMADO**: 14-19 horas

## Success Criteria

✅ **Funcionalidade**:
- [ ] Usuário pode fazer upload de prescrição e ver no histórico
- [ ] Usuário pode visualizar pagamentos com filtros e paginação
- [ ] Usuário pode atualizar preferências de entrega

✅ **Qualidade**:
- [ ] Todos os testes passando (unit + integration + E2E)
- [ ] Zero errors no console do browser
- [ ] Performance: TTI < 3s, FCP < 1.5s

✅ **UX**:
- [ ] Loading states em todas as operações async
- [ ] Error handling com mensagens claras
- [ ] Feedback visual de sucesso
- [ ] Acessível via teclado e screen readers

✅ **Code Quality**:
- [ ] TypeScript strict mode sem errors
- [ ] ESLint passing
- [ ] Componentes documentados com JSDoc
- [ ] Error boundaries implementados

## Dependências Técnicas

- ✅ Backend APIs (Fase 3) - COMPLETO
- ✅ Componentes base (shadcn/ui) - DISPONÍVEL
- ✅ Sistema de autenticação - FUNCIONANDO
- ✅ Hooks de subscription - IMPLEMENTADO
- ⚠️ File upload configuration - VERIFICAR limits

## Riscos e Mitigações

**Risco 1**: Upload de arquivos grandes pode travar
- **Mitigação**: Implementar chunked upload e progress bar

**Risco 2**: APIs podem retornar erros 500
- **Mitigação**: Retry logic com exponential backoff

**Risco 3**: Componentes muito pesados podem impactar performance
- **Mitigação**: Code splitting e lazy loading

**Risco 4**: Dados sensíveis em prescrições
- **Mitigação**: Validar que uploads vão para storage seguro (não public)

## Próximos Passos Imediatos

1. ✅ Criar este documento de planejamento
2. 🔄 **ATUAL**: Começar integração do PrescriptionManager com APIs
3. ⏳ Integrar PaymentHistoryTable
4. ⏳ Integrar DeliveryPreferences
5. ⏳ Atualizar dashboard com tabs
6. ⏳ Implementar testes E2E

---

**Última Atualização**: 2025-10-24 05:37 UTC
**Próxima Revisão**: Após conclusão de PrescriptionManager integration
