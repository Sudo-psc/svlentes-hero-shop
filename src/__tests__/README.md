# Sistema de Testes de Resiliência

Este diretório contém o conjunto completo de testes para validar o sistema de resiliência implementado na área do assinante da SV Lentes.

## 📋 Estrutura dos Testes

```
src/__tests__/
├── lib/                           # Testes unitários das bibliotecas principais
│   ├── resilient-data-fetcher.test.ts
│   ├── offline-storage.test.ts
│   └── backup-auth.test.ts
├── hooks/                         # Testes dos hooks React
│   └── useResilientSubscription.test.ts
├── integration/                   # Testes de integração E2E
│   └── resilience-system.e2e.test.ts
├── mocks/                         # Mocks e servidores simulados
│   └── server.ts
├── utils/                         # Utilitários de teste
│   └── test-helpers.tsx
├── e2e/                          # Testes E2E do Playwright
├── setup.ts                      # Configuração global de testes
└── README.md                     # Este arquivo
```

## 🎯 Tipos de Testes

### 1. Testes Unitários (Vitest + React Testing Library)

#### ResilientDataFetcher (`lib/resilient-data-fetcher.test.ts`)
- ✅ Circuit Breaker Pattern
- ✅ Retry Logic com Exponential Backoff
- ✅ Cache System com TTL
- ✅ Request Deduplication
- ✅ Fallback Strategies
- ✅ Health Monitoring
- ✅ Performance Metrics

#### OfflineStorage (`lib/offline-storage.test.ts`)
- ✅ IndexedDB com localStorage fallback
- ✅ Sincronização de dados
- ✅ Validação com Zod schemas
- ✅ Gerenciamento de expiração
- ✅ Performance metrics
- ✅ Error handling

#### BackupAuth (`lib/backup-auth.test.ts`)
- ✅ Firebase Authentication
- ✅ Phone verification (WhatsApp)
- ✅ Email verification
- ✅ Token-based authentication
- ✅ Credentials management
- ✅ Security validation

#### useResilientSubscription Hook (`hooks/useResilientSubscription.test.ts`)
- ✅ Initial load com cache
- ✅ Real-time updates
- ✅ Offline mode
- ✅ Synchronization
- ✅ Error recovery
- ✅ Performance metrics

### 2. Testes de Integração (Playwright)

#### Resilience System E2E (`integration/resilience-system.e2e.test.ts`)
- ✅ Carregamento normal da dashboard
- ✅ Uso de cache quando API falha
- ✅ Múltiplos fallbacks
- ✅ Modo offline e sincronização
- ✅ Sistema de autenticação backup
- ✅ Monitoramento de saúde em tempo real
- ✅ Métricas de performance detalhadas
- ✅ Sincronização entre múltiplas abas
- ✅ Performance sob alta carga
- ✅ Recuperação de falhas completas
- ✅ Validação de segurança offline
- ✅ Cenários de borda (desconexões, falhas em cascata)

## 🚀 Como Executar os Testes

### Testes Unitários e de Integração

```bash
# Executar todos os testes de resiliência
npm run test:resilience

# Executar em modo watch
npm run test:watch src/__tests__/lib/

# Executar com coverage
npm run test:coverage

# Executar interface gráfica
npm run test:ui

# Executar testes específicos
npm run test:resilience -- --run src/__tests__/lib/resilient-data-fetcher.test.ts
```

### Testes E2E

```bash
# Executar testes E2E de resiliência
npm run test:e2e:resilience

# Executar com interface gráfica
npm run test:e2e:ui

# Executar em modo headed (com browser visível)
npm run test:e2e:headed

# Executar em modo debug
npm run test:e2e:debug

# Executar todos os testes (unitários + E2E)
npm run test:all
```

## 📊 Cenários de Teste Cobertos

### Conectividade
- ✅ Online → Offline → Online
- ✅ Conexão lenta (2G/3G)
- ✅ Conexão instável
- ✅ Timeouts de requisição
- ✅ Falhas parciais de API

### Storage
- ✅ IndexedDB disponível/indisponível
- ✅ LocalStorage cheio
- ✅ Dados corrompidos
- ✅ Quota exceeded
- ✅ Sincronização entre abas

### Autenticação
- ✅ Firebase principal
- ✅ Phone/SMS backup
- ✅ Email backup
- ✅ Token de emergência
- ✅ Credenciais expiradas

### Performance
- ✅ Alta carga de requisições
- ✅ Memória limitada
- ✅ Device lento
- ✅ Múltiplas atualizações
- ✅ Cache optimization

