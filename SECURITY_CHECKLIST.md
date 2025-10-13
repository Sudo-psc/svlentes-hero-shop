# 🔒 Checklist de Segurança - SV Lentes

**Versão:** 1.0  
**Data:** 2025-10-13  
**Próxima Revisão:** 2025-11-13

---

## 📋 Uso deste Checklist

Este checklist deve ser usado:
- ✅ Antes de cada deploy para produção
- ✅ Mensalmente como auditoria de rotina
- ✅ Após adicionar novas funcionalidades
- ✅ Após atualizar dependências críticas

**Como usar:**
1. Marque cada item como concluído
2. Investigue e corrija itens não marcados
3. Documente qualquer exceção ou problema encontrado
4. Assine e date ao final

---

## 🔐 1. Autenticação e Autorização

### 1.1 Gerenciamento de Sessões
- [ ] Sessions têm timeout adequado (24h máximo)
- [ ] Tokens de sessão são armazenados de forma segura (httpOnly, secure)
- [ ] Logout invalida a sessão no servidor
- [ ] Não há exposição de tokens em URLs

### 1.2 Autenticação de APIs
- [ ] Todas as APIs privadas requerem autenticação
- [ ] Tokens de API não estão hardcoded no código
- [ ] Webhooks validam assinaturas/tokens
- [ ] Rate limiting implementado para endpoints de autenticação

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🛡️ 2. Proteção de Dados

### 2.1 Dados Sensíveis
- [ ] Senhas são hasheadas (bcrypt, argon2)
- [ ] Dados sensíveis não aparecem em logs
- [ ] PII (CPF, email, telefone) são mascarados em logs
- [ ] Dados de pagamento nunca são armazenados (usar tokens)

### 2.2 Criptografia
- [ ] HTTPS habilitado (TLS 1.2+)
- [ ] HSTS configurado (Strict-Transport-Security)
- [ ] Dados em repouso são criptografados (se aplicável)
- [ ] Comunicação com APIs externas usa HTTPS

### 2.3 LGPD Compliance
- [ ] Política de privacidade atualizada
- [ ] Banner de consentimento de cookies funcional
- [ ] API de solicitação de dados implementada
- [ ] Processo de exclusão de dados documentado
- [ ] Data retention policy definida (90 dias)

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🚪 3. Controle de Acesso

### 3.1 APIs Públicas
- [ ] Rate limiting implementado (10 req/min)
- [ ] Validação de entrada implementada (Zod)
- [ ] Sanitização de dados aplicada
- [ ] Respostas de erro não expõem detalhes internos

### 3.2 Webhooks
- [ ] Validação de assinatura implementada (Stripe)
- [ ] IP whitelist configurado (Asaas)
- [ ] Token de autenticação configurado
- [ ] Validação de timestamp (prevenir replay attacks)

### 3.3 CORS
- [ ] CORS configurado com whitelist de origens
- [ ] Credentials permitidos apenas para origens confiáveis
- [ ] Preflight requests tratados corretamente

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🔍 4. Validação de Entrada

### 4.1 Formulários
- [ ] Todos os campos têm validação client-side (React Hook Form)
- [ ] Todos os campos têm validação server-side (Zod)
- [ ] Validação de tipos de dados (email, telefone, CPF)
- [ ] Sanitização de strings (remover HTML, scripts)

### 4.2 Upload de Arquivos
- [ ] Validação de tipo MIME
- [ ] Validação de magic bytes (prevenir spoofing)
- [ ] Limite de tamanho (5MB para prescrições)
- [ ] Scan de malware (se aplicável)
- [ ] Armazenamento seguro (CDN, não filesystem local)

### 4.3 URLs e Parâmetros
- [ ] Validação de query parameters
- [ ] Sanitização de path parameters
- [ ] Proteção contra path traversal
- [ ] Validação de redirect URLs

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🌐 5. Segurança de Aplicação Web

### 5.1 Headers de Segurança
- [ ] Content-Security-Policy configurado
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY ou SAMEORIGIN
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy configurado

### 5.2 CSP (Content Security Policy)
- [ ] script-src não inclui 'unsafe-inline' (ou usa nonces)
- [ ] script-src não inclui 'unsafe-eval' (se possível)
- [ ] Apenas domínios confiáveis na whitelist
- [ ] CSP reporta violações (se em produção)

### 5.3 Proteção XSS
- [ ] Uso de React (escape automático)
- [ ] dangerouslySetInnerHTML evitado ou sanitizado
- [ ] Validação e sanitização de user input
- [ ] CSP implementado como camada adicional

### 5.4 Proteção CSRF
- [ ] CSRF tokens implementados em formulários
- [ ] SameSite cookies configurados
- [ ] Validação de origem em requisições state-changing

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🔗 6. APIs e Integrações

### 6.1 APIs de Terceiros
- [ ] Stripe: webhook signature validada
- [ ] Asaas: IP whitelist + token validados
- [ ] Timeouts configurados (10s)
- [ ] Tratamento de erros implementado
- [ ] Retry com backoff exponencial

### 6.2 Secrets Management
- [ ] Secrets não estão no código
- [ ] Secrets estão em variáveis de ambiente
- [ ] .env* está no .gitignore
- [ ] Secrets de produção diferentes de desenvolvimento

### 6.3 Rate Limiting
- [ ] Implementado para APIs públicas
- [ ] Configurado por tipo de endpoint
- [ ] Headers de rate limit retornados
- [ ] Retry-After header em 429 responses

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 📊 7. Logging e Monitoramento

### 7.1 Logging Seguro
- [ ] Dados sensíveis mascarados em logs
- [ ] SecurityLogger usado ao invés de console.log
- [ ] Logs de erro capturam stack traces
- [ ] Logs incluem context IDs para rastreamento

