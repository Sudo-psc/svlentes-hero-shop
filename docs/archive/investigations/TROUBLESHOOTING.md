# 🔧 Guia de Solução de Problemas

## Erro: MIME type 'text/html' is not a supported stylesheet

### Causa
O servidor Next.js está retornando HTML em vez dos arquivos estáticos corretos. Isso geralmente acontece quando:
- O cache do Next.js está corrompido
- O servidor não foi reiniciado após mudanças significativas
- Há processos Next.js duplicados rodando

### Solução Rápida

#### Opção 1: Script Automático
```bash
./restart-dev.sh
```

#### Opção 2: Manual
```bash
# 1. Limpar cache
rm -rf .next

# 2. Parar processos Next.js
pkill -f "next dev"

# 3. Aguardar alguns segundos
sleep 2

# 4. Reiniciar servidor
npm run dev
```

## Outros Problemas Comuns

### Erro: Port 3000 already in use

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -ti:3000

# Matar o processo
kill -9 $(lsof -ti:3000)

# Ou usar porta diferente
npm run dev -- -p 3001
```

### Erro: Module not found

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Limpar cache e reiniciar
rm -rf .next
npm run dev
```

### Erro: React.Children.only

**Causa:** Componente Link do Next.js recebendo múltiplos filhos

**Solução:** Use um único elemento filho dentro de Link
```tsx
// ❌ Errado
<Link href="/path">
  <Button>
    <Icon />
    <span>Text</span>
  </Button>
</Link>

// ✅ Correto
<Link href="/path" className="block">
  <button className="...">
    <Icon />
    <span>Text</span>
  </button>
</Link>
```

### Build Errors

**Solução:**
```bash
# Verificar erros de TypeScript
npm run build

# Se houver erros, verificar diagnósticos
# Corrigir os erros apontados
# Tentar build novamente
```

### Estilos não aplicados

**Solução:**
```bash
# Verificar se Tailwind está configurado
cat tailwind.config.js

# Limpar cache e reconstruir
rm -rf .next
npm run dev
```

## Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar servidor de produção
npm run lint         # Verificar erros de linting
```

### Limpeza
```bash
rm -rf .next                    # Limpar cache Next.js
rm -rf node_modules             # Remover dependências
rm -rf .next node_modules       # Limpeza completa
```

### Diagnóstico
```bash
# Verificar processos Next.js rodando
ps aux | grep next

# Verificar porta em uso
lsof -i :3000

# Verificar versão do Node
node --version

# Verificar versão do npm
npm --version
```

## Checklist de Solução de Problemas

Quando encontrar um erro, siga esta ordem:

1. ✅ Limpar cache do Next.js (`rm -rf .next`)
2. ✅ Parar todos os processos Next.js (`pkill -f "next dev"`)
3. ✅ Verificar se há erros de TypeScript (`npm run build`)
4. ✅ Reinstalar dependências se necessário (`npm install`)
5. ✅ Reiniciar servidor (`npm run dev`)
6. ✅ Limpar cache do navegador (Cmd+Shift+R no Mac)

## Logs Úteis

### Ver logs do servidor
O servidor Next.js mostra logs úteis no terminal:
- ✓ Compiled successfully - Tudo OK
- ⚠ Warning - Avisos (não críticos)
- ✖ Error - Erros que precisam ser corrigidos

### Verificar console do navegador
Abra DevTools (F12) e verifique:
- Console: Erros JavaScript
- Network: Requisições falhando
- Elements: Estilos aplicados

## Suporte

Se o problema persistir:
1. Verifique os logs do servidor no terminal
2. Verifique o console do navegador (F12)
3. Consulte a documentação do Next.js: https://nextjs.org/docs
4. Verifique os arquivos de documentação do projeto:
   - `SUBSCRIPTION_FLOW_IMPLEMENTATION.md`
   - `QUICK_START_GUIDE.md`

## Prevenção

Para evitar problemas:
- ✅ Sempre reinicie o servidor após mudanças significativas
- ✅ Limpe o cache regularmente durante desenvolvimento
- ✅ Mantenha apenas um processo Next.js rodando
- ✅ Use `npm run build` periodicamente para verificar erros
- ✅ Mantenha as dependências atualizadas
