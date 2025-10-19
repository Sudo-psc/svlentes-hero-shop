# Exemplo Prático do Sistema de Versionamento

Este documento mostra exemplos reais de como o sistema de versionamento automático funciona na prática.

## 📝 Cenário 1: Adicionando uma Nova Feature

### Passo 1: Desenvolver a Feature

```bash
# Criar branch para feature
git checkout -b feature/calculator-improvements

# Fazer mudanças no código
# ... editar arquivos ...
```

### Passo 2: Fazer Commit Usando Commitizen

```bash
npm run commit

# Output interativo:
? Select the type of change that you're committing: 
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect the meaning of the code
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
  test:     Adding missing tests or correcting existing tests

# Selecione: feat

? What is the scope of this change (e.g. component or file name): 
calculator

? Write a short, imperative tense description of the change:
adiciona modo de comparação de preços entre planos

? Provide a longer description of the change: (press enter to skip)
Permite ao usuário comparar visualmente os custos entre diferentes planos de assinatura

? Are there any breaking changes? (y/N)
N

? Does this change affect any open issues? (y/N)
y

? Add issue references (e.g. "fix #123", "re #123".):
closes #45
```

**Resultado:**
```
feat(calculator): adiciona modo de comparação de preços entre planos

Permite ao usuário comparar visualmente os custos entre diferentes planos de assinatura

closes #45
```

### Passo 3: Push e Criar PR

```bash
git push origin feature/calculator-improvements

# Criar PR via GitHub UI ou CLI
gh pr create --title "feat: adiciona modo de comparação de preços" --body "..."
```

### Passo 4: Merge para Main

Após aprovação, merge para `main`:

```bash
# Via GitHub UI: Click "Merge pull request"
# Ou via CLI:
gh pr merge 45 --squash
```

### Passo 5: Release Automática

**O que acontece automaticamente:**

1. **CI Tests** executam (2-3 minutos)
   ```
   ✅ Lint passou
   ✅ Testes unitários passaram
   ✅ Testes E2E passaram
   ✅ Build passou
   ```

2. **Semantic Release analisa commits** (30 segundos)
   ```
   Analyzing commits since last release...
   Found: 1 feat commit
   Decision: MINOR version bump
   Current: 0.1.0 → Next: 0.2.0
   ```

3. **Atualiza arquivos** (10 segundos)
   ```
   ✅ package.json: "version": "0.2.0"
   ✅ CHANGELOG.md: Updated with new section
   ✅ Git commit: "chore(release): 0.2.0 [skip ci]"
   ✅ Git tag: v0.2.0
   ```

4. **Publica GitHub Release** (20 segundos)
   ```
   📦 Release v0.2.0 created
   📋 Release notes generated
   🔗 https://github.com/Sudo-psc/svlentes-hero-shop/releases/tag/v0.2.0
   ```

5. **Trigger Deploy** (5-10 minutos)
   ```
   🚀 Deployment to production started
   ⏳ Running health checks
   ✅ Deployment successful
   🌐 Live at: https://svlentes.shop
   ```

6. **Notificações** (5 segundos)
   ```
   📬 Slack: "🎉 New version v0.2.0 released!"
   📬 Webhook: POST to N8N with release data
   ```

**CHANGELOG.md gerado:**

```markdown
## [0.2.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v0.1.0...v0.2.0) (2025-10-19)

### 🚀 Features

* **calculator:** adiciona modo de comparação de preços entre planos ([abc123](https://github.com/Sudo-psc/svlentes-hero-shop/commit/abc123)), closes [#45](https://github.com/Sudo-psc/svlentes-hero-shop/issues/45)
```

---

## 🐛 Cenário 2: Corrigindo um Bug

### Commit

```bash
git checkout -b fix/form-validation

# Fazer correção
# ... editar arquivos ...

git add .
git commit -m "fix: corrige validação de email no formulário de lead

O regex anterior não aceitava emails com subdomain.
Agora usa padrão RFC 5322 compliant.

Closes #52"
```

### Resultado da Release

```
Current: 0.2.0 → Next: 0.2.1 (PATCH bump)
```

**CHANGELOG.md:**