### 7.2 Monitoramento
- [ ] Sentry configurado para error tracking
- [ ] Alertas configurados para erros críticos
- [ ] Health checks implementados
- [ ] Uptime monitoring ativo

### 7.3 Auditoria
- [ ] Logs de acesso a dados sensíveis
- [ ] Logs de tentativas de acesso não autorizado
- [ ] Logs de mudanças em dados críticos
- [ ] Retenção de logs por período adequado

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 📦 8. Dependências e Build

### 8.1 NPM Packages
- [ ] npm audit executado (0 vulnerabilidades)
- [ ] Dependências atualizadas regularmente
- [ ] Dependências desnecessárias removidas
- [ ] Lock file (package-lock.json) commitado

### 8.2 Build e Deploy
- [ ] TypeScript strict mode habilitado
- [ ] ESLint sem erros críticos
- [ ] Build de produção testado
- [ ] Source maps não expostos em produção

### 8.3 Next.js Específico
- [ ] Image optimization habilitada
- [ ] poweredByHeader: false
- [ ] typescript.ignoreBuildErrors: false
- [ ] eslint.ignoreDuringBuilds: false

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🚀 9. Infraestrutura e Deploy

### 9.1 Ambiente de Produção
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Domínio com SSL/TLS válido
- [ ] CDN habilitado (Vercel Edge Network)
- [ ] Cache headers otimizados

### 9.2 Backup e Recovery
- [ ] Banco de dados tem backup automático
- [ ] Processo de restore testado
- [ ] RPO (Recovery Point Objective) definido
- [ ] RTO (Recovery Time Objective) definido

### 9.3 CI/CD
- [ ] Tests executados antes de deploy
- [ ] Linting executado antes de deploy
- [ ] Security checks automatizados
- [ ] Rollback process documentado

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 📱 10. Frontend Security

### 10.1 Client-Side
- [ ] Validação client-side não é única linha de defesa
- [ ] localStorage não armazena dados sensíveis
- [ ] Tokens armazenados em httpOnly cookies
- [ ] console.log removido em produção

### 10.2 Forms
- [ ] Auto-complete apropriado (autocomplete="off" para senhas)
- [ ] Input type correto (email, tel, number)
- [ ] Validação visual para usuário
- [ ] Feedback de erro claro

### 10.3 Performance
- [ ] Lazy loading implementado
- [ ] Code splitting ativo
- [ ] Images otimizadas
- [ ] Bundle size < 200KB (initial load)

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🧪 11. Testing

### 11.1 Security Testing
- [ ] OWASP ZAP scan executado
- [ ] Penetration testing realizado (anual)
- [ ] Vulnerability scan realizado
- [ ] Authentication bypass testado

### 11.2 Automated Testing
- [ ] Unit tests > 70% cobertura
- [ ] Integration tests para APIs críticas
- [ ] E2E tests para fluxos principais
- [ ] Security regression tests

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 📚 12. Documentação

### 12.1 Documentação de Segurança
- [ ] Política de segurança documentada
- [ ] Processo de resposta a incidentes definido
- [ ] Contatos de segurança atualizados
- [ ] Guia de boas práticas para desenvolvedores

### 12.2 APIs
- [ ] Endpoints documentados (OpenAPI/Swagger)
- [ ] Rate limits documentados
- [ ] Exemplos de autenticação fornecidos
- [ ] Códigos de erro documentados

**Notas:**
```
_____________________________________________________________
_____________________________________________________________
```

---

## 🎯 Resumo de Conformidade

### Pontuação por Categoria
- [ ] 1. Autenticação: ___/10
- [ ] 2. Proteção de Dados: ___/15
- [ ] 3. Controle de Acesso: ___/10
- [ ] 4. Validação de Entrada: ___/12
- [ ] 5. Segurança Web: ___/15
- [ ] 6. APIs: ___/12
- [ ] 7. Logging: ___/10
- [ ] 8. Dependências: ___/10
- [ ] 9. Infraestrutura: ___/10
- [ ] 10. Frontend: ___/10
- [ ] 11. Testing: ___/8
- [ ] 12. Documentação: ___/8

**Pontuação Total: ___/130**

### Classificação
- **120-130:** ✅ Excelente - Produção pronta
- **100-119:** 🟡 Bom - Melhorias recomendadas
- **80-99:** ⚠️ Adequado - Melhorias necessárias
- **< 80:** 🔴 Inadequado - Não deploy em produção

---

## ✍️ Assinatura

**Revisado por:**
```
Nome: _________________________  Data: ___/___/______

Cargo: ________________________  Assinatura: _______________
```

**Aprovado por:**
```
Nome: _________________________  Data: ___/___/______

Cargo: ________________________  Assinatura: _______________
```

---

## 📝 Problemas Identificados

| # | Descrição | Severidade | Status | Responsável | Prazo |
|---|-----------|------------|--------|-------------|-------|
| 1 |           |            |        |             |       |
| 2 |           |            |        |             |       |
| 3 |           |            |        |             |       |
| 4 |           |            |        |             |       |
| 5 |           |            |        |             |       |

**Severidade:** 🔴 Crítica | 🟡 Alta | 🟢 Média | 🔵 Baixa

---

## 📅 Histórico de Revisões

| Data | Versão | Pontuação | Revisor | Notas |
|------|--------|-----------|---------|-------|
| 2025-10-13 | 1.0 | - | Sistema | Checklist inicial criado |
|  |  |  |  |  |
|  |  |  |  |  |

---

**Próxima Revisão Agendada:** 2025-11-13  
**Frequência de Revisão:** Mensal
