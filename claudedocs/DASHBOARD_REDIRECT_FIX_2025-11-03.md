# Dashboard Redirect Fix - 2025-11-03

## 🔴 Problema Identificado

Assinantes com assinaturas ativas estão sendo redirecionados para `/planos` ao invés de ver o dashboard.

## 🔍 Causa Raiz

O sistema possui **dois problemas relacionados**:

### 1. API busca usuário por `firebaseUid`
**Arquivo:** `src/app/api/assinante/subscription/route.ts:73`

```typescript
const user = await prisma.user.findUnique({
  where: { firebaseUid: firebaseUser.uid },  // ← Busca apenas por firebaseUid
  include: { subscriptions: ... }
})
```

### 2. Usuários criados manualmente podem ter `firebaseUid` de teste
**Dados do banco:**
```
Email: drphilipe.saraiva.oftalmo@gmail.com
Firebase UID: test-1761168246238  ← UID de teste, não corresponde ao Firebase real
Assinaturas: 3 ATIVAS
```

### 3. Fluxo do problema

```
Usuário faz login
   ↓
Firebase autentica com UID real (ex: "xyz789abc456")
   ↓
Hook useSubscription busca: GET /api/assinante/subscription
   ↓
API procura user.firebaseUid === "xyz789abc456"
   ↓
❌ Não encontra (banco tem "test-1761168246238")
   ↓
Retorna: { subscription: null }
   ↓
Dashboard detecta !subscription
   ↓
Redireciona para /planos
```

## ✅ Soluções

### Solução 1: Vincular Firebase UID Correto (RECOMENDADO)

#### Passo 1: Obter o Firebase UID real

1. Acesse: https://svlentes.com.br/area-assinante/login
2. Faça login com: `drphilipe.saraiva.oftalmo@gmail.com`
3. Abra o Console do navegador (F12)
4. Execute no console:

```javascript
firebase.auth().currentUser.uid
```

5. Copie o UID retornado (exemplo: `"abc123xyz456"`)

#### Passo 2: Atualizar no banco de dados

```bash
cd /root/svlentes-hero-shop
node scripts/fix-firebase-uid.js "drphilipe.saraiva.oftalmo@gmail.com" "<UID_COPIADO>"
```

#### Passo 3: Testar

1. Faça logout
2. Faça login novamente
3. Acesse `/area-assinante/dashboard`
4. ✅ Dashboard deve carregar corretamente!

---

### Solução 2: API buscar por email como fallback (ALTERNATIVA)

Modificar a API para buscar por `email` quando não encontrar por `firebaseUid`:

**Arquivo:** `src/app/api/assinante/subscription/route.ts`

```typescript
// Linha 73 - ANTES:
const user = await prisma.user.findUnique({
  where: { firebaseUid: firebaseUser.uid },
  include: { subscriptions: ... }
})

// DEPOIS (busca por firebaseUid OU email):
let user = await prisma.user.findUnique({
  where: { firebaseUid: firebaseUser.uid },
  include: { subscriptions: ... }
})

// Fallback: buscar por email se não encontrou por UID
if (!user && firebaseUser.email) {
  user = await prisma.user.findUnique({
    where: { email: firebaseUser.email },
    include: { subscriptions: ... }
  })

  // Se encontrou, atualizar firebaseUid automaticamente
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid: firebaseUser.uid },
      include: { subscriptions: ... }
    })
  }
}
```

**Vantagens:**
- Resolve automaticamente para todos os usuários
- Sincroniza Firebase UID no primeiro login
- Mais robusto para usuários criados manualmente

**Desvantagens:**
- Modifica o código da API
- Necessita restart do serviço

---

### Solução 3: Script de Sincronização em Massa

Para sincronizar TODOS os usuários de uma vez:

**Criar:** `scripts/sync-all-firebase-uids.js`

```javascript
// Script para verificar e reportar usuários sem Firebase UID válido
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAllUsers() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firebaseUid: null },
                { firebaseUid: { startsWith: 'test-' } }
            ]
        },
        select: {
            id: true,
            email: true,
            name: true,
            firebaseUid: true,
            _count: { select: { subscriptions: true } }
        }
    });

    console.log(`\n📊 Usuários com Firebase UID inválido: ${users.length}\n`);

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   UID atual: ${user.firebaseUid || 'NULL'}`);
        console.log(`   Assinaturas: ${user._count.subscriptions}`);
        console.log('');
    });

    await prisma.$disconnect();
}

syncAllUsers();
```

---

## 🎯 Recomendação

**Use a Solução 1** para o usuário Dr. Philipe imediatamente.

**Implemente a Solução 2** para prevenir o problema no futuro e corrigir automaticamente.

## 📋 Checklist de Verificação

Após aplicar a solução, verificar:

- [ ] Usuário consegue fazer login
- [ ] Dashboard carrega sem redirect para /planos
- [ ] Dados da assinatura aparecem corretamente
- [ ] Todos os widgets do dashboard funcionam
- [ ] Modais de edição abrem corretamente

## 🔧 Comandos Úteis

### Verificar Firebase UID de um usuário
```bash
node scripts/check-subscription.js "email@example.com"
```

### Verificar todos os usuários com UID de teste
```bash
npx prisma studio
# Filtrar: firebaseUid startsWith "test-"
```

### Logs da API em tempo real
```bash
journalctl -u svlentes-nextjs -f | grep subscription
```

## 📝 Notas Importantes

1. **UID de teste:** UIDs começando com `test-` são criados pelo script `add-subscription.js`
2. **Sincronização automática:** A Solução 2 sincroniza UIDs automaticamente no login
3. **Múltiplas assinaturas:** Sistema suporta múltiplas assinaturas por usuário
4. **LGPD:** Logs de auditoria registram todas as alterações de dados

## 🚀 Status

- **Problema:** ✅ Identificado
- **Causa raiz:** ✅ Confirmada
- **Soluções:** ✅ Documentadas
- **Scripts:** ✅ Criados
- **Teste:** ⏳ Aguardando execução

---

**Criado:** 2025-11-03
**Autor:** Claude Code
**Status:** Aguardando aplicação da solução
