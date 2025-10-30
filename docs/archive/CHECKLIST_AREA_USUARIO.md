# ✅ Checklist de Ações - Área do Usuário

## 🔴 URGENTE - Fazer Antes de Produção

### 1. Dashboard Funcional
- [ ] Criar tabela de assinaturas no banco de dados
- [ ] Implementar `GET /api/assinante/subscription`
  ```typescript
  // Retornar dados reais:
  - ID da assinatura
  - Plano contratado
  - Status (ativa/cancelada/pendente)
  - Próxima cobrança
  - Valor mensal
  - Data de início
  ```
- [ ] Conectar dashboard com API
- [ ] Remover dados hardcoded do `dashboard/page.tsx`
- [ ] Testar com dados reais

**Estimativa:** 3-5 dias  
**Responsável:** Backend Developer + Frontend Developer

---

### 2. Segurança de Senha
- [ ] Atualizar validação de senha mínima para 8 caracteres
- [ ] Adicionar regex para:
  - [ ] Pelo menos 1 letra maiúscula
  - [ ] Pelo menos 1 número
  - [ ] Pelo menos 1 caractere especial
- [ ] Criar componente de medidor de força de senha
- [ ] Adicionar feedback visual em tempo real
- [ ] Atualizar mensagens de erro
- [ ] Testar em todas as páginas (registro, reset password)

**Código a Alterar:**
```typescript
// src/app/area-assinante/registro/page.tsx (linha 35-39)
// src/lib/validations.ts (criar schema de senha)
```

**Estimativa:** 1 dia  
**Responsável:** Frontend Developer

---

### 3. Rate Limiting
- [ ] Instalar biblioteca de rate limiting
  ```bash
  npm install express-rate-limit
  # ou
  npm install @upstash/ratelimit
  ```
- [ ] Implementar middleware de rate limiting
- [ ] Aplicar a todos os endpoints de autenticação:
  - [ ] `/api/auth/login`
  - [ ] `/api/auth/register`
  - [ ] `/api/auth/forgot-password`
  - [ ] `/api/auth/reset-password`
- [ ] Configurar limites:
  - 5 tentativas por 15 minutos (login)
  - 3 tentativas por hora (forgot password)
- [ ] Adicionar captcha após 3 tentativas falhas
- [ ] Testar proteção

**Estimativa:** 2 dias  
**Responsável:** Backend Developer

---

### 4. Remover Logs Sensíveis
- [ ] Auditar todos os arquivos por `console.log`
- [ ] Remover logs que expõem:
  - [ ] UIDs de usuários
  - [ ] Emails
  - [ ] Tokens
  - [ ] Dados de assinatura
- [ ] Configurar logging condicional
  ```typescript
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) console.log('[DEBUG]', data)
  ```
- [ ] Implementar logger profissional (Winston ou Pino)
- [ ] Integrar com Sentry para errors
- [ ] Testar em produção

**Arquivos a Revisar:**
- `src/contexts/AuthContext.tsx`
- `src/app/area-assinante/login/page.tsx`
- `src/app/area-assinante/registro/page.tsx`
- `src/components/auth/SocialLoginButtons.tsx`
- Todos os arquivos em `src/app/api/`

**Estimativa:** 1 dia  
**Responsável:** Backend Developer

---

## 🟡 IMPORTANTE - Próximas 2 Semanas

### 5. Corrigir Testes
- [ ] Instalar dependências faltantes
  ```bash
  npm install --save-dev vitest @testing-library/react-hooks @tanstack/react-query
  ```
- [ ] Atualizar configuração Jest para incluir vitest
- [ ] Criar componentes faltantes:
  - [ ] `components/assinante/SubscriptionStatus.tsx`
  - [ ] `components/assinante/BenefitsDisplay.tsx`
  - [ ] `components/assinante/ShippingAddress.tsx`
- [ ] Atualizar testes para match com implementação atual
- [ ] Executar `npm test` e verificar todos passam
- [ ] Adicionar coverage report
  ```bash
  npm run test:coverage
  ```
- [ ] Garantir >80% de cobertura

**Estimativa:** 2 dias  
**Responsável:** QA + Frontend Developer

---

### 6. Resolver Problema de Build
- [ ] Investigar erro de Google Fonts
- [ ] Opção A: Hospedar fonts localmente
  - [ ] Baixar Inter e Poppins
  - [ ] Adicionar em `/public/fonts/`
  - [ ] Atualizar `layout.tsx` para usar fonts locais
- [ ] Opção B: Configurar fallback
  ```typescript
  // next.config.js
  experimental: {
    fontLoaders: [
      { loader: '@next/font/google', options: { fallback: ['system-ui'] }}
    ]
  }
  ```
- [ ] Testar build em ambiente isolado
- [ ] Verificar deploy em staging

**Estimativa:** 0.5 dia  
**Responsável:** DevOps + Frontend Developer

---

### 7. Histórico de Pedidos
- [ ] Criar tabela de pedidos no banco
- [ ] Implementar `GET /api/assinante/orders`
- [ ] Criar componente `OrderHistory.tsx`
- [ ] Adicionar ao dashboard
- [ ] Implementar paginação
- [ ] Adicionar filtros (data, status)
- [ ] Testar com múltiplos pedidos

