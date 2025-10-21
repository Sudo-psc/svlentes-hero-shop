#!/usr/bin/env node

// Script para deploy de Service Worker corrigido
// Uso: node scripts/fix-service-worker.js

const fs = require('fs')
const path = require('path')

console.log('🔧 Fixing Service Worker configuration...\n')

// 1. Copiar service worker corrigido
const swSource = path.join(__dirname, '../public/sw-fixed.js')
const swTarget = path.join(__dirname, '../public/sw.js')

if (fs.existsSync(swSource)) {
  fs.copyFileSync(swSource, swTarget)
  console.log('✅ Service Worker fixed and deployed')
} else {
  console.error('❌ sw-fixed.js not found')
}

// 2. Adicionar configuração ao next.config.js se necessário
const nextConfigPath = path.join(__dirname, '../next.config.js')
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')

// Verificar se já tem configuração de PWA
if (!nextConfig.includes('pwa:')) {
  console.log('\n⚠️  Consider adding PWA configuration to next.config.js:')
  console.log(`
// Add to next.config.js:
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/_next\/static\/chunks\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-chunks',
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
})

module.exports = withPWA(nextConfig)
`)
}

// 3. Verificar se o sw.js está no lugar certo
if (fs.existsSync(swTarget)) {
  console.log('✅ Service Worker is available at /public/sw.js')
}

// 4. Criar script de register
const registerScript = `
// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)

        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              if (confirm('Nova versão disponível. Atualizar agora?')) {
                window.location.reload()
              }
            }
          })
        })
      })
      .catch(err => {
        console.error('SW registration failed: ', err)
      })
  })
}
`

const registerPath = path.join(__dirname, '../src/lib/sw-register.js')
if (!fs.existsSync(registerPath)) {
  fs.writeFileSync(registerPath, registerScript)
  console.log('✅ Created SW registration script at src/lib/sw-register.js')
}

console.log('\n✨ Service Worker fix complete!')
console.log('\nNext steps:')
console.log('1. Import the registration script in your layout.tsx')
console.log('2. Test the Service Worker in production')
console.log('3. Monitor for chunk loading errors')