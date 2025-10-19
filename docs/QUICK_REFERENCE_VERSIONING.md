# Quick Reference - Sistema de Versionamento

> Guia rápido para desenvolvedores sobre conventional commits e releases automáticas

## 🚀 Como Fazer Commits

### Método 1: Commitizen (Recomendado)
```bash
npm run commit
```

### Método 2: Manual
```bash
git commit -m "tipo: descrição curta"
```

## 📝 Tipos de Commit

| Tipo | Quando Usar | Versão |
|------|-------------|--------|
| `feat:` | Nova funcionalidade | MINOR ⬆️ |
| `fix:` | Correção de bug | PATCH ⬆️ |
| `perf:` | Melhoria de performance | PATCH ⬆️ |
| `refactor:` | Refatoração de código | PATCH ⬆️ |
| `build:` | Mudanças no build/deps | PATCH ⬆️ |
| `revert:` | Reverter commit | PATCH ⬆️ |
| `docs:` | Apenas documentação | Sem release |
| `style:` | Formatação de código | Sem release |
| `test:` | Testes | Sem release |
| `ci:` | CI/CD | Sem release |
| `chore:` | Outras mudanças | Sem release |

## ⚠️ Breaking Changes

**Sintaxe 1:** Com `!`
```bash
git commit -m "feat!: remove suporte para Node.js 14"
```

**Sintaxe 2:** No corpo do commit
```bash
git commit -m "feat: nova API v2

BREAKING CHANGE: Remove endpoints da API v1"
```

**Resultado:** Incrementa versão MAJOR (1.0.0 → 2.0.0)

## 📋 Exemplos Práticos

### Nova Feature
```bash
git commit -m "feat: adiciona filtro de busca na lista de produtos"
# Resultado: 1.2.0 → 1.3.0
```

### Correção de Bug
```bash
git commit -m "fix: corrige validação de email no formulário de contato"
# Resultado: 1.2.0 → 1.2.1
```

### Feature com Escopo
```bash
git commit -m "feat(auth): adiciona login com Google"
# Resultado: 1.2.0 → 1.3.0
```

### Fix com Issue
```bash
git commit -m "fix: corrige erro no cálculo de desconto

Closes #123"
# Resultado: 1.2.0 → 1.2.1
```

### Breaking Change
```bash
git commit -m "feat!: migra para nova estrutura de API

BREAKING CHANGE: Endpoints /api/v1/* foram removidos.
Use /api/v2/* em seu lugar."
# Resultado: 1.2.0 → 2.0.0
```

### Refatoração
```bash
git commit -m "refactor: simplifica lógica de validação de formulários"
# Resultado: 1.2.0 → 1.2.1
```

### Documentação (sem release)
```bash
git commit -m "docs: atualiza README com instruções de deploy"
# Resultado: 1.2.0 → 1.2.0 (sem mudança)
```

## 🔄 Fluxo de Release

```
1. Developer commits → 2. Push to main → 3. CI tests → 
4. Semantic Release → 5. Version bump → 6. CHANGELOG → 
7. Git tag → 8. GitHub Release → 9. Deploy → 10. Notify
```

## ⚡ Comandos Rápidos

```bash
# Fazer commit interativo
npm run commit

# Testar release localmente
npm run release:dry

# Ver versão atual
node -p "require('./package.json').version"

# Ver últimas tags
git tag -l -n1 | tail -5

# Ver CHANGELOG
cat CHANGELOG.md

# Validar mensagem de commit
echo "feat: nova feature" | npx commitlint
```

## 🎯 Checklist Antes de Commitar

- [ ] Código testado localmente
- [ ] `npm run lint` passou
- [ ] `npm run test` passou
- [ ] Mensagem de commit segue o padrão
- [ ] Breaking changes documentadas (se houver)

## 🚨 Erros Comuns

### ❌ Commit rejeitado - formato inválido
```bash
❌ subject may not be empty [subject-empty]
❌ type may not be empty [type-empty]
```
**Solução:** Use o formato correto: `tipo: descrição`

### ❌ Nenhuma release criada
**Causa:** Apenas commits de `docs:`, `style:`, `test:`, ou `ci:`  
**Solução:** Faça um commit `feat:` ou `fix:`

### ❌ Release criada mas deploy não executou
**Causa:** Workflow de deploy não foi acionado  
**Solução:** Aguarde alguns minutos ou trigger manualmente

## 📚 Mais Informações

- **Guia Completo:** [VERSIONING.md](../VERSIONING.md)
- **Gestão de Releases:** [RELEASE_MANAGEMENT.md](./RELEASE_MANAGEMENT.md)
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Semantic Versioning:** https://semver.org/

## 💡 Dicas

1. **Use commitizen** (`npm run commit`) - evita erros
2. **Commits pequenos** - facilita code review
3. **Mensagens claras** - ajuda no CHANGELOG
4. **Teste antes** - evita releases com bugs
5. **Breaking changes** - use com cuidado e documente bem

---

**Precisa de ajuda?** Consulte a [documentação completa](./RELEASE_MANAGEMENT.md) ou abra uma issue.