### Erros e Recuperação
- ✅ API completamente indisponível
- ✅ Erros em cascata
- ✅ Circuit breaker activation
- ✅ Graceful degradation
- ✅ Recovery automation

## 🔧 Configuração dos Testes

### Vitest Configuration (`vitest.config.ts`)
- Ambiente: jsdom
- Coverage: >80% global, >90% para componentes críticos
- Timeout: 30s para hooks, 15s para testes
- Mocks automáticos para APIs do browser

### Playwright Configuration (`playwright.config.resilience.ts`)
- Múltiplos navegadores (Chrome, Firefox, Safari)
- Dispositivos móveis
- Cenários específicos: offline, slow-network, low-memory
- Report detalhado com HTML e JSON
- Video e screenshots em falhas

## 🎨 Mocks e Fixtures

### Mock Server (`mocks/server.ts`)
```typescript
// Simular diferentes condições de API
mockAPIScenario('success')    // API funcional
mockAPIScenario('error')      // API com erro
mockAPIScenario('timeout')    // API lenta
mockAPIScenario('intermittent') // Falhas intermitentes
```

### Test Helpers (`utils/test-helpers.tsx`)
```typescript
// Simular diferentes condições
mockNetworkScenario('offline')  // Modo offline
mockStorageScenario('full')     // Storage cheio
mockPerformanceConditions('lowMemory') // Pouca memória
```

## 📈 Métricas e Cobertura

### Thresholds de Coverage
- **Global**: 80% (branches, functions, lines, statements)
- **Componentes Críticos**: 90%
  - `resilient-data-fetcher.ts`
  - `offline-storage.ts`
  - `backup-auth.ts`
  - `useResilientSubscription.ts`

### Tipos de Teste
- **Unitários**: 70% dos testes (lógica de negócio isolada)
- **Integração**: 20% dos testes (interação entre componentes)
- **E2E**: 10% dos testes (fluxos completos do usuário)

## 🐛 Debug e Troubleshooting

### Logs Detalhados
Os testes incluem logs detalhados para facilitar debug:
```typescript
// Ativar logs de debug
process.env.DEBUG_TESTS = 'true'
```

### Screenshots em Falhas
Testes E2E geram screenshots automaticamente em falhas:
- Localização: `playwright-report/`
- Formato: PNG com timestamp
- Inclui estado da página no momento da falha

### Videos de Teste
Testes E2E gravam vídeos da execução:
- Útil para analisar comportamentos complexos
- Armazenado em `playwright-report/video/`
- Disponível para testes que falham

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# Executar testes em Pull Requests
- name: Run Resilience Tests
  run: npm run test:all

# Gerar relatórios de coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
{
  "pre-commit": "npm run test:resilience",
  "pre-push": "npm run test:all"
}
```

## 📝 Boas Práticas

### 1. Estrutura de Testes
- **AAA Pattern**: Arrange, Act, Assert
- **Test Isolation**: Cada teste independente
- **Descriptive Names**: Nomes que descrevem o comportamento

### 2. Mocks
- **Realistic Data**: Dados que simulam ambiente real
- **Edge Cases**: Incluir cenários limite
- **Cleanup**: Limpar mocks após cada teste

### 3. Asserções
- **Specific Assertions**: Verificar comportamentos específicos
- **Error Messages**: Mensagens claras em falhas
- **Timeouts**: Apropriados para cada tipo de teste

### 4. Performance
- **Efficient Tests**: Testes rápidos o suficiente
- **Parallel Execution**: Quando possível
- **Resource Cleanup**: Limpar recursos após testes

## 🚀 Próximos Passos

### Melhorias Futuras
1. **Visual Testing**: Testes visuais com Applitools
2. **Load Testing**: Testes de carga com Artillery
3. **Chaos Engineering**: Injeção controlada de falhas
4. **Cross-browser Testing**: Mais variedade de browsers
5. **Mobile Testing**: Mais dispositivos móveis

### Monitoramento Contínuo
1. **Test Performance**: Monitorar tempo de execução
2. **Flaky Tests Detection**: Identificar testes instáveis
3. **Coverage Trends**: Acompanhar evolução da coverage
4. **Failure Analysis**: Análise de padrões de falha

## 📞 Suporte

Para dúvidas ou problemas com os testes:

1. **Verificar logs**: Logs detalhados estão disponíveis
2. **Debug mode**: Usar `--debug` para testes E2E
3. **Isolation**: Executar testes individualmente
4. **Documentation**: Consultar documentação de Vitest e Playwright

---

**Nota**: Este sistema de testes foi projetado para garantir a robustez e confiabilidade do sistema de resiliência, cobrindo todos os cenários críticos que podem afetar a experiência do usuário na área do assinante da SV Lentes.