#!/bin/bash

echo "🧹 Limpando cache do Next.js..."
rm -rf .next

echo "🔄 Parando processos Next.js existentes..."
pkill -f "next dev" 2>/dev/null || true

echo "⏳ Aguardando 2 segundos..."
sleep 2

echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev
