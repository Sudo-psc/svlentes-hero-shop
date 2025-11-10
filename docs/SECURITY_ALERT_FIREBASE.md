# 🚨 ALERTA DE SEGURANÇA CRÍTICO - SERVICE ACCOUNT COMPROMETIDA

**Data:** 10 de novembro de 2025  
**Status:** 🔴 CRÍTICO - AÇÃO IMEDIATA NECESSÁRIA

---

## ⚠️ SITUAÇÃO ATUAL

A service account `firebase-adminsdk-fbsvc@svlentes.iam.gserviceaccount.com` foi **EXPOSTA PUBLICAMENTE DUAS VEZES**:

1. **Primeira exposição:** private_key_id `d75e6515d4ee70a0c402d6d63eac305b4412e4da`
2. **Segunda exposição:** private_key_id `4f3e0f4ce348e99da76ce0ce7ca4d239afbf822c`

**Impacto:** Um atacante com estas chaves pode:
- ✅ Ler/escrever TODO o Firestore
- ✅ Criar/deletar usuários no Firebase Auth
- ✅ Acessar Firebase Storage
- ✅ Consumir quota do projeto (custo $$$)
- ✅ DELETAR dados permanentemente

**Severidade:** 🔴 **CRÍTICA**

---

## 🚨 AÇÃO 1: DELETAR Service Account (AGORA - 2 min)

**⚠️ NÃO basta revogar chaves - você deve DELETAR a service account inteira!**

### Passo a Passo:

```bash
# 1. Abrir Firebase Console
open https://console.firebase.google.com/project/svlentes/settings/serviceaccounts/adminsdk
```

**No navegador:**
1. Procure: `firebase-adminsdk-fbsvc@svlentes.iam.gserviceaccount.com`
2. Clique nos **3 pontos verticais (⋮)** ao lado
3. Selecione **"Delete service account"**
4. Confirme a deleção digitando o nome se solicitado
5. Clique em **"Delete"** ou **"Confirm"**

**✅ Confirmação:** A service account desaparecerá da lista

---

## 🚨 AÇÃO 2: CRIAR Nova Service Account (3 min)

### ⚠️ IMPORTANTE: Use nome DIFERENTE e ÚNICO

**Não use:** `firebase-adminsdk-fbsvc` (comprometido)  
**Use:** `svlentes-admin-nov-2025` (novo, rastreável)

### Passo a Passo:

```bash
# 1. Abrir Google Cloud Console (IAM)
open https://console.cloud.google.com/iam-admin/serviceaccounts?project=svlentes
```

**No navegador:**

1. Clique em **"+ CREATE SERVICE ACCOUNT"** (topo da página)

2. **Preencha:**
   - **Service account name:** `svlentes-admin-nov-2025`
   - **Service account ID:** `svlentes-admin-nov-2025` (auto-preenchido)
   - **Description:** "Firebase Admin SDK - Created Nov 2025 (secure)"

3. Clique em **"CREATE AND CONTINUE"**

4. **Grant this service account access to project:**
   - Procure e selecione: **"Firebase Admin SDK Administrator Service Agent"**
   - Ou: **"Editor"** (mais permissões, use com cautela)

5. Clique em **"CONTINUE"** → **"DONE"**

6. **Na lista de service accounts:**
   - Encontre a nova: `svlentes-admin-nov-2025@svlentes.iam.gserviceaccount.com`
   - Clique nos **3 pontos (⋮)** → **"Manage keys"**

7. **Criar chave:**
   - Clique em **"ADD KEY"** → **"Create new key"**
   - Selecione **"JSON"**
   - Clique em **"CREATE"**

8. **Arquivo baixado:**
   - Nome: `svlentes-xxxxxx.json`
   - Local: `~/Downloads/`

**✅ Confirmação:** Arquivo JSON baixado com sucesso

---

## 🚨 AÇÃO 3: Configurar .env.local com Nova Chave (2 min)

### Passo 1: Ver conteúdo do arquivo

```bash
# Verificar o arquivo baixado
ls -la ~/Downloads/svlentes-*.json

# Ver conteúdo (vai ser um JSON grande)
cat ~/Downloads/svlentes-*.json
```

### Passo 2: Copiar TODO o JSON

```bash
# Copiar para clipboard (macOS)
cat ~/Downloads/svlentes-*.json | pbcopy

# Ou abrir no editor
nano ~/Downloads/svlentes-*.json
# Cmd+A para selecionar tudo, Cmd+C para copiar
```

### Passo 3: Editar .env.local

```bash
# Abrir arquivo
nano .env.local

# Procurar linha:
FIREBASE_SERVICE_ACCOUNT_KEY='AGUARDANDO_NOVA_SERVICE_ACCOUNT_SEGURA'

# Substituir por (cole entre aspas simples):
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes",...TODO_O_JSON...}'
```

**⚠️ IMPORTANTE:**
- Cole o JSON **INTEIRO** entre aspas simples `'...'`
- O JSON deve ter `"client_email": "svlentes-admin-nov-2025@svlentes.iam.gserviceaccount.com"`
- **NÃO deve ter** `firebase-adminsdk-fbsvc` (comprometido)

### Passo 4: Salvar e fechar

```bash
# No nano:
Ctrl+O (salvar)
Enter (confirmar)
Ctrl+X (sair)
```

---

## 🚨 AÇÃO 4: Mover Arquivo JSON para Local Seguro (1 min)

