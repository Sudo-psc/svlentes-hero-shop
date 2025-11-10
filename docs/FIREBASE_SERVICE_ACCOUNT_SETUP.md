# 🔐 Configuração Segura do Firebase Service Account

## ⚠️ IMPORTANTE: Service Account Anterior Comprometida

A service account que você compartilhou anteriormente foi **exposta publicamente** e precisa ser **REVOGADA IMEDIATAMENTE**.

---

## 🚨 PASSO 1: REVOGAR Service Account Antiga (URGENTE)

### Acesse o Firebase Console:
```bash
open https://console.firebase.google.com/project/svlentes/settings/serviceaccounts/adminsdk
```

### Ações:
1. Procure por: `firebase-adminsdk-fbsvc@svlentes.iam.gserviceaccount.com`
2. Clique nos **3 pontos (⋮)** ao lado
3. Selecione **"Delete service account"** ou **"Revoke key"**

---

## ✅ PASSO 2: Gerar Nova Service Account

### No Firebase Console:

1. **Navegue:**
   - Project Settings (⚙️)
   - Service Accounts tab
   - Clique em **"Generate new private key"**

2. **Download:**
   - Arquivo `svlentes-firebase-adminsdk-xxxxx.json` será baixado

3. **⚠️ NÃO COMMITE ESTE ARQUIVO NO GIT!**

---

## 🔧 PASSO 3: Configurar no Projeto

### Opção A: Usar Variável de Ambiente (RECOMENDADO)

```bash
# 1. Abrir o arquivo JSON baixado
cat ~/Downloads/svlentes-firebase-adminsdk-*.json

# 2. COPIAR TODO O CONTEÚDO (é um JSON de uma linha)

# 3. Adicionar ao .env.local (substituir a linha FIREBASE_SERVICE_ACCOUNT_KEY)
# O conteúdo deve ficar assim:
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes",...}'
```

**No arquivo `.env.local`**, substitua a linha:
```bash
# ANTES (demo):
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes-demo",...}'

# DEPOIS (cole o JSON completo entre aspas simples):
FIREBASE_SERVICE_ACCOUNT_KEY='COLE_AQUI_O_JSON_COMPLETO_DA_NOVA_SERVICE_ACCOUNT'
```

### Opção B: Usar Arquivo Externo (Alternativa)

```bash
# 1. Criar diretório seguro (fora do git)
mkdir -p ~/.firebase-keys

# 2. Mover arquivo baixado
mv ~/Downloads/svlentes-firebase-adminsdk-*.json ~/.firebase-keys/svlentes-sa.json

# 3. Proteger permissões
chmod 600 ~/.firebase-keys/svlentes-sa.json

# 4. No .env.local, adicionar caminho:
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/philipecruz/.firebase-keys/svlentes-sa.json
```

---

## 🛡️ PASSO 4: Garantir Segurança

### Verificar .gitignore

```bash
# Adicionar ao .gitignore
cat >> .gitignore << 'EOF'

# Firebase Service Account (NUNCA commitar)
*firebase-adminsdk*.json
firebase-sa.json
.firebase-keys/
EOF
```

### Verificar se já foi commitado anteriormente

```bash
# Buscar no histórico do git
git log --all --full-history -S "BEGIN PRIVATE KEY"

# Se encontrar algo, é CRÍTICO remover do histórico
```

---

## 📝 Como o Código Usa

### Arquivo: `src/lib/firebase-admin.ts` (ou similar)

```typescript
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Opção A: JSON da variável de ambiente
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'svlentes',
  });

  return adminApp;
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
```

---

## ✅ Checklist de Segurança

- [ ] Service account antiga revogada no Firebase Console
- [ ] Nova service account gerada
- [ ] JSON baixado e salvo em local seguro
- [ ] `.env.local` atualizado com nova chave
- [ ] `.gitignore` atualizado
- [ ] **NÃO** commitou o arquivo .json no git
- [ ] Verificou histórico do git (sem chaves antigas)
- [ ] Código usa `process.env.FIREBASE_SERVICE_ACCOUNT_KEY`

---

## 🔍 Testar Configuração

```bash
# 1. Rebuild (variáveis NEXT_PUBLIC_ são lidas no build)
npm run build

# 2. Start
npm run start

# 3. Testar em outro terminal
node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}').project_id)"
# Deve retornar: svlentes
```

---

## 🆘 Em Produção (Vercel/VPS)

### Vercel

```bash
# Adicionar secret
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production

# Cole o JSON completo quando solicitado
```

### Docker/VPS

```bash
# Adicionar ao .env.production (NO SERVIDOR)
echo "FIREBASE_SERVICE_ACCOUNT_KEY='$(cat ~/.firebase-keys/svlentes-sa.json)'" >> .env.production
```

---

## 📞 Próximos Passos

1. **URGENTE:** Revogar service account antiga
2. Gerar nova service account
3. Atualizar `.env.local` com nova chave
4. Testar localmente
5. Configurar em produção (Vercel/VPS)

---

**⚠️ NUNCA MAIS compartilhe:**
- Conteúdo de `FIREBASE_SERVICE_ACCOUNT_KEY`
- Arquivos `*-adminsdk-*.json`
- Private keys (`BEGIN PRIVATE KEY`)

Essas credenciais dão **controle total** sobre o Firebase!
