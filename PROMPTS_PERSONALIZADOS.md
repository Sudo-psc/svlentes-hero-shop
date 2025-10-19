# 🤖 Prompts Personalizados SVLentes - 100 Rotinas e Tarefas

Este documento contém 100 prompts personalizados e otimizados para desenvolvimento, manutenção e operação do sistema SVLentes - plataforma de assinatura de lentes de contato com acompanhamento médico.

## 📋 Índice por Categoria

- [Desenvolvimento Frontend (1-20)](#desenvolvimento-frontend)
- [Desenvolvimento Backend (21-35)](#desenvolvimento-backend)
- [Integração de Pagamentos Asaas (36-45)](#integração-de-pagamentos-asaas)
- [Sistema WhatsApp e Chatbot (46-55)](#sistema-whatsapp-e-chatbot)
- [Testes e Qualidade (56-65)](#testes-e-qualidade)
- [Deploy e CI/CD (66-75)](#deploy-e-cicd)
- [Monitoramento e Performance (76-85)](#monitoramento-e-performance)
- [Segurança e Compliance (86-95)](#segurança-e-compliance)
- [Documentação e Manutenção (96-100)](#documentação-e-manutenção)

---

## Desenvolvimento Frontend

### 1. Criar novo componente shadcn/ui
```
Crie um novo componente usando shadcn/ui para [NOME_COMPONENTE]. O componente deve:
- Seguir padrão de design system (cores cyan primary, silver secondary)
- Usar Tailwind CSS com função cn() para classes condicionais
- Ter variantes responsivas (mobile-first, breakpoints md: e lg:)
- Incluir animações com Framer Motion quando apropriado
- Exportar em PascalCase de src/components/ui/[Nome].tsx
- Incluir TypeScript types adequados
```

### 2. Adicionar nova seção na landing page
```
Adicione uma nova seção à landing page com o seguinte requisito: [DESCRIÇÃO].
- Criar componente em src/components/sections/[NomeSecao].tsx
- Integrar com layout responsivo existente
- Adicionar animações suaves no scroll (Framer Motion)
- Garantir acessibilidade (ARIA labels, contraste de cores)
- Otimizar para Web Vitals (CLS, LCP, FID)
- Testar em mobile, tablet e desktop
```

### 3. Implementar formulário com validação Zod
```
Crie um formulário para [PROPÓSITO] usando React Hook Form + Zod:
- Definir schema Zod em src/lib/validations.ts
- Usar hook useForm com resolver zodResolver
- Implementar validação em tempo real
- Adicionar mensagens de erro contextualizadas em português
- Incluir estados de loading e sucesso/erro
- Garantir compliance LGPD (consentimento explícito)
```

### 4. Otimizar performance de componente pesado
```
Analise e otimize o componente [NOME_COMPONENTE] para melhor performance:
- Identificar re-renders desnecessários (usar React DevTools Profiler)
- Implementar useMemo e useCallback onde apropriado
- Lazy load de componentes não críticos (React.lazy)
- Otimizar imagens (next/image com sizes e priority)
- Code splitting para bundles menores
- Medir impacto com Lighthouse antes e depois
```

### 5. Adicionar funcionalidade de personalização de conteúdo
```
Implemente personalização dinâmica para [ELEMENTO] usando o sistema de personas:
- Usar hook usePersonalization() para obter persona do usuário
- Criar variações de conteúdo para cada persona (health-conscious, price-conscious, convenience-seeker, first-timer)
- Implementar lógica de fallback para persona não identificada
- Adicionar tracking de efetividade das variações
- Garantir transições suaves entre variações
```

### 6. Criar página de erro customizada
```
Desenvolva uma página de erro [404/500] customizada:
- Design alinhado com identidade visual SVLentes
- Mensagens úteis e orientações para o usuário
- Links para páginas principais (home, planos, FAQ)
- Opção de reportar problema (formulário simplificado)
- Animações leves para melhorar UX
- SEO adequado (meta tags, canonical)
```

### 7. Implementar modal de confirmação reutilizável
```
Crie um componente Modal de confirmação genérico:
- Usar Radix UI Dialog como base
- Props: title, description, confirmText, cancelText, onConfirm, onCancel
- Variantes: danger (vermelho), warning (amarelo), info (azul)
- Acessível (keyboard navigation, focus trap)
- Responsivo e com animações suaves
- Exportar de src/components/ui/ConfirmDialog.tsx
```

### 8. Adicionar animação de loading skeleton
```
Implemente skeleton loading para [COMPONENTE]:
- Criar componente Skeleton reutilizável com Tailwind
- Animação de shimmer effect (gradiente animado)
- Manter layout idêntico ao conteúdo real (evitar CLS)
- Usar durante fetch de dados da API
- Fallback para spinner em casos específicos
```

### 9. Criar sistema de notificações toast
```
Implemente sistema de notificações toast usando:
- Radix UI Toast como base
- Hook useToast customizado para facilitar uso
- Variantes: success, error, warning, info
- Auto-dismiss configurável
- Stack de múltiplas notificações
- Posição configurável (top-right padrão)
- Acessível (screen reader friendly)
```

### 10. Implementar busca com autocomplete
```
Desenvolva campo de busca com autocomplete para [CONTEXTO]:
- Debounce de 300ms nas requisições
- Highlight dos termos buscados nos resultados
- Navegação por teclado (setas + Enter)
- Loading state durante busca
- Empty state quando sem resultados
- Cache local de buscas recentes
```

### 11. Adicionar dark mode toggle
```
Implemente suporte a dark mode:
- Usar next-themes para gerenciar tema
- Adicionar toggle switch no header
- Definir cores dark mode em tailwind.config
- Persistir preferência do usuário (localStorage)
- Respeitar preferência do sistema (prefers-color-scheme)
- Garantir contraste adequado em todos os componentes
```

### 12. Criar calculadora interativa avançada
```
Melhore a calculadora de economia existente com:
- Mais opções de customização (frequência de troca, tipo de lente)
- Gráfico visual de comparação (recharts)
- Animações nos valores calculados (countup effect)
- Opção de compartilhar resultado (share API)
- Salvar cálculos favoritos (localStorage)
- Tooltip explicativo em cada campo
```

### 13. Implementar galeria de imagens otimizada
```
Crie galeria de imagens para [CONTEXTO]:
- Lazy loading com Intersection Observer
- Progressive loading (blur placeholder → full image)
- Lightbox ao clicar (modal fullscreen)
- Navegação por teclado e touch gestures
- Otimização automática com next/image
- Suporte a diferentes aspect ratios
```

### 14. Adicionar breadcrumbs dinâmicos
```
Implemente breadcrumbs de navegação:
- Geração automática baseada na rota (Next.js router)
- Schema.org structured data para SEO
- Truncate em mobile para economizar espaço
- Links clicáveis para navegação rápida
- Destaque do item atual (não clicável)
- Estilo consistente com design system
```

### 15. Criar filtros avançados para listagem
```
Desenvolva sistema de filtros para [LISTAGEM]:
- Múltiplos critérios simultâneos (checkboxes, ranges, selects)
- URL sync (query params) para compartilhamento
- Clear all filters button
- Contador de itens filtrados
- Loading state durante filtragem
- Persistir filtros entre navegações (sessionStorage)
```

### 16. Implementar infinite scroll com paginação
```
Adicione infinite scroll à listagem de [CONTEÚDO]:
- Intersection Observer para detectar fim da página
- Fetch automático de próxima página
- Loading indicator durante carregamento
- Botão "Carregar mais" como fallback
- Preservar posição de scroll ao voltar
- Otimizar performance com virtualização se necessário
```

### 17. Criar componente de timeline visual
```
Desenvolva componente Timeline para exibir [EVENTOS]:
- Layout vertical responsivo
- Ícones customizáveis por tipo de evento
- Cores diferentes por status/categoria
- Data/hora formatada em português
- Hover effects para detalhes adicionais
- Animação de entrada progressive (stagger)
```

### 18. Adicionar comparador de planos interativo
```
Crie comparador side-by-side de planos de assinatura:
- Layout em grid responsivo (cards em mobile, tabela em desktop)
- Highlight de diferenças entre planos
- Sticky header ao fazer scroll
- Toggle para mostrar/ocultar recursos avançados
- CTA destacado no plano recomendado
- Animações ao trocar entre visualizações
```

### 19. Implementar carrossel de depoimentos
```
Desenvolva carrossel de depoimentos de clientes:
- Auto-play com pause ao hover
- Navegação por dots e setas
- Swipe gestures em mobile
- Lazy load de imagens de clientes
- Schema.org Review markup para SEO
- Variação aleatória na ordem de exibição
```

### 20. Criar dashboard de área do assinante
```
Desenvolva dashboard na área do assinante com:
- Cards de resumo (próxima entrega, status pagamento, etc)
- Gráfico de histórico de pedidos (recharts)
- Quick actions (pausar, editar endereço, etc)
- Notificações importantes destacadas
- Links rápidos para ações comuns
- Skeleton loading em todos os componentes de dados
```

---

## Desenvolvimento Backend

### 21. Criar nova API route Next.js
```
Implemente nova API route em src/app/api/[rota]/route.ts para [PROPÓSITO]:
- Validar input com Zod schema
- Implementar rate limiting (100 req/min por IP)
- Tratamento de erros padronizado (try-catch com logger)
- Response tipada com TypeScript
- Logs estruturados para debug
- Documentação inline dos endpoints
```

### 22. Integrar nova API externa
```
Adicione integração com API [NOME_SERVICO]:
- Criar client em src/lib/[servico].ts
- Implementar retry logic com exponential backoff
- Cache de responses quando apropriado (Redis ou in-memory)
- Timeout configurável (padrão 10s)
- Tratamento de rate limits da API externa
- Testes de integração com mocks
```

### 23. Otimizar consultas ao banco de dados
```
Analise e otimize consultas do Prisma em [ARQUIVO]:
- Identificar N+1 queries (usar Prisma logs)
- Implementar includes e selects estratégicos
- Adicionar índices necessários no schema
- Usar findMany com pagination
- Implementar caching de queries frequentes
- Medir performance antes e depois (query time)
```

### 24. Implementar webhook listener
```
Crie webhook listener para [SERVIÇO] em src/app/api/webhooks/[servico]/route.ts:
- Validar signature do webhook (HMAC)
- Processar eventos de forma idempotente (usar event ID)
- Retry automático em caso de falha (queue)
- Logging detalhado de cada evento
- Rate limiting específico para webhooks
- Testes com payloads reais
```

### 25. Criar middleware de autenticação
```
Implemente middleware de autenticação para [CONTEXTO]:
- Validar JWT tokens (NextAuth.js session)
- Verificar permissões/roles se aplicável
- Refresh token quando expirando
- Redirect para login se não autenticado
- Logging de tentativas de acesso
- Rate limiting por usuário
```

### 26. Adicionar job de processamento em background
```
Crie job em background para [TAREFA]:
- Usar cron job se periódico (node-cron ou sistema)
- Queue com retry para jobs sob demanda (Bull ou similar)
- Logging detalhado de execução
- Métricas de sucesso/falha
- Notificação em caso de falhas críticas
- Timeout adequado para evitar jobs travados
```

### 27. Implementar sistema de cache estratégico
```
Adicione caching para [RECURSO]:
- Escolher estratégia: Redis, in-memory, ou CDN
- Definir TTL apropriado baseado em volatilidade
- Implementar cache invalidation quando dados mudam
- Cache warming para recursos críticos
- Fallback para source quando cache miss
- Métricas de hit rate
```

### 28. Criar serviço de envio de email transacional
```
Implemente envio de email para [TIPO_EMAIL]:
- Usar Resend API (configurado no projeto)
- Template em React com components reutilizáveis
- Personalização com dados do usuário
- Fallback para template texto puro
- Tracking de abertura e cliques (opcional)
- Retry em caso de falha
- Logs de envio e erros
```

### 29. Adicionar validação server-side robusta
```
Implemente validação server-side para [ENDPOINT]:
- Schema Zod detalhado com mensagens customizadas
- Validar tipos, ranges, formatos, relações
- Sanitização de inputs (XSS prevention)
- Validação de regras de negócio complexas
- Rate limiting por endpoint
- Response 400 com erros estruturados
```

### 30. Implementar soft delete para dados sensíveis
```
Adicione soft delete ao model [NOME_MODEL]:
- Adicionar campo deletedAt (DateTime?) no schema Prisma
- Criar helper isDeleted() no model
- Filtrar registros deletados em queries padrão
- Adicionar endpoint de recuperação (undelete)
- Cron job para hard delete após período (ex: 90 dias)
- Auditoria de deleções
```

### 31. Criar aggregação de dados para dashboard
```
Implemente aggregação de métricas para [DASHBOARD]:
- Queries otimizadas com groupBy do Prisma
- Caching de resultados agregados (TTL 1h)
- Endpoint separado para cada métrica
- Suporte a filtros de data range
- Formato de response consistente
- Testes unitários das aggregations
```

### 32. Adicionar sistema de auditoria de ações
```
Implemente audit log para ações em [MODELO]:
- Criar model AuditLog no Prisma
- Capturar: usuário, ação, timestamp, antes/depois
- Middleware para captura automática
- Queries para histórico de mudanças
- Retention policy (manter por X meses)
- UI para visualização de logs
```

### 33. Implementar rate limiting granular
```
Configure rate limiting para [CONTEXTO]:
- Por IP: 100 req/min em endpoints públicos
- Por usuário autenticado: 1000 req/min
- Por API key: conforme plano
- Endpoints sensíveis com limites menores
- Response 429 com Retry-After header
- Monitoramento de rate limit abuse
```

### 34. Criar sistema de feature flags
```
Implemente feature flags para controle de funcionalidades:
- Tabela FeatureFlags no Prisma
- Cache local de flags (atualização a cada 5min)
- Helper isFeatureEnabled(flag, userId?)
- UI admin para toggle de flags
- Suporte a rollout percentual
- Logs quando flag é verificada
```

### 35. Adicionar processamento assíncrono de arquivos
```
Implemente upload e processamento de [TIPO_ARQUIVO]:
- Upload para storage (S3, Cloudinary, ou similar)
- Validação de tipo e tamanho
- Processamento assíncrono (resize, optimização)
- Progress tracking para uploads grandes
- Cleanup de arquivos temporários
- CDN para servir arquivos processados
```

---

## Integração de Pagamentos Asaas

### 36. Criar nova cobrança PIX programática
```
Implemente criação de cobrança PIX via Asaas API:
- Endpoint em src/app/api/asaas/create-payment/route.ts
- Validar dados do cliente (CPF/CNPJ, email, valor)
- Gerar QR Code e payload PIX
- Salvar payment ID no banco
- Webhook para confirmar pagamento
- Exibir QR Code + código copiável no frontend
```

### 37. Configurar assinatura recorrente
```
Configure assinatura recorrente com cartão:
- Criar subscription no Asaas via API
- Tokenizar cartão (PCI compliance)
- Definir billing cycle (mensal padrão)
- Configurar retry em caso de falha
- Notificar cliente sobre renovação
- Permitir cancelamento a qualquer momento
```

### 38. Implementar processamento de webhooks Asaas
```
Melhore webhook handler em src/app/api/webhooks/asaas/route.ts:
- Validar signature do webhook (Asaas-Access-Token)
- Processar todos eventos: PAYMENT_CREATED, PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_REFUNDED
- Atualizar status no banco atomicamente
- Enviar notificações ao cliente
- Retry automático em caso de falha
- Logging detalhado de cada evento
```

### 39. Adicionar relatório de transações
```
Crie relatório de transações financeiras:
- Query agregada por período, status, método
- Exportação para CSV/Excel
- Gráficos de volume e taxa de sucesso
- Filtros por cliente, plano, data
- Cache de relatórios complexos
- Permissionamento (admin only)
```

### 40. Implementar refund de pagamento
```
Adicione funcionalidade de estorno:
- Endpoint admin para solicitar refund
- Chamar API Asaas para processar estorno
- Atualizar status da subscription
- Notificar cliente sobre estorno
- Registrar motivo do estorno (auditoria)
- Reverter benefícios quando aplicável
```

### 41. Criar dashboard de saúde financeira
```
Desenvolva dashboard financeiro com:
- MRR (Monthly Recurring Revenue)
- Churn rate
- Taxa de conversão
- Inadimplência
- Métodos de pagamento mais usados
- Gráficos de tendência temporal
- Atualização em tempo real
```

### 42. Adicionar retry de pagamento falhado
```
Implemente sistema de retry para pagamentos:
- Detectar falhas via webhook PAYMENT_FAILED
- Retry automático após 3, 7, 14 dias
- Notificar cliente antes de cada retry
- Diferentes estratégias por tipo de falha
- Suspender assinatura após X falhas
- Reativar automaticamente ao pagar
```

### 43. Implementar split de pagamentos
```
Configure split de pagamento (se aplicável):
- Definir percentuais ou valores fixos
- Criar subaccounts no Asaas
- Split automático em cada transação
- Relatório de repasses
- Auditoria de splits realizados
```

### 44. Adicionar gestão de cupons de desconto
```
Crie sistema de cupons promocionais:
- Model Coupon no Prisma (code, discount, expiresAt)
- Validação de código no checkout
- Aplicação de desconto (percentual ou fixo)
- Uso único vs reutilizável
- Relatório de cupons usados
- Expiração automática
```

### 45. Criar reconciliação bancária automatizada
```
Implemente reconciliação de pagamentos:
- Comparar transações Asaas vs banco de dados
- Identificar discrepâncias
- Relatório de inconsistências
- Job diário de reconciliação
- Alertas para divergências críticas
- Dashboard de status de reconciliação
```

---

## Sistema WhatsApp e Chatbot

### 46. Configurar chatbot com novo intento
```
Adicione novo intento ao chatbot LangChain:
- Definir intento em src/lib/langchain-support-processor.ts
- Criar template de resposta
- Adicionar keywords e patterns de detecção
- Testar com mensagens reais
- Configurar escalação se necessário
- Atualizar knowledge base
```

### 47. Implementar escalação para atendente humano
```
Configure escalação inteligente para humano:
- Detectar necessidade (keywords, sentiment, frustração)
- Criar ticket no sistema
- Notificar atendentes disponíveis
- Transferir contexto da conversa
- SLA por prioridade (emergência < 5min)
- Metrics de taxa de escalação
```

### 48. Adicionar resposta automática para FAQ
```
Configure FAQ automático para [TÓPICO]:
- Adicionar à knowledge base (src/lib/support-knowledge-base.ts)
- Categorizar adequadamente
- Incluir variações de pergunta
- Resposta clara e objetiva
- Links para mais informações
- Tracking de efetividade
```

### 49. Implementar envio de mídia via WhatsApp
```
Adicione suporte a envio de imagens/documentos:
- Upload de mídia para WhatsApp Cloud API
- Suportar tipos: imagem, PDF, vídeo
- Validação de tamanho e tipo
- Compressão automática se necessário
- Fallback para link se mídia grande
- Logging de mídias enviadas
```

### 50. Criar fluxo de confirmação de pedido
```
Implemente confirmação de pedido via WhatsApp:
- Enviar resumo do pedido
- Botões interativos para confirmar/editar
- QR Code PIX se pagamento pendente
- Link para rastreamento após confirmação
- Reminders se não confirmado em 24h
- Integração com sistema de pedidos
```

### 51. Adicionar análise de sentimento
```
Implemente análise de sentimento nas mensagens:
- Usar LangChain + GPT para detectar emoção
- Classificar: positivo, neutro, negativo, frustrado
- Priorizar atendimento para sentimento negativo
- Dashboard de satisfação do cliente
- Alertas para clientes muito insatisfeitos
- Correlação sentimento vs resolução
```

### 52. Criar sistema de tickets integrado
```
Desenvolva gestão de tickets de suporte:
- Model SupportTicket no Prisma
- Auto-criação via WhatsApp
- Status: open, in_progress, resolved, closed
- Atribuição automática por especialização
- SLA tracking (tempo de primeira resposta, resolução)
- UI para atendentes
```

### 53. Implementar chatbot multiidioma
```
Adicione suporte a múltiplos idiomas:
- Detectar idioma da mensagem (LangChain)
- Traduzir automaticamente se necessário
- Manter knowledge base em pt-BR e en-US
- Preferência de idioma por usuário
- Fallback para português
- Metrics por idioma
```

### 54. Adicionar envio de lembretes proativos
```
Configure lembretes automáticos via WhatsApp:
- Pagamento próximo do vencimento (3 dias antes)
- Renovação de prescrição (30 dias antes)
- Feedback após entrega (7 dias após)
- Lente próxima do fim (baseado em uso)
- Opt-out disponível
- Rate limiting (máx 1 msg/dia por usuário)
```

### 55. Implementar analytics de conversação
```
Crie dashboard de analytics do chatbot:
- Volume de mensagens (hora/dia/semana)
- Intentos mais comuns
- Taxa de resolução automática vs escalação
- Tempo médio de resposta
- Satisfação do cliente (CSAT após conversa)
- Trends e padrões de problemas
```

---

## Testes e Qualidade

### 56. Criar testes unitários para função complexa
```
Escreva testes unitários para [FUNÇÃO] em src/[caminho]/__tests__/:
- Happy path (casos normais)
- Edge cases (valores limites, vazios, nulos)
- Error cases (inputs inválidos, exceções)
- Mock de dependências externas
- Coverage de 100% das branches
- Usar Jest + @testing-library se aplicável
```

### 57. Implementar testes de integração API
```
Crie testes de integração para [API_ENDPOINT]:
- Setup de banco de teste (seed data)
- Testar todos métodos HTTP suportados
- Validar status codes e response format
- Testar autenticação e autorização
- Testar rate limiting
- Cleanup após testes
```

### 58. Adicionar testes E2E com Playwright
```
Escreva teste E2E para fluxo [NOME_FLUXO]:
- Simular jornada completa do usuário
- Validar elementos na página
- Testar em múltiplos viewports (mobile, desktop)
- Screenshots em caso de falha
- Retry automático para flakiness
- Organizar em spec file em e2e/
```

### 59. Criar testes de acessibilidade
```
Adicione testes de acessibilidade para [PÁGINA]:
- Usar @axe-core/playwright
- Validar ARIA labels
- Testar navegação por teclado
- Verificar contraste de cores
- Validar ordem de foco
- Gerar relatório de issues
```

### 60. Implementar testes de performance
```
Configure testes de performance para [FUNCIONALIDADE]:
- Usar Lighthouse CI
- Benchmarks para Web Vitals (LCP, FID, CLS)
- Testar com throttling 3G/4G
- Validar bundle size
- Métricas de Time to Interactive
- Falhar CI se regressão > 10%
```

### 61. Adicionar testes de carga
```
Crie testes de carga para [ENDPOINT]:
- Usar k6 ou Artillery
- Simular 100, 500, 1000 usuários concorrentes
- Medir latência (p50, p95, p99)
- Identificar bottlenecks
- Testar rate limiting
- Relatório de capacidade máxima
```

### 62. Implementar testes de regressão visual
```
Configure testes de regressão visual:
- Usar Percy ou Chromatic
- Capturar screenshots de páginas críticas
- Comparar com baseline
- Alertar sobre mudanças não intencionais
- Integrar com PR review
- Suportar múltiplos breakpoints
```

### 63. Criar testes de segurança automatizados
```
Implemente testes de segurança:
- Scan de vulnerabilidades (npm audit)
- Testes de SQL injection
- Testes de XSS
- Validação de CORS
- Verificar headers de segurança
- Integrar com CodeQL
```

### 64. Adicionar testes de contrato API
```
Configure testes de contrato para [API]:
- Usar Pact ou similar
- Validar request/response schemas
- Testar breaking changes
- Versionamento de contratos
- Integrar provider e consumer tests
- CI para validar contratos
```

### 65. Implementar mutation testing
```
Configure mutation testing para [MÓDULO]:
- Usar Stryker para JavaScript/TypeScript
- Identificar testes fracos
- Meta de mutation score > 80%
- Report de mutantes não mortos
- Integrar com CI (opcional)
- Melhorar testes baseado em results
```

---

## Deploy e CI/CD

### 66. Configurar pipeline CI/CD completo
```
Configure pipeline de CI/CD no GitHub Actions:
- Lint (ESLint) em PRs
- Unit tests + coverage report
- Build test (npm run build)
- E2E tests em staging
- Deploy automático para staging após merge
- Deploy manual para produção com aprovação
- Rollback automático se health check falhar
```

### 67. Adicionar deploy preview para PRs
```
Configure deploy preview automático:
- Deploy em Vercel/Netlify preview URL
- Comentar link no PR automaticamente
- Executar smoke tests no preview
- Lighthouse audit no preview
- Expiração automática após merge
- Label de status no PR
```

### 68. Implementar estratégia blue-green deployment
```
Configure blue-green deployment:
- Manter duas versões simultâneas (blue e green)
- Deploy da nova versão em ambiente idle
- Smoke tests na nova versão
- Switch de traffic se testes passarem
- Rollback instantâneo se problema
- Zero downtime deployment
```

### 69. Criar script de rollback automático
```
Implemente rollback automático:
- Monitorar error rate após deploy
- Trigger rollback se error > threshold
- Restaurar versão anterior
- Notificar equipe via Slack/Discord
- Log detalhado do rollback
- Prevent auto-deploy até investigação
```

### 70. Adicionar health checks robustos
```
Implemente health checks em /api/health-check:
- Verificar conectividade banco de dados
- Testar APIs externas críticas (Asaas, WhatsApp)
- Validar secrets/env vars presentes
- Checar filesystem write access
- Response com detalhes por serviço
- Timeout de 5s por check
```

### 71. Configurar monitoramento de deploy
```
Adicione monitoramento de deploys:
- Tracking de versão atual (git SHA)
- Logs de deploy no sistema de monitoring
- Métricas: tempo de deploy, frequência
- Alertas se deploy > 10min
- Dashboard de histórico de deploys
- Correlação de deploys com erros
```

### 72. Implementar canary deployment
```
Configure canary releases:
- Liberar nova versão para 5% do tráfego
- Monitorar métricas: errors, latência, conversão
- Aumentar gradualmente: 5% → 25% → 50% → 100%
- Rollback automático se métricas degradarem
- Duração de cada fase configurável
- Logs detalhados de cada fase
```

### 73. Criar ambiente de staging idêntico
```
Configure ambiente de staging:
- Infraestrutura idêntica à produção
- Dados sintéticos realistas
- Variáveis de ambiente específicas (API sandbox)
- Deploy automático de branch develop
- Acesso restrito (senha ou VPN)
- Cleanup periódico de dados de teste
```

### 74. Adicionar versionamento semântico automático
```
Implemente versionamento automático:
- Usar conventional commits (feat:, fix:, etc)
- Auto-increment version no package.json
- Gerar CHANGELOG.md automaticamente
- Tag git com nova versão
- Release notes no GitHub
- Trigger de deploy baseado em versão
```

### 75. Implementar feature flag deployment
```
Configure deploy com feature flags:
- Deploy código desabilitado (flags off)
- Enable gradualmente em produção
- A/B testing de features
- Kill switch para desabilitar rápido
- Logs de uso de cada feature
- Cleanup de flags antigas após estabilização
```

---

## Monitoramento e Performance

### 76. Configurar alertas de erro em produção
```
Implemente sistema de alertas para [CONTEXTO]:
- Integração com Sentry ou similar
- Threshold: > 10 errors/min = alerta
- Grouping inteligente de erros similares
- Notificação via Slack/email
- Context: user, URL, browser, stack trace
- Auto-resolve quando error rate normalizar
```

### 77. Adicionar APM (Application Performance Monitoring)
```
Configure APM para monitorar performance:
- Instrumentar endpoints críticos
- Tracking de slow queries (> 1s)
- Distributed tracing para requests
- Métricas de throughput e latência
- Dashboard de performance
- Alertas para degradação
```

### 78. Implementar logging estruturado
```
Configure logging estruturado em [MÓDULO]:
- Usar Winston ou Pino
- Níveis: debug, info, warn, error
- Formato JSON para parsing
- Context: requestId, userId, action
- Centralizar logs (CloudWatch, Datadog)
- Retention de 30 dias
```

### 79. Criar dashboard de métricas de negócio
```
Desenvolva dashboard com KPIs:
- Novos usuários (dia/semana/mês)
- Taxa de conversão (visitante → assinante)
- MRR e ARR
- Churn rate
- LTV (Lifetime Value)
- Custo de aquisição (CAC)
- Gráficos de tendência
```

### 80. Adicionar monitoramento de Web Vitals
```
Implemente tracking de Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Reportar para analytics (Google Analytics, Plausible)
- Dashboard de performance real user
- Alertas se métricas piorarem
```

### 81. Implementar profiling de performance
```
Configure profiling para identificar bottlenecks em [FUNCIONALIDADE]:
- React DevTools Profiler para componentes
- Performance API do browser
- Server-side profiling com Node.js profiler
- Identificar funções lentas
- Flame graphs para análise
- Otimizar top 3 bottlenecks
```

### 82. Criar sistema de métricas customizadas
```
Adicione métricas customizadas para [CASO_USO]:
- Definir evento a trackear
- Implementar tracking no código
- Enviar para sistema de analytics
- Dashboard para visualização
- Alertas baseados em thresholds
- Correlação com outras métricas
```

### 83. Adicionar monitoring de third-party APIs
```
Implemente monitoramento de APIs externas:
- Ping periódico de health endpoints
- Tracking de latência de resposta
- Taxa de erro por serviço
- Alertas se serviço down > 2min
- Fallback automático se possível
- Status page público
```

### 84. Implementar synthetic monitoring
```
Configure synthetic monitoring:
- Rodar testes E2E critical paths a cada 5min
- De múltiplas regiões geográficas
- Alertar se teste falhar 2x consecutivo
- Tracking de uptime (SLA 99.9%)
- Ping monitoring de endpoints públicos
- Incident response automático
```

### 85. Criar relatório de capacidade do sistema
```
Gere relatório de capacidade mensal:
- Uso de recursos (CPU, RAM, Disco)
- Throughput atual vs máximo testado
- Crescimento de usuários e requests
- Projeção de necessidade futura
- Recomendações de scaling
- Custos de infraestrutura
```

---

## Segurança e Compliance

### 86. Realizar auditoria de segurança completa
```
Execute auditoria de segurança em [MÓDULO]:
- Scan de vulnerabilidades (npm audit, Snyk)
- Revisar dependências desatualizadas
- Verificar exposição de secrets
- Testar inputs para injection
- Validar CORS e CSP headers
- Gerar relatório de findings
```

### 87. Implementar rate limiting por IP
```
Configure rate limiting robusto:
- Por IP: 100 requests/min em endpoints públicos
- Por usuário autenticado: 1000 requests/min
- Endpoints sensíveis: 10 requests/min
- Response 429 com Retry-After header
- Whitelist de IPs confiáveis
- Logs de abuse attempts
```

### 88. Adicionar CSRF protection
```
Implemente proteção CSRF:
- Gerar CSRF token único por sessão
- Validar token em requests mutantes (POST, PUT, DELETE)
- Token em meta tag ou cookie
- Regenerar após login/logout
- Reject requests sem token válido
- Logging de tentativas inválidas
```

### 89. Configurar Content Security Policy
```
Configure CSP headers restritivos:
- default-src 'self'
- script-src 'self' com nonces para inline
- style-src 'self' 'unsafe-inline' (necessário para Tailwind)
- img-src 'self' data: https:
- connect-src 'self' [APIs externas]
- Report-only mode para testar
- Migrar para enforce após validação
```

### 90. Implementar compliance LGPD
```
Garanta compliance LGPD em [FUNCIONALIDADE]:
- Consentimento explícito para cookies
- Opção de exportar dados pessoais
- Direito ao esquecimento (soft delete)
- Anonimização de dados sensíveis
- Logs de acesso a dados pessoais
- Política de privacidade atualizada
- DPO designado (Data Protection Officer)
```

### 91. Adicionar sanitização de inputs
```
Implemente sanitização em [FORMULÁRIO]:
- Remover tags HTML (prevenir XSS)
- Escape de caracteres especiais
- Validar formato (email, CPF, telefone)
- Limitar tamanho de strings
- Whitelist de caracteres permitidos
- Server-side + client-side validation
```

### 92. Configurar autenticação de dois fatores
```
Implemente 2FA opcional para usuários:
- Suporte a TOTP (Google Authenticator, Authy)
- QR Code para setup inicial
- Backup codes para emergência
- Obrigatório para admins
- Logging de eventos 2FA
- Recovery flow se perder acesso
```

### 93. Implementar auditoria de acessos
```
Crie audit log de acessos sensíveis:
- Capturar: quem, quando, o quê, de onde (IP)
- Logar acessos a dados de clientes
- Logar mudanças em configurações críticas
- Retenção de 1 ano
- UI para consultar audit logs
- Alertas para atividades suspeitas
```

### 94. Adicionar validação de arquivos uploaded
```
Implemente validação segura de uploads:
- Verificar MIME type real (não confiar em extensão)
- Scan de malware (ClamAV ou serviço)
- Limitar tamanho (max 10MB)
- Renomear arquivo (evitar path traversal)
- Servir de domínio separado (CDN)
- Validar dimensões de imagens
```

### 95. Configurar secrets management
```
Implemente gestão segura de secrets:
- Usar AWS Secrets Manager, HashiCorp Vault, ou similar
- Nunca commitar secrets no git
- Rotação automática de secrets críticos
- Acesso restrito por ambiente
- Audit log de acessos a secrets
- Secrets injetados em runtime (env vars)
```

---

## Documentação e Manutenção

### 96. Atualizar documentação técnica
```
Atualize documentação para [FEATURE_RECENTE]:
- Adicionar em README.md ou doc específico
- Incluir código de exemplo
- Diagrama de arquitetura se complexo
- Prerequisites e dependências
- Troubleshooting de problemas comuns
- Links para recursos relacionados
```

### 97. Criar guia de onboarding para desenvolvedores
```
Escreva guia de onboarding completo:
- Setup local (Node, dependências, env vars)
- Estrutura do projeto (diretórios, convenções)
- Como rodar testes e lint
- Fluxo de desenvolvimento (branch, PR, review)
- Links para ferramentas (Figma, Asaas dashboard)
- Contatos da equipe
```

### 98. Adicionar ADR (Architecture Decision Record)
```
Documente decisão arquitetural sobre [DECISÃO]:
- Contexto: qual problema estamos resolvendo
- Opções consideradas (pros/cons de cada)
- Decisão tomada e justificativa
- Consequências (positivas e negativas)
- Data e participantes da decisão
- Salvar em docs/adr/[número]-[título].md
```

### 99. Criar runbook de incidentes
```
Escreva runbook para cenário [TIPO_INCIDENTE]:
- Sintomas: como identificar o problema
- Severidade e SLA de resposta
- Passos de diagnóstico
- Playbook de resolução passo a passo
- Rollback procedures se aplicável
- Escalation path se não resolver
- Postmortem template
```

### 100. Implementar changelog automático
```
Configure geração automática de CHANGELOG:
- Usar conventional commits (feat:, fix:, etc)
- Auto-gerar em cada release
- Categorizar por tipo de mudança
- Links para PRs e issues relacionados
- Highlighting de breaking changes
- Publicar changelog no GitHub Releases
```

---

## 🎯 Como Usar Este Documento

### Para Desenvolvimento Diário
Utilize os prompts como templates ao criar novas funcionalidades. Basta copiar o prompt relevante e substituir os placeholders `[NOME]`, `[CONTEXTO]`, etc.

### Para Planejamento de Sprint
Revise os prompts das categorias relevantes ao planejar trabalho. Use como checklist de requisitos técnicos.

### Para Code Review
Verifique se as implementações seguem as diretrizes dos prompts (padrões, testes, segurança).

### Para Onboarding
Novos desenvolvedores podem usar este documento para entender padrões e práticas do projeto.

---

## 📚 Recursos Adicionais

- **[AGENTS.md](AGENTS.md)** - Guia rápido para agentes de IA
- **[README.md](README.md)** - Visão geral do projeto
- **[SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)** - Documentação técnica completa
- **[OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md)** - Guia operacional

---

**Última atualização**: 2025-10-19  
**Versão**: 1.0.0  
**Mantido por**: Equipe SVLentes