**Estimativa:** 2-3 dias  
**Responsável:** Full Stack Developer

---

### 8. Gestão de Pagamento
- [ ] Integrar com Asaas API
- [ ] Criar endpoint `GET /api/assinante/payment-methods`
- [ ] Criar endpoint `PUT /api/assinante/payment-methods`
- [ ] Criar componente de atualização de cartão
- [ ] Implementar tokenização de cartão
- [ ] Adicionar validação de cartão
- [ ] Testar fluxo completo
- [ ] Garantir conformidade PCI-DSS

**Estimativa:** 3-4 dias  
**Responsável:** Backend Developer + Frontend Developer

---

## 🟢 MELHORIAS - Backlog

### 9. Autenticação de Dois Fatores (2FA)
- [ ] Pesquisar melhor método (SMS, TOTP, Email)
- [ ] Implementar com Firebase Auth
- [ ] Criar UI para configuração de 2FA
- [ ] Adicionar verificação no login
- [ ] Criar códigos de backup
- [ ] Testar fluxo completo

**Estimativa:** 3-4 dias  
**Responsável:** Full Stack Developer

---

### 10. Gestão de Sessões
- [ ] Criar tabela de sessões ativas
- [ ] Mostrar dispositivos conectados
- [ ] Implementar "Sair de todos os dispositivos"
- [ ] Adicionar notificação de novo login
- [ ] Implementar timeout de inatividade
- [ ] Testar em múltiplos dispositivos

**Estimativa:** 2-3 dias  
**Responsável:** Backend Developer

---

### 11. Melhorar Acessibilidade
- [ ] Adicionar atributos ARIA completos
- [ ] Implementar navegação por teclado
- [ ] Adicionar skip links
- [ ] Testar com screen reader
- [ ] Verificar contraste de cores
- [ ] Validar com WAVE ou aXe
- [ ] Corrigir issues identificados

**Estimativa:** 2 dias  
**Responsável:** Frontend Developer

---

### 12. Performance
- [ ] Implementar lazy loading de componentes
- [ ] Memoizar AuthContext
- [ ] Otimizar imports do Firebase
- [ ] Usar next/image para todas as imagens
- [ ] Implementar code splitting
- [ ] Executar Lighthouse audit
- [ ] Otimizar bundle size

**Estimativa:** 2 dias  
**Responsável:** Frontend Developer

---

### 13. Notificações
- [ ] Criar sistema de notificações in-app
- [ ] Implementar WebSocket ou Server-Sent Events
- [ ] Criar componente de notificações
- [ ] Adicionar badge de contador
- [ ] Implementar push notifications (opcional)
- [ ] Testar em tempo real

**Estimativa:** 3 dias  
**Responsável:** Full Stack Developer

---

### 14. Documentação
- [ ] Criar README da área do usuário
- [ ] Documentar fluxos de autenticação
- [ ] Criar guia de setup do Firebase
- [ ] Documentar APIs
- [ ] Adicionar comentários inline em código complexo
- [ ] Criar diagramas de arquitetura
- [ ] Documentar variáveis de ambiente

**Estimativa:** 2 dias  
**Responsável:** Tech Lead

---

## 📋 Checklist de Teste Manual

### Antes de Cada Deploy
- [ ] Registro de novo usuário funciona
- [ ] Email de verificação é enviado
- [ ] Login com email/senha funciona
- [ ] Login com Google funciona
- [ ] Login com Facebook funciona
- [ ] Recuperação de senha funciona
- [ ] Dashboard carrega dados corretos
- [ ] Logout funciona
- [ ] Proteção de rota funciona (não autenticado não acessa dashboard)
- [ ] Mensagens de erro são claras
- [ ] Loading states aparecem corretamente
- [ ] Responsive em mobile funciona
- [ ] Não há erros no console do browser
- [ ] Performance é aceitável (< 3s para carregar)

---

## 📊 Métricas de Sucesso

### Targets:
- [ ] 100% dos fluxos críticos funcionando
- [ ] 0 vulnerabilidades de segurança alta/crítica
- [ ] Cobertura de testes > 80%
- [ ] Lighthouse Score > 90
- [ ] 0 erros no console em produção
- [ ] Tempo de carregamento < 3s
- [ ] Taxa de conversão (registro) > 60%
- [ ] Taxa de retenção (login após 30 dias) > 40%

---

## 🚨 Red Flags - NÃO DEPLOY SE:

- ❌ Dashboard mostra dados hardcoded
- ❌ Senha de 6 caracteres ainda aceita
- ❌ Sem rate limiting
- ❌ Logs sensíveis em produção
- ❌ Testes não executam
- ❌ Build falha
- ❌ Erros no console do browser
- ❌ APIs de autenticação sem proteção
- ❌ Variáveis de ambiente expostas
- ❌ HTTPS não configurado

---

## 📞 Contatos em Caso de Problemas

**Desenvolvedor Responsável:** [Nome]  
**Tech Lead:** [Nome]  
**DevOps:** [Nome]  
**Emergência:** saraivavision@gmail.com / +55 33 99898-026

---

**Última Atualização:** 16 de outubro de 2025  
**Versão:** 1.0  
**Status:** 🔴 Crítico - Necessita ação imediata