```markdown
## [0.2.1](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v0.2.0...v0.2.1) (2025-10-19)

### 🐛 Bug Fixes

* corrige validação de email no formulário de lead ([def456](https://github.com/Sudo-psc/svlentes-hero-shop/commit/def456)), closes [#52](https://github.com/Sudo-psc/svlentes-hero-shop/issues/52)
```

---

## 💥 Cenário 3: Breaking Change

### Commit

```bash
git commit -m "feat!: migra para nova estrutura de API

BREAKING CHANGE: Remove todos os endpoints /api/v1/*.
Use /api/v2/* em seu lugar.

Migration guide:
- /api/v1/user → /api/v2/users
- /api/v1/subscription → /api/v2/subscriptions

Closes #78"
```

### Resultado da Release

```
Current: 0.2.1 → Next: 1.0.0 (MAJOR bump)
```

**CHANGELOG.md:**

```markdown
## [1.0.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v0.2.1...v1.0.0) (2025-10-19)

### ⚠ BREAKING CHANGES

* Remove todos os endpoints /api/v1/*. Use /api/v2/* em seu lugar.

### 🚀 Features

* migra para nova estrutura de API ([ghi789](https://github.com/Sudo-psc/svlentes-hero-shop/commit/ghi789)), closes [#78](https://github.com/Sudo-psc/svlentes-hero-shop/issues/78)
```

**GitHub Release Notes incluirá:**

```markdown
## ⚠️ Breaking Changes

This release contains breaking changes. Please review the migration guide below.

### API Structure Change

**Changed:** API endpoints structure
**Migration:** Update all API calls from `/api/v1/*` to `/api/v2/*`

See full details in the [Migration Guide](../MIGRATION.md).
```

---

## 🔄 Cenário 4: Múltiplos Commits

### Commits em uma sprint

```bash
# Commit 1
git commit -m "feat: adiciona filtro de busca na lista de produtos"

# Commit 2
git commit -m "fix: corrige overflow em mobile na calculadora"

# Commit 3
git commit -m "perf: otimiza carregamento de imagens com lazy loading"

# Commit 4
git commit -m "docs: atualiza README com instruções de deploy"

# Commit 5
git commit -m "test: adiciona testes para componente de checkout"
```

### Resultado da Release

```
Analysis:
- 1 feat → MINOR bump
- 1 fix → PATCH bump (overridden by MINOR)
- 1 perf → PATCH bump (overridden by MINOR)
- 1 docs → No bump
- 1 test → No bump

Decision: MINOR bump
Current: 1.0.0 → Next: 1.1.0
```

**CHANGELOG.md:**

```markdown
## [1.1.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v1.0.0...v1.1.0) (2025-10-19)

### 🚀 Features

* adiciona filtro de busca na lista de produtos ([abc123](https://github.com/Sudo-psc/svlentes-hero-shop/commit/abc123))

### 🐛 Bug Fixes

* corrige overflow em mobile na calculadora ([def456](https://github.com/Sudo-psc/svlentes-hero-shop/commit/def456))

### ⚡ Performance Improvements

* otimiza carregamento de imagens com lazy loading ([ghi789](https://github.com/Sudo-psc/svlentes-hero-shop/commit/ghi789))
```

---

## 🌿 Cenário 5: Release em Branch Develop (Beta)

### Commit para develop

```bash
git checkout develop
git merge feature/new-dashboard

# Push para develop
git push origin develop
```

### Resultado da Release

```
Branch: develop
Release type: prerelease
Current: 1.1.0 → Next: 1.2.0-beta.1
```

**Tag criada:** `v1.2.0-beta.1`

**GitHub Release marcada como:** `Pre-release`

### Segundo commit no develop

```bash
git commit -m "fix: corrige bug no novo dashboard"
git push origin develop
```

**Resultado:** `1.2.0-beta.2`

### Merge para main

```bash
git checkout main
git merge develop
git push origin main
```

**Resultado:** `1.2.0` (versão estável, sem `-beta`)

---

## 📊 Cenário 6: Hotfix em Produção

### Situação

```
Production: v1.2.0
Bug crítico descoberto
```

### Processo

```bash
# Criar branch de hotfix
git checkout -b hotfix/critical-payment-bug main

# Corrigir
git commit -m "fix: corrige erro crítico no processamento de pagamentos

Erro causava falha em transações PIX.
Validação de timeout estava incorreta.

CRITICAL: Affects all PIX payments
Closes #99"

# Merge direto para main
git checkout main
git merge hotfix/critical-payment-bug
git push origin main
```

### Resultado

```
Current: 1.2.0 → Next: 1.2.1
Priority: HIGH (hotfix)
Deploy: Immediate
```

**Timeline:**
```
13:45 - Bug reportado
13:50 - Fix commitado
13:52 - Merged to main
13:53 - Release v1.2.1 criada
13:54 - Deploy iniciado
13:59 - Deploy concluído
14:00 - Notificação enviada
```

---

## 🎯 Cenário 7: Release Candidate (Staging)

### Branch staging

```bash
git checkout -b staging develop
git push origin staging
```

### Release

```
Branch: staging
Release type: prerelease (rc)
Version: 1.3.0-rc.1
Environment: Staging
```

### Testes em staging

```bash
# Encontrou bug
git commit -m "fix: corrige problema em staging"
git push origin staging

# Nova release: 1.3.0-rc.2
```

### Aprovado, merge para main

```bash
git checkout main
git merge staging
git push origin main

# Release: 1.3.0 (production)
```

---

## 📈 Evolução de Versão - História Completa

```
v0.1.0 - Initial release
  ↓ feat: nova feature
v0.2.0 - Feature addition
  ↓ fix: bug fix
v0.2.1 - Bug fix
  ↓ feat: multiple features
v0.3.0 - Feature additions
  ↓ feat!: breaking change
v1.0.0 - Major release
  ↓ feat: new dashboard
v1.1.0 - Feature addition
  ↓ fix: hotfix
v1.2.0 - Feature release
  ↓ fix: critical fix
v1.2.1 - Hotfix
  ↓ feat: major feature
v1.3.0 - Feature release
  ↓ refactor + perf
v1.3.1 - Improvements
```

---

## 🎨 Formato Visual do CHANGELOG Completo

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v1.3.0...v1.3.1) (2025-10-20)

### ⚡ Performance Improvements

* otimiza queries do banco de dados ([abc123](https://github.com/.../commit/abc123))

### ♻️ Code Refactoring

* simplifica lógica de validação ([def456](https://github.com/.../commit/def456))

## [1.3.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v1.2.1...v1.3.0) (2025-10-19)

### 🚀 Features

* adiciona painel de analytics ([ghi789](https://github.com/.../commit/ghi789))
* integra com SendPulse ([jkl012](https://github.com/.../commit/jkl012))

## [1.2.1](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v1.2.0...v1.2.1) (2025-10-19)

### 🐛 Bug Fixes

* **payments:** corrige erro crítico no processamento PIX ([mno345](https://github.com/.../commit/mno345)), closes [#99](https://github.com/.../issues/99)

## [1.2.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v1.1.0...v1.2.0) (2025-10-18)

### 🚀 Features

* adiciona novo dashboard ([pqr678](https://github.com/.../commit/pqr678))

### 🐛 Bug Fixes

* corrige layout mobile ([stu901](https://github.com/.../commit/stu901))
```

---

## 💡 Dicas e Boas Práticas

### ✅ Bons Commits

```bash
✅ feat: adiciona filtro de busca na página de produtos
✅ fix: corrige validação de CPF no formulário
✅ perf: otimiza carregamento de imagens
✅ refactor: simplifica lógica de cálculo de desconto
```

### ❌ Commits Ruins

```bash
❌ updated code
❌ fixes
❌ changes
❌ wip
```

### 📋 Commits com Contexto

```bash
# Bom
feat(auth): adiciona login com Google OAuth

Implementa autenticação via Google usando NextAuth.
Inclui tratamento de erros e redirecionamento.

Closes #123

# Ruim
feat: login
```

---

## 🔗 Links Úteis

- [VERSIONING.md](../VERSIONING.md) - Guia completo
- [RELEASE_MANAGEMENT.md](./RELEASE_MANAGEMENT.md) - Gestão de releases
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://github.com/Sudo-psc/svlentes-hero-shop/releases)
