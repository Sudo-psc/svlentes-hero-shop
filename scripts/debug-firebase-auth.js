#!/usr/bin/env node

/**
 * Script para debug da autenticação Google/Firebase
 * Verifica configuração e testa conexão com os serviços do Firebase
 */

// Carregar variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithPopup, GoogleAuthProvider } = require('firebase/auth');

console.log('🔍 Firebase Authentication Debug Tool');
console.log('=====================================\n');

// 1. Verificar variáveis de ambiente
console.log('📋 Verificando variáveis de ambiente:');
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
let configValid = true;

requiredFields.forEach(field => {
  if (firebaseConfig[field]) {
    console.log(`✅ ${field}: ${firebaseConfig[field]}`);
  } else {
    console.log(`❌ ${field}: NÃO DEFINIDO`);
    configValid = false;
  }
});

console.log(`\n🌐 APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NÃO DEFINIDO'}`);

if (!configValid) {
  console.log('\n❌ Configuração Firebase inválida! Verifique as variáveis de ambiente.');
  process.exit(1);
}

// 2. Inicializar Firebase
console.log('\n🔧 Inicializando Firebase...');
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log('✅ Firebase inicializado com sucesso');
  console.log(`📦 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🔗 Auth Domain: ${firebaseConfig.authDomain}`);
} catch (error) {
  console.log('❌ Erro ao inicializar Firebase:', error.message);
  process.exit(1);
}

// 3. Verificar domínios autorizados
console.log('\n🔒 Verificação de domínios autorizados:');
console.log('⚠️  Verifique manualmente no Firebase Console:');
console.log(`   • Firebase Console → Authentication → Settings → Authorized domains`);
console.log(`   • Adicione os domínios:`);
console.log(`     - svlentes.com.br`);
console.log(`     - svlentes.shop`);
console.log(`     - localhost (para desenvolvimento)`);
console.log(`     - 127.0.0.1 (para desenvolvimento)`);

// 4. Diagnóstico do erro auth/network-request-failed
console.log('\n🔍 Diagnóstico do erro auth/network-request-failed:');
console.log('Causas comuns e soluções:');
console.log('');
console.log('1. DOMÍNIOS NÃO AUTORIZADOS:');
console.log('   • Acesse: https://console.firebase.google.com/project/svlentes/authentication/settings');
console.log(`   • Adicione: svlentes.com.br, svlentes.shop, localhost`);
console.log('');
console.log('2. CONFIGURAÇÃO DE REDE:');
console.log('   • Verifique conexão com a internet');
console.log('   • Firewall/proxy bloqueando requisições ao Google');
console.log('   • DNS configurado corretamente');
console.log('');
console.log('3. POPUPS BLOQUEADOS:');
console.log('   • Permita popups no navegador');
console.log('   • Desabilite bloqueadores de anúncios');
console.log('');
console.log('4. CONFIGURAÇÃO HTTPS:');
console.log('   • Em produção, use HTTPS obrigatoriamente');
console.log('   • Firebase Auth não funciona em HTTP com domínios personalizados');

// 5. Testar conectividade com APIs do Google
console.log('\n🌐 Testando conectividade...');
const https = require('https');

const testUrls = [
  { name: 'Firebase Auth API', url: `https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}` },
  { name: 'Google OAuth', url: 'https://accounts.google.com/.well-known/openid_configuration' },
  { name: 'Firebase Config', url: `https://firebase.googleapis.com/v1beta/projects/${firebaseConfig.projectId}` }
];

testUrls.forEach(({ name, url }) => {
  const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
    console.log(`✅ ${name}: ${res.statusCode} - OK`);
  });

  req.on('error', (error) => {
    console.log(`❌ ${name}: ${error.message}`);
  });

  req.on('timeout', () => {
    console.log(`⏰ ${name}: Timeout`);
    req.destroy();
  });

  req.end();
});

console.log('\n📝 Próximos passos:');
console.log('1. Verifique os domínios autorizados no Firebase Console');
console.log('2. Teste a autenticação no navegador');
console.log('3. Verifique o console do navegador para erros detalhados');
console.log('4. Use ferramentas de desenvolvedor para inspecionar requisições de rede');