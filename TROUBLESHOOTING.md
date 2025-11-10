# 🔧 Troubleshooting Guide - SVLentes

## Firebase Configuration Errors

### Erro: "Missing configuration fields"

**Sintomas**:
```
[FIREBASE] Missing configuration fields: Array(6)
Error: Firebase configuration error: missing apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
```

**Causa**: Arquivo `.env.local` ausente ou com configurações incompletas

**Solução**:

1. **Criar arquivo `.env.local`**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Obter credenciais do Firebase**:
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Selecione seu projeto ou crie um novo
   - Vá em **Project Settings** → **General** → **Your apps**
   - Copie as configurações do Firebase Config

3. **Preencher variáveis de ambiente**:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
   ```

4. **Reiniciar servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

**⚠️ IMPORTANTE**: Nunca commitar o arquivo `.env.local` no Git!

---

## WebSocket Errors (jam.dev)

### Erro: "WebSocket connection to 'wss://ws.jam.dev/graphql' failed"

**Sintomas**:
```
WebSocket connection to 'wss://ws.jam.dev/graphql' failed:
Error during WebSocket handshake: net::ERR_CONNECTION_RESET
```

**Causa**: Extensão do navegador Jam.dev tentando se conectar ao servidor

**Impacto**: ⚠️ **NÃO CRÍTICO** - Não afeta funcionamento da aplicação

**Soluções**:

### Opção 1: Desabilitar extensão (Recomendado para desenvolvimento)
1. Abra Chrome Extensions: `chrome://extensions/`
2. Localize "Jam" ou "jam.dev"
3. Toggle OFF ou remova a extensão
4. Recarregue a página

### Opção 2: Ignorar erros (Se precisar da extensão)
- Estes erros são inofensivos
- Filtre no DevTools Console: `-url:jam.dev`

### Opção 3: Configurar extensão
- Abra configurações da extensão Jam
- Desabilite para localhost/desenvolvimento
- Mantenha ativa apenas para ambientes de produção

---

## Hydration Errors

### Erro: "Error occurred during hydration"

**Sintomas**:
```
Warning: An error occurred during hydration.
The server HTML was replaced with client content
```

**Causas Comuns**:
1. ✅ **Configurações Firebase ausentes** (resolvido acima)
2. Diferenças entre renderização servidor/cliente
3. Timestamps ou dados dinâmicos

**Verificações**:

1. **Confirmar variáveis de ambiente**:
   ```bash
   cat .env.local | grep FIREBASE
   ```

2. **Limpar cache Next.js**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Verificar componentes client-side**:
   - Garantir que componentes que usam `window` tenham `'use client'`
   - Usar `useEffect` para operações client-only

---

## Service Worker Issues

### Erro: "Failed to fetch" em sw.js

**Sintomas**:
```
Uncaught TypeError: Failed to fetch at Ae (sw.js:1418:24972)
```

**Causas**:
- Network offline
- CORS issues
- Service Worker cache corrompido

**Soluções**:

1. **Limpar cache do Service Worker**:
   ```javascript
   // No DevTools Console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(r => r.unregister())
   })
   ```

2. **Limpar Application Cache**:
   - Abra DevTools → Application → Storage
   - Click "Clear site data"
   - Recarregue a página

3. **Desativar Service Worker temporariamente**:
   - DevTools → Application → Service Workers
   - Check "Bypass for network"

---

## Quick Fixes Checklist

Para resolver a maioria dos erros rapidamente:

```bash
# 1. Verificar .env.local existe
ls -la .env.local

# 2. Se não existir, criar
cp .env.local.example .env.local

# 3. Limpar cache Next.js
rm -rf .next

# 4. Reinstalar dependências (se necessário)
rm -rf node_modules package-lock.json
npm install

# 5. Reiniciar servidor
npm run dev
```

---

## Recursos Adicionais

- [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Service Worker Debugging](https://developer.chrome.com/docs/workbox/troubleshooting/)

---

**Última atualização**: 2025-11-10