```bash
# Criar diretório seguro
mkdir -p ~/.firebase-keys

# Mover arquivo
mv ~/Downloads/svlentes-*.json ~/.firebase-keys/svlentes-admin-nov-2025.json

# Proteger permissões (só você pode ler)
chmod 600 ~/.firebase-keys/svlentes-admin-nov-2025.json

# Verificar
ls -la ~/.firebase-keys/
```

**✅ Confirmação:** Arquivo movido e protegido

---

## 🚨 AÇÃO 5: Testar Configuração (1 min)

```bash
# Executar teste
./scripts/test-firebase-setup.sh
```

**✅ Esperado:**
```
✓ Firebase Web SDK configurado
✓ Service Account configurada
  Project ID: svlentes
  Client Email: svlentes-admin-nov-2025@svlentes.iam.gserviceaccount.com
✓ Project IDs correspondem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FIREBASE CONFIGURADO CORRETAMENTE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**❌ Se detectar service account comprometida:**
- O script avisará: **"SERVICE ACCOUNT COMPROMETIDA DETECTADA!"**
- Significa que você ainda está usando a antiga
- Volte ao Passo 2 e crie uma nova com nome diferente

---

## 🚨 AÇÃO 6: Verificar Logs de Acesso (3 min)

### Verificar se houve acesso não autorizado:

```bash
# Abrir Google Cloud Logging
open https://console.cloud.google.com/logs/query?project=svlentes
```

**Filtros:**
```
resource.type="service_account"
protoPayload.authenticationInfo.principalEmail="firebase-adminsdk-fbsvc@svlentes.iam.gserviceaccount.com"
timestamp>="2025-11-10T00:00:00Z"
```

**O que procurar:**
- ❌ Requisições de IPs desconhecidos
- ❌ Horários suspeitos (madrugada, horários que você não estava trabalhando)
- ❌ Operações de deleção em massa
- ❌ Criação de novos usuários admin

**Se encontrar atividade suspeita:**
1. Documente (screenshots)
2. Verifique dados do Firestore/Auth
3. Considere restaurar backup
4. Mude senhas de usuários críticos

---

## ✅ Checklist de Segurança

- [ ] **Service account antiga DELETADA** (não apenas revogada)
- [ ] **Nova service account CRIADA** com nome único
- [ ] **Arquivo JSON baixado**
- [ ] **`.env.local` atualizado** com nova chave
- [ ] **Arquivo JSON movido** para local seguro (~/.firebase-keys/)
- [ ] **Permissões ajustadas** (chmod 600)
- [ ] **Teste executado** com sucesso
- [ ] **Logs verificados** (sem atividade suspeita)
- [ ] **`.gitignore` atualizado** (já foi feito)
- [ ] **NUNCA MAIS compartilhar** credenciais em chats/LLMs

---

## 🔐 Boas Práticas de Segurança

### ✅ O QUE FAZER:

1. **Usar variáveis de ambiente**
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY='...'
   ```

2. **Manter arquivos .json FORA do git**
   ```bash
   ~/.firebase-keys/  # Fora do repositório
   ```

3. **Rotacionar chaves periodicamente**
   - A cada 3-6 meses
   - Imediatamente se comprometida

4. **Usar nomes únicos e rastreáveis**
   ```
   svlentes-admin-nov-2025
   svlentes-admin-mai-2026
   ```

5. **Princípio do menor privilégio**
   - Só conceder permissões necessárias
   - Não usar "Owner" se "Editor" basta

### ❌ NUNCA FAZER:

1. ❌ Commitar arquivos `.json` no git
2. ❌ Compartilhar chaves em:
   - Chats (WhatsApp, Telegram, Discord)
   - LLMs (ChatGPT, Claude, etc.)
   - Issues/PRs no GitHub
   - Screenshots públicos
   - E-mails não criptografados
3. ❌ Hardcodear credenciais no código
4. ❌ Deixar arquivos `.json` em Downloads/Desktop
5. ❌ Usar a mesma service account para múltiplos ambientes

---

## 📞 Em Caso de Dúvidas

### Documentação:
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Service Accounts: https://cloud.google.com/iam/docs/service-accounts
- Security Best Practices: https://firebase.google.com/docs/projects/api-keys

### Scripts criados:
- `./scripts/test-firebase-setup.sh` - Testar configuração
- `docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md` - Guia completo

---

## 🎯 PRÓXIMOS PASSOS (ORDEM DE PRIORIDADE)

### 🔴 URGENTE (Agora - 10 min total):
1. [ ] Deletar service account `firebase-adminsdk-fbsvc`
2. [ ] Criar nova service account `svlentes-admin-nov-2025`
3. [ ] Configurar `.env.local` com nova chave
4. [ ] Testar com `./scripts/test-firebase-setup.sh`

### 🟡 IMPORTANTE (Hoje):
5. [ ] Verificar logs de acesso
6. [ ] Mover arquivo JSON para local seguro
7. [ ] Build e start da aplicação

### 🟢 MANUTENÇÃO (Esta semana):
8. [ ] Revisar permissões de usuários no projeto
9. [ ] Configurar alertas de segurança
10. [ ] Documentar procedimento de rotação de chaves

---

**⏰ TEMPO ESTIMADO TOTAL: 10 minutos**

**🚨 NÃO CONTINUE DESENVOLVENDO ATÉ COMPLETAR OS PASSOS URGENTES!**

---

*Documento criado automaticamente em 10/11/2025 após detecção de credenciais comprometidas.*
