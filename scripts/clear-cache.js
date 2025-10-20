#!/usr/bin/env node

// Script para limpar caches e resolver problemas de imagem
console.log('🧹 Limpando caches...\n')

const fs = require('fs')
const { execSync } = require('child_process')

try {
  // Limpar build do Next.js
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true })
    console.log('✅ .next folder cleared')
  }

  // Limpar cache de imagens
  if (fs.existsSync('.next/cache/images')) {
    fs.rmSync('.next/cache/images', { recursive: true, force: true })
    console.log('✅ Image cache cleared')
  }

  console.log('\n📦 Run "npm run build" to rebuild without cache')
  console.log('💡 Then "systemctl restart svlentes-nextjs" to apply changes')
} catch (error) {
  console.error('❌ Error:', error.message)
}