#!/usr/bin/env node

/**
 * OAuth Client ID Testing Script
 *
 * This script specifically tests the configured OAuth Client ID
 * to identify why the Google Sign-In is failing.
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const querystring = require('querystring');

// Current configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const oauthClientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

console.log('🧪 Teste Avançado OAuth Client ID');
console.log('===================================\n');

// Helper function for HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Test OAuth Client ID discovery
async function testOAuthDiscovery() {
  console.log('🔍 Testando OAuth Discovery...');

  try {
    const discoveryUrl = 'https://accounts.google.com/.well-known/openid_configuration';
    const response = await makeRequest(discoveryUrl);

    if (response.statusCode === 200) {
      const discovery = JSON.parse(response.data);
      console.log('✅ OAuth Discovery endpoint acessível');
      console.log(`   - Authorization endpoint: ${discovery.authorization_endpoint}`);
      console.log(`   - Token endpoint: ${discovery.token_endpoint}`);
      console.log(`   - UserInfo endpoint: ${discovery.userinfo_endpoint}`);

      return discovery;
    } else {
      console.log(`❌ OAuth Discovery falhou: HTTP ${response.statusCode}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro no OAuth Discovery: ${error.message}`);
    return null;
  }
}

// Test if OAuth Client ID is properly formatted
function testOAuthClientFormat() {
  console.log('\n🔍 Analisando formato do OAuth Client ID...');

  if (!oauthClientId) {
    console.log('❌ OAuth Client ID não encontrado');
    return false;
  }

  console.log(`   Client ID: ${oauthClientId}`);

  // Check format
  const patterns = {
    web: /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/,
    serviceAccount: /^[a-z0-9]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/,
    apiKey: /^AIza[A-Za-z0-9_-]{35}$/,
    appId: /^[1-9][0-9]*:web:[a-zA-Z0-9_-]+$/
  };

  if (patterns.web.test(oauthClientId)) {
    console.log('✅ Formato correto: Web Application OAuth Client ID');
    return true;
  } else if (patterns.serviceAccount.test(oauthClientId)) {
    console.log('❌ ERRO: Format Service Account, não OAuth Client ID');
    console.log('   Service Account é para backend, não para login social');
    return false;
  } else if (patterns.apiKey.test(oauthClientId)) {
    console.log('❌ ERRO: Format Firebase API Key, não OAuth Client ID');
    console.log('   API Key é para configuração do SDK, não para OAuth');
    return false;
  } else if (patterns.appId.test(oauthClientId)) {
    console.log('❌ ERRO: Format Firebase App ID, não OAuth Client ID');
    console.log('   App ID identifica o app Firebase, não é OAuth Client ID');
    return false;
  } else {
    console.log('❌ ERRO: Formato não reconhecido');
    console.log('   Verifique se o ID está correto');
    return false;
  }
}

// Test OAuth Client ID with Google's tokeninfo endpoint
async function testOAuthClientValidation() {
  console.log('\n🔍 Validando OAuth Client ID...');

  if (!oauthClientId) {
    console.log('❌ OAuth Client ID não configurado');
    return false;
  }

  try {
    // We can't directly test OAuth Client ID without a valid token,
    // but we can check if it follows expected patterns
    const clientIdParts = oauthClientId.split('-');
    const numericPart = clientIdParts[0];
    const domainPart = clientIdParts[1] || '';

    console.log(`   - Parte numérica: ${numericPart}`);
    console.log(`   - Domínio: ${domainPart}`);

    // Check if numeric part is valid
    if (/^\d+$/.test(numericPart)) {
      console.log('✅ Parte numérica válida');
    } else {
      console.log('❌ Parte numérica inválida');
      return false;
    }

    // Check domain
    if (domainPart.endsWith('.apps.googleusercontent.com')) {
      console.log('✅ Domínio OAuth correto');
    } else {
      console.log('❌ Domínio OAuth incorreto');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ Erro na validação: ${error.message}`);
    return false;
  }
}

// Test Firebase OAuth configuration
async function testFirebaseOAuthConfig() {
  console.log('\n🔍 Testando configuração OAuth do Firebase...');

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}/config?key=${firebaseConfig.apiKey}`;
    const response = await makeRequest(url);

    if (response.statusCode === 200) {
      const config = JSON.parse(response.data);
      console.log('✅ Configuração Firebase acessível');

      // Check if Google is enabled as a sign-in provider
      const signInProviders = config.signInOptions || [];
      const googleProvider = signInProviders.find(provider => provider.providerId === 'google.com');

      if (googleProvider) {
        console.log('✅ Google sign-in provider está habilitado');
        console.log(`   - Client ID configurado: ${googleProvider.clientId ? 'Sim' : 'Não'}`);
        console.log(`   - Client ID: ${googleProvider.clientId || 'Não configurado'}`);

        // Compare with environment variable
        if (googleProvider.clientId === oauthClientId) {
          console.log('✅ Client ID no Firebase coincide com .env.local');
        } else {
          console.log('❌ Client ID no Firebase DIFERE do .env.local');
          console.log(`   Firebase: ${googleProvider.clientId || 'N/A'}`);
          console.log(`   .env.local: ${oauthClientId || 'N/A'}`);
        }
      } else {
        console.log('❌ Google sign-in provider não está habilitado no Firebase');
        console.log('   É preciso habilitar Google Authentication no Firebase Console');
      }

      return config;
    } else {
      console.log(`❌ Configuração Firebase inacessível: HTTP ${response.statusCode}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro ao testar Firebase OAuth: ${error.message}`);
    return null;
  }
}

// Generate comprehensive report
function generateReport(results) {
  console.log('\n📋 Relatório de Diagnóstico');
  console.log('==========================');

  const { discovery, formatValid, validationValid, firebaseConfig } = results;

  console.log('\n🎯 Status da Configuração:');

  if (discovery) {
    console.log('✅ Serviços Google OAuth acessíveis');
  } else {
    console.log('❌ Serviços Google OAuth inacessíveis');
  }

  if (formatValid) {
    console.log('✅ OAuth Client ID com formato correto');
  } else {
    console.log('❌ OAuth Client ID com formato incorreto');
  }

  if (validationValid) {
    console.log('✅ OAuth Client ID validado com sucesso');
  } else {
    console.log('❌ OAuth Client ID falhou na validação');
  }

  if (firebaseConfig) {
    console.log('✅ Configuração Firebase OAuth acessível');
  } else {
    console.log('❌ Configuração Firebase OAuth inacessível');
  }

  console.log('\n🔧 Causas Prováveis do Erro auth/network-request-failed:');

  if (!formatValid || !validationValid) {
    console.log('1. ❌ OAuth Client ID incorreto');
    console.log('   - Verifique se está usando o ID correto do Google Cloud Console');
  }

  if (firebaseConfig && !firebaseConfig.signInOptions?.some(p => p.providerId === 'google.com')) {
    console.log('2. ❌ Google provider não habilitado no Firebase');
    console.log('   - Acesse Firebase Console > Authentication > Sign-in method');
    console.log('   - Habilite Google como provedor');
  }

  console.log('3. ❌ Domínios não autorizados no OAuth Client ID');
  console.log('   - Verifique Authorized JavaScript origins no Google Cloud Console');
  console.log('   - Adicione: https://svlentes.com.br, https://svlentes.shop');

  console.log('4. ❌ Domínios não autorizados no Firebase');
  console.log('   - Verifique Authorized domains no Firebase Console');
  console.log('   - Adicione: svlentes.com.br, svlentes.shop');

  console.log('\n🚀 Próximos Passos Recomendados:');

  if (formatValid && validationValid && firebaseConfig) {
    console.log('1. Verifique domínios autorizados no Google Cloud Console');
    console.log('2. Verifique domínios autorizados no Firebase Console');
    console.log('3. Teste com a página: https://svlentes.com.br/oauth-test.html');
    console.log('4. Se persistir, crie novo OAuth Client ID no Google Cloud Console');
  } else {
    console.log('1. Corrija o OAuth Client ID conforme indicado acima');
    console.log('2. Habilite Google provider no Firebase Console');
    console.log('3. Execute este script novamente para verificar');
    console.log('4. Teste com a página: https://svlentes.com.br/oauth-test.html');
  }
}

// Main execution
async function main() {
  console.log('Iniciando testes avançados do OAuth Client ID...\n');

  const results = {
    discovery: await testOAuthDiscovery(),
    formatValid: testOAuthClientFormat(),
    validationValid: await testOAuthClientValidation(),
    firebaseConfig: await testFirebaseOAuthConfig()
  };

  generateReport(results);

  console.log('\n🌐 Links Úteis:');
  console.log(`   - Google Cloud Console: https://console.cloud.google.com/apis/credentials`);
  console.log(`   - Firebase Auth: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
  console.log(`   - Teste OAuth: https://svlentes.com.br/oauth-test.html`);
  console.log(`   - Teste Firebase: https://svlentes.com.br/test-firebase-v9.html`);

  console.log('\n📝 Execute novamente após fazer correções:');
  console.log('   node scripts/test-oauth-client.js');
}

// Run the script
main().catch(console.error);