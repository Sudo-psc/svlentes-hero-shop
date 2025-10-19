# Sistema de Gerenciamento de Releases

## 📖 Visão Geral

Este documento descreve o sistema completo de gerenciamento de releases implementado no projeto SVLentes, incluindo versionamento automático, geração de CHANGELOG, publicação de releases e deploys automatizados.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐
│  Developer      │
│  Commits        │
└────────┬────────┘
         │ (conventional commits)
         ▼
┌─────────────────┐
│  Commitlint     │ ← Valida formato do commit
│  (Git Hook)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to Main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Tests       │ ← Lint, Tests, Build
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Semantic        │ ← Analisa commits
│ Release         │ ← Determina versão
└────────┬────────┘
         │
         ├─────────────────┬──────────────┬────────────────┐
         ▼                 ▼              ▼                ▼
    ┌─────────┐      ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Version │      │ CHANGELOG│   │ Git Tag  │   │ GitHub   │
    │ Bump    │      │ Generate │   │ Create   │   │ Release  │
    └─────────┘      └──────────┘   └──────────┘   └──────────┘
         │                 │              │               │
         └─────────────────┴──────────────┴───────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   Deploy     │
                   │   Trigger    │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Notifications│
                   │ Slack/N8N    │
                   └──────────────┘
```

## 🔧 Componentes

### 1. Commitlint

**Arquivo:** `.commitlintrc.json`

Valida que todos os commits seguem o padrão Conventional Commits.

**Regras principais:**
- Tipo obrigatório: `feat`, `fix`, `docs`, etc.
- Subject não pode estar vazio
- Header máximo de 100 caracteres
- Subject não pode terminar com ponto

### 2. Commitizen

**Configuração:** `package.json` → `config.commitizen`

Ferramenta interativa para criar commits no formato correto.

**Uso:**
```bash
npm run commit
```

### 3. Husky

**Diretório:** `.husky/`

Gerencia git hooks para automatizar validações.

**Hooks configurados:**
- `commit-msg`: Valida mensagem com commitlint
- `pre-commit`: Executa linting antes do commit

### 4. Semantic Release

**Arquivo:** `.releaserc.json`

Motor principal do sistema de versionamento automático.

**Plugins utilizados:**
- `@semantic-release/commit-analyzer`: Analisa commits e determina versão
- `@semantic-release/release-notes-generator`: Gera release notes
- `@semantic-release/changelog`: Atualiza CHANGELOG.md
- `@semantic-release/npm`: Atualiza package.json (sem publicar no npm)
- `@semantic-release/git`: Commita mudanças de versão
- `@semantic-release/github`: Publica release no GitHub

### 5. GitHub Actions

**Arquivo:** `.github/workflows/release.yml`

Workflow que orquestra todo o processo de release.

**Jobs:**
1. **release**: Cria e publica a release
2. **trigger-deployment**: Aciona deploy em produção

## 📋 Fluxo Completo de Release

### 1. Desenvolvedor faz commit

```bash
# Usando commitizen (recomendado)
npm run commit

# Ou manualmente
git commit -m "feat: adiciona nova funcionalidade"
```

### 2. Hook valida o commit

O hook `commit-msg` executa commitlint para validar o formato.

Se inválido:
```bash
❌ subject may not be empty [subject-empty]
❌ type may not be empty [type-empty]
```

Se válido:
```bash
✅ Commit message validated
```

### 3. Push para branch principal

```bash
git push origin main
```

### 4. CI executa testes

O workflow de CI (`ci.yml`) executa:
- Linting
- Type checking
- Unit tests
- E2E tests
- Build
- Security scan

### 5. Semantic Release analisa commits

Se os testes passam, o workflow de release é acionado.

**Análise de commits desde a última release:**

```javascript
// Commits encontrados:
feat: adiciona calculadora  → MINOR bump
fix: corrige validação      → PATCH bump
docs: atualiza README       → No bump

// Resultado: MINOR bump (0.1.0 → 0.2.0)
```

### 6. Geração de artifacts

#### a) Atualiza package.json

```json
{
  "version": "0.2.0"  // ← Atualizado automaticamente
}
```

#### b) Gera CHANGELOG.md

```markdown
## [0.2.0](https://github.com/Sudo-psc/svlentes-hero-shop/compare/v0.1.0...v0.2.0) (2025-10-19)

### 🚀 Features

* adiciona calculadora ([abc123](https://github.com/.../commit/abc123))

### 🐛 Bug Fixes

* corrige validação ([def456](https://github.com/.../commit/def456))
```

#### c) Cria Git Tag

```bash
git tag -a v0.2.0 -m "chore(release): 0.2.0"
```

#### d) Commita e faz push

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore(release): 0.2.0 [skip ci]"
git push --follow-tags origin main
```

#### e) Publica GitHub Release

Cria release no GitHub com:
- Título: `v0.2.0`
- Tag: `v0.2.0`
- Release notes detalhadas
- Assets (se houver)

### 7. Deploy automático

O job `trigger-deployment` aciona o workflow `deploy-production.yml`.

### 8. Notificações

Envia notificações via:
- **Slack**: Mensagem formatada com link para release
- **Webhook N8N**: Dados estruturados para integrações

## 🎯 Estratégias de Branching

### Branch: main/master

**Propósito:** Produção

**Release:** Versão estável (ex: `v1.2.3`)

**Deploy:** Automático para produção

### Branch: develop

**Propósito:** Desenvolvimento

**Release:** Versão beta (ex: `v1.2.3-beta.1`)

**Deploy:** Automático para staging

### Branch: staging

**Propósito:** Homologação

**Release:** Release candidate (ex: `v1.2.3-rc.1`)

**Deploy:** Automático para ambiente de staging

## 📊 Regras de Versionamento

### Análise de Commits

| Commit Type | Exemplo | Version Bump |
|------------|---------|--------------|
| `feat:` | `feat: nova feature` | MINOR (0.x.0) |
| `fix:` | `fix: correção de bug` | PATCH (0.0.x) |
| `perf:` | `perf: otimização` | PATCH (0.0.x) |
| `refactor:` | `refactor: melhoria` | PATCH (0.0.x) |
| `build:` | `build: atualiza deps` | PATCH (0.0.x) |
| `revert:` | `revert: desfaz commit` | PATCH (0.0.x) |
| Breaking | `feat!:` ou `BREAKING CHANGE:` | MAJOR (x.0.0) |
| Outros | `docs:`, `style:`, `test:`, `ci:` | No bump |

### Exemplos de Evolução de Versão

```
Versão Atual: 1.2.3

1. docs: atualiza README
   → 1.2.3 (sem mudança)

2. fix: corrige bug no formulário
   → 1.2.4 (PATCH)

3. feat: adiciona nova página
   → 1.3.0 (MINOR)

4. feat!: remove API antiga
   → 2.0.0 (MAJOR)
```

## 🔐 Configuração de Secrets

### Secrets Necessários no GitHub

Configure em: `Settings → Secrets and variables → Actions`

```yaml
# Obrigatórios
GITHUB_TOKEN: (gerado automaticamente pelo GitHub)

# Opcionais (para notificações)
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/...
N8N_WEBHOOK_URL: https://n8n.example.com/webhook/...

# Deploy
SSH_PRIVATE_KEY: (chave privada SSH para deploy)
SSH_HOST: (host do servidor)
SSH_USER: (usuário SSH)
```

## 📈 Monitoramento e Métricas

### Métricas Importantes

1. **Frequência de Releases**
   - Quantas releases por semana/mês
   - Tempo médio entre releases

2. **Tipos de Mudanças**
   - Proporção de features vs fixes
   - Quantidade de breaking changes

3. **Qualidade**
   - Taxa de rollback
   - Bugs encontrados pós-release

4. **Performance do Pipeline**
   - Tempo total de release
   - Taxa de sucesso do CI/CD

### Dashboards

- **GitHub Insights:** https://github.com/Sudo-psc/svlentes-hero-shop/pulse
- **Actions:** https://github.com/Sudo-psc/svlentes-hero-shop/actions
- **Releases:** https://github.com/Sudo-psc/svlentes-hero-shop/releases

## 🚨 Troubleshooting

### Problema: Release não foi criada

**Sintomas:** Push para main não gerou release

**Diagnóstico:**
```bash
# Verifique os últimos commits
git log --oneline -5

# Execute semantic-release localmente (dry-run)
npm run release:dry
```

**Possíveis causas:**
1. Commits não seguem conventional commits
2. Apenas commits de docs/style/test (não geram release)
3. Mensagem contém `[skip ci]`

**Solução:**
```bash
# Faça um commit que gere release
git commit -m "fix: correção importante"
git push
```

### Problema: Erro de permissão no GitHub

**Sintomas:** Semantic release falha ao criar tag/release

**Diagnóstico:**
```bash
# Verifique permissions no workflow
cat .github/workflows/release.yml | grep -A 5 "permissions:"
```

**Solução:**
```yaml
permissions:
  contents: write       # ← Necessário
  issues: write         # ← Necessário
  pull-requests: write  # ← Necessário
```

### Problema: CHANGELOG não atualiza

**Sintomas:** CHANGELOG.md não é modificado na release

**Diagnóstico:**
```bash
# Verifique se o plugin está configurado
cat .releaserc.json | grep -A 5 "changelog"
```

**Solução:**
```bash
# Reinstale dependências
npm ci

# Execute dry-run
npm run release:dry
```

### Problema: Deploy não é acionado

**Sintomas:** Release criada mas deploy não executa

**Diagnóstico:**
```bash
# Verifique o workflow de deploy
gh workflow list
gh run list --workflow=deploy-production.yml
```

**Solução:**
```bash
# Trigger manual via GitHub CLI
gh workflow run deploy-production.yml

# Ou via UI: Actions → Deploy to Production → Run workflow
```

## 🔄 Rollback de Release

### Cenário: Release com problema crítico

**Opção 1: Revert do commit de release**

```bash
# Identifique o commit de release
git log --oneline -5

# Reverta o commit
git revert <commit-sha>

# Faça push
git push
```

**Opção 2: Release de hotfix**

```bash
# Crie fix rapidamente
git commit -m "fix: corrige problema crítico da v1.2.0"

# Push aciona nova release (v1.2.1)
git push
```

**Opção 3: Deploy do rollback**

```bash
# Via script de deploy
npm run deploy:rollback
```

## 📚 Recursos e Links

### Documentação Oficial

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Commitlint](https://commitlint.js.org/)
- [Commitizen](http://commitizen.github.io/cz-cli/)
- [Husky](https://typicode.github.io/husky/)

### Documentação do Projeto

- [VERSIONING.md](../VERSIONING.md) - Guia completo de versionamento
- [AGENTS.md](../AGENTS.md) - Guia para agentes AI
- [README.md](../README.md) - README principal do projeto

### Ferramentas

- [GitHub Releases](https://github.com/Sudo-psc/svlentes-hero-shop/releases)
- [CHANGELOG.md](../CHANGELOG.md)
- [Commitizen CLI](http://commitizen.github.io/cz-cli/)

## 🎓 Best Practices

### Para Desenvolvedores

1. ✅ **Sempre use conventional commits**
   ```bash
   npm run commit  # Use commitizen
   ```

2. ✅ **Teste localmente antes do push**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

3. ✅ **Descreva mudanças claramente**
   ```bash
   # ❌ Ruim
   git commit -m "fix: correções"
   
   # ✅ Bom
   git commit -m "fix: corrige validação de email no formulário de contato"
   ```

4. ✅ **Use breaking changes com cuidado**
   ```bash
   # Sempre documente breaking changes
   git commit -m "feat!: remove suporte para Node.js 14
   
   BREAKING CHANGE: Node.js 16+ agora é requerido"
   ```

### Para Revisores

1. ✅ Verifique se commits seguem o padrão
2. ✅ Confirme que breaking changes estão documentadas
3. ✅ Valide que a versão será incrementada corretamente
4. ✅ Revise se o CHANGELOG fará sentido

### Para Releases

1. ✅ Monitore o processo de release no Actions
2. ✅ Verifique se o CHANGELOG foi atualizado
3. ✅ Confirme que a release foi publicada no GitHub
4. ✅ Valide que o deploy foi executado com sucesso
5. ✅ Teste a aplicação em produção

## 🎯 Checklist de Release

Antes de mergear para main:

- [ ] Todos os testes passam
- [ ] Build está funcionando
- [ ] Commits seguem conventional commits
- [ ] Breaking changes documentadas
- [ ] PR aprovado por reviewer
- [ ] CI/CD passou completamente

Após merge:

- [ ] Release criada automaticamente
- [ ] CHANGELOG atualizado
- [ ] Git tag criada
- [ ] Release notes publicadas no GitHub
- [ ] Deploy executado com sucesso
- [ ] Aplicação testada em produção
- [ ] Notificações enviadas

---

**Última atualização:** 2025-10-19  
**Versão:** 1.0.0  
**Mantido por:** Time de DevOps
