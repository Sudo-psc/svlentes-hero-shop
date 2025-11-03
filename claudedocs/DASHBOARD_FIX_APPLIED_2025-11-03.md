# Dashboard Redirect Fix - Aplicado em 2025-11-03

## ✅ Solução Implementada

### Modificação Realizada

**Arquivo:** `src/app/api/assinante/subscription/route.ts`

**Linha:** 71-147

### O que foi alterado:

Adicionado **fallback automático por email** quando o usuário não é encontrado por `firebaseUid`.

#### Antes:
```typescript
const user = await prisma.user.findUnique({
  where: { firebaseUid: firebaseUser.uid },
  // ...
})

if (!user) {
  return 404  // ❌ Erro imediato
}
```

#### Depois:
```typescript
let user = await prisma.user.findUnique({
  where: { firebaseUid: firebaseUser.uid },
  // ...
})

// ✅ Fallback por email
if (!user && firebaseUser.email) {
  user = await prisma.user.findUnique({
    where: { email: firebaseUser.email },
    // ...
  })

  // ✅ Sincronização automática do firebaseUid
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid: firebaseUser.uid },
      // ...
    })
  }
}

if (!user) {
  return 404
}
```

## 🎯 Benefícios

1. **Resolve automaticamente** usuários criados manualmente
2. **Sincroniza Firebase UID** no primeiro login
3. **Compatível** com usuários novos e existentes
4. **Sem necessidade** de scripts manuais
5. **Logs detalhados** para debugging

## 📋 Status de Deploy

- ✅ Código alterado
- ⏳ Build em andamento (Next.js produção)
- ⏳ Aguardando restart do serviço systemd
- ⏳ Teste pendente

## 🔄 Próximos Passos

### 1. Finalizar Build
```bash
# Aguardar conclusão do build
wait $(pgrep -f "next build")
```

### 2. Restart do Serviço
```bash
systemctl restart svlentes-nextjs
```

### 3. Verificar Logs
```bash
journalctl -u svlentes-nextjs -f | grep subscription
```

### 4. Testar Login
1. Acessar: https://svlentes.com.br/area-assinante/login
2. Fazer login com: drphilipe.saraiva.oftalmo@gmail.com
3. Verificar redirecionamento para dashboard (não /planos)
4. Confirmar que dados da assinatura aparecem

### 5. Verificar Logs da API
```bash
journalctl -u svlentes-nextjs -f | grep "Firebase UID sincronizado"
```

Deve aparecer:
```
[API /api/assinante/subscription] Usuário não encontrado por firebaseUid, tentando por email: drphilipe.saraiva.oftalmo@gmail.com
[API /api/assinante/subscription] Usuário encontrado por email, sincronizando firebaseUid
[API /api/assinante/subscription] Firebase UID sincronizado com sucesso: <novo_uid>
```

## 🐛 Troubleshooting

### Build muito lento
```bash
# Matar build atual
pkill -f "next build"

# Build mais rápido (sem verificações completas)
npm run build --no-lint

# Ou apenas restart (para Next.js 15 com hot reload)
systemctl restart svlentes-nextjs
```

### Erro após restart
```bash
# Verificar logs detalhados
journalctl -u svlentes-nextjs -n 100 --no-pager

# Rebuild se necessário
npm run build
systemctl restart svlentes-nextjs
```

### Usuário ainda sendo redirecionado
```bash
# 1. Verificar se build foi aplicado
ls -lh .next/standalone/

# 2. Verificar se serviço reiniciou
systemctl status svlentes-nextjs

# 3. Limpar cache do navegador
# Ctrl + Shift + Delete → Clear all

# 4. Verificar no console do navegador se há erros
# F12 → Console → Verificar erros de API
```

## 📊 Logs Esperados

### Login bem-sucedido (primeira vez):
```
[AUTH] User signed in: drphilipe.saraiva.oftalmo@gmail.com
[API /api/assinante/subscription] Usuário não encontrado por firebaseUid, tentando por email
[API /api/assinante/subscription] Usuário encontrado por email, sincronizando firebaseUid
[API /api/assinante/subscription] Firebase UID sincronizado: xyz789abc456
[useSubscription] Subscription loaded successfully
```

### Login bem-sucedido (logins seguintes):
```
[AUTH] User signed in: drphilipe.saraiva.oftalmo@gmail.com
[useSubscription] Subscription loaded successfully
```

## ✅ Checklist de Validação

Após deploy completo:

- [ ] Build finalizado sem erros
- [ ] Serviço reiniciado com sucesso
- [ ] Login funciona corretamente
- [ ] Dashboard carrega sem redirect
- [ ] Dados da assinatura aparecem
- [ ] Firebase UID sincronizado no banco
- [ ] Logs confirmam funcionamento correto
- [ ] Navegação entre páginas funciona
- [ ] Modais abrem corretamente

## 🎉 Impacto Esperado

- **Resolve** problema para usuário Dr. Philipe imediatamente
- **Previne** problema para novos usuários
- **Corrige automaticamente** usuários existentes com UIDs de teste
- **Melhora** experiência de autenticação
- **Mantém** segurança (ownership validation)

---

**Implementado por:** Claude Code
**Data:** 2025-11-03
**Tempo de build:** ~10 minutos
**Status:** ⏳ Aguardando deploy
