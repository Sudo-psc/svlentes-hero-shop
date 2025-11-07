#!/usr/bin/env node

/**
 * Firebase Credentials Analysis Script
 *
 * This script analyzes different types of Firebase credentials and helps identify
 * which one is needed for Google OAuth authentication.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Análise de Credenciais Firebase');
console.log('===================================\n');

// Current environment variables
const currentConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  oauthClientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
};

console.log('📋 Configuração Atual:');
console.log('========================');

// Analyze each credential type
console.log('\n1. Firebase Web App Config:');
console.log(`   ✅ API Key: ${currentConfig.apiKey ? currentConfig.apiKey.substring(0, 20) + '...' : 'NÃO CONFIGURADO'}`);
console.log(`   ✅ Auth Domain: ${currentConfig.authDomain || 'NÃO CONFIGURADO'}`);
console.log(`   ✅ Project ID: ${currentConfig.projectId || 'NÃO CONFIGURADO'}`);
console.log(`   ✅ App ID: ${currentConfig.appId ? currentConfig.appId.substring(0, 20) + '...' : 'NÃO CONFIGURADO'}`);

console.log('\n2. OAuth Client ID (NECESSÁRIO PARA LOGIN SOCIAL):');
if (currentConfig.oauthClientId) {
  console.log(`   ✅ Configurado: ${currentConfig.oauthClientId.substring(0, 30)}...`);

  // Check format
  const oauthPattern = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
  if (oauthPattern.test(currentConfig.oauthClientId)) {
    console.log('   ✅ Formato OAuth Client ID válido');
  } else {
    console.log('   ❌ Formato OAuth Client ID INVÁLIDO');
  }
} else {
  console.log('   ❌ NÃO CONFIGURADO (ESTE É O PROVÁVEL PROBLEMA!)');
}

console.log('\n3. Firebase Admin SDK Service Account:');
if (currentConfig.serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(currentConfig.serviceAccountKey);
    console.log(`   ✅ Configurado: ${serviceAccount.client_email}`);
    console.log(`   ✅ Project ID: ${serviceAccount.project_id}`);
    console.log(`   ✅ Client ID: ${serviceAccount.client_id}`);
    console.log('   ⚠️  NOTA: Esta é SERVICE ACCOUNT KEY (acesso administrativo)');
    console.log('   ⚠️  NOTA: NÃO é OAuth Client ID (login social de usuários)');
  } catch (error) {
    console.log('   ❌ Service Account Key inválida');
  }
} else {
  console.log('   ❌ NÃO CONFIGURADO');
}

console.log('\n🎯 Diferenças Entre Credenciais:');
console.log('=================================');

console.log('\n🔑 Firebase Web App Config (NEXT_PUBLIC_*):');
console.log('   • Uso: Configuração do SDK Firebase no cliente');
console.log('   • Componentes: API Key, Auth Domain, Project ID, App ID');
console.log('   • Acesso: Público, seguro para uso no browser');
console.log('   • Exemplo: AIzaSyD8Xh1t9l5X2Y7W3v0U9I8O7P5N3M1K4Q2');

console.log('\n🔐 OAuth Client ID (NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID):');
console.log('   • Uso: Login social com Google (popup/redirect)');
console.log('   • Formato: 123456789-abcdef123456.apps.googleusercontent.com');
console.log('   • Onde obter: Google Cloud Console > APIs & Services > Credentials');
console.log('   • Acesso: Público, mas específico para OAuth');
console.log('   • CRÍTICO PARA: Login com Google, Facebook, GitHub');

console.log('\n🛠️ Firebase Admin SDK Service Account:');
console.log('   • Uso: Acesso administrativo do Firebase');
console.log('   • Componentes: Private key, client_email, etc.');
console.log('   • Acesso: Privado, SOMENTE servidor');
console.log('   • NUNCA expor no cliente (browser)');
console.log('   • Uso: APIs de backend, webhooks, administração');

console.log('\n🔍 Diagnóstico do Problema Atual:');
console.log('=================================');

if (!currentConfig.oauthClientId) {
  console.log('❌ PROBLEMA IDENTIFICADO:');
  console.log('   NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID não está configurado');
  console.log('   Esta é a causa do erro: auth/network-request-failed');
} else {
  const oauthPattern = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
  if (!oauthPattern.test(currentConfig.oauthClientId)) {
    console.log('❌ PROBLEMA IDENTIFICADO:');
    console.log('   NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID tem formato inválido');
    console.log('   Pode estar usando Service Account ID em vez de OAuth Client ID');
  } else {
    console.log('✅ OAuth Client ID parece configurado corretamente');
    console.log('   O problema pode ser outro (domínios não autorizados, etc.)');
  }
}

console.log('\n🔧 Solução Recomendada:');
console.log('======================');

console.log('\n1. Acesse Google Cloud Console:');
console.log('   https://console.cloud.google.com/apis/credentials');

console.log(`\n2. Selecione projeto: ${currentConfig.projectId || 'svlentes'}`);

console.log('\n3. Crie novo OAuth 2.0 Client ID:');
console.log('   a. Clique em "+ CREATE CREDENTIALS"');
console.log('   b. Selecione "OAuth client ID"');
console.log('   c. Application type: "Web application"');
console.log('   d. Name: "SVLentes Web App"');

console.log('\n4. Configure Authorized JavaScript origins:');
console.log('   • https://svlentes.com.br');
console.log('   • https://svlentes.shop');
console.log('   • http://localhost:3000');

console.log('\n5. Configure Authorized redirect URIs:');
console.log(`   • https://${currentConfig.authDomain}/__/auth/handler`);

console.log('\n6. Copie o Client ID gerado');
console.log('   Formato esperado: 123456789-abcdef123456.apps.googleusercontent.com');

console.log('\n7. Adicione ao .env.local:');
console.log('   NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="cole-o-client-id-aqui"');

console.log('\n🚨 NÃO CONFUNDA COM:');
console.log('   ❌ Service Account Key (chave privada para backend)');
console.log('   ❌ Firebase API Key (configuração do SDK)');
console.log('   ❌ Web App ID (identificação do app Firebase)');

console.log('\n📝 Resumo dos Diferentes IDs:');
console.log('============================');

if (currentConfig.apiKey) {
  console.log(`📱 Firebase API Key: ${currentConfig.apiKey.substring(0, 20)}...`);
}
if (currentConfig.appId) {
  console.log(`📱 Firebase App ID: ${currentConfig.appId.substring(0, 20)}...`);
}
if (currentConfig.oauthClientId) {
  console.log(`🔐 OAuth Client ID: ${currentConfig.oauthClientId.substring(0, 30)}...`);
}
if (currentConfig.serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(currentConfig.serviceAccountKey);
    console.log(`🛠️  Service Account: ${serviceAccount.client_email}`);
    console.log(`🛠️  Service Account ID: ${serviceAccount.client_id}`);
  } catch (error) {
    console.log('🛠️  Service Account: Inválido');
  }
}

console.log('\n✅ O que você precisa é OAUTH CLIENT ID, não Service Account!');
console.log('\n🧪 Execute estes testes após configurar:');
console.log('   node scripts/check-oauth-config.js');
console.log('   node scripts/verify-firebase-domains.js');
console.log('   # Acesse: https://svlentes.com.br/oauth-test.html');

console.log('\n');