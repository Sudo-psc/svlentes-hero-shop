#!/bin/bash

echo "🧹 Limpeza completa do projeto..."

# Parar processos Next.js
echo "⏹️  Parando processos Next.js..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Aguardar processos terminarem
sleep 2

# Limpar cache e builds
echo "🗑️  Removendo cache e builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# Limpar cache do npm
echo "📦 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

echo "✅ Limpeza concluída!"
echo ""
echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev
