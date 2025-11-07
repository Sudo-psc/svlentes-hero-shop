#!/usr/bin/env node

/**
 * Fix Google OAuth Configuration Script
 *
 * This script helps fix the Google OAuth configuration issues
 * that are causing auth/network-request-failed errors.
 */

require('dotenv').config({ path: '.env.local' });

const { execSync } = require('child_process');
const https = require('https');
const querystring = require('querystring');

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const oauthClientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

console.log('🔧 Google OAuth Fix Tool');
console.log('========================\n');

// Helper function to make HTTP requests
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
    if (options.data) {
      req.write(options.data);
    }
    req.end();
  });
}

// Check if OAuth Client ID exists and is valid
async function checkOAuthClient() {
  console.log('🔍 Verificando OAuth Client ID...');

  if (!oauthClientId) {
    console.log('❌ NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID não encontrado');
    return false;
  }

  console.log(`✅ OAuth Client ID encontrado: ${oauthClientId.substring(0, 20)}...`);

  // Check if client ID format is valid
  const clientIdPattern = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
  if (!clientIdPattern.test(oauthClientId)) {
    console.log('❌ Formato do OAuth Client ID inválido');
    return false;
  }

  console.log('✅ Formato do OAuth Client ID válido');
  return true;
}

// Check Firebase project configuration
async function checkFirebaseConfig() {
  console.log('\n🔍 Verificando configuração Firebase...');

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = requiredFields.filter(field => !firebaseConfig[field]);

  if (missing.length > 0) {
    console.log(`❌ Campos Firebase ausentes: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ Configuração Firebase completa');
  console.log(`   - Project ID: ${firebaseConfig.projectId}`);
  console.log(`   - Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`   - App ID: ${firebaseConfig.appId.substring(0, 20)}...`);

  return true;
}

// Generate OAuth consent screen configuration
function generateOAuthConfig() {
  const domains = [
    'https://svlentes.com.br',
    'https://svlentes.shop',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  const redirectUris = [
    `${firebaseConfig.authDomain}/__/auth/handler`,
    'https://svlentes.com.br',
    'https://svlentes.shop'
  ];

  return {
    application_type: 'web',
    client_name: 'SVLentes Web Application',
    client_uri: 'https://svlentes.com.br',
    policy_uri: 'https://svlentes.com.br/politica-privacidade',
    javascript_origins: domains,
    redirect_uris: redirectUris
  };
}

// Create test HTML files
function createTestFiles() {
  console.log('\n📝 Criando arquivos de teste...');

  // Create OAuth test page
  const oauthTestHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Test - SVLentes</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        button { padding: 10px 20px; margin: 10px 5px; border: none; border-radius: 5px; cursor: pointer; }
        .primary { background-color: #007bff; color: white; }
        .secondary { background-color: #6c757d; color: white; }
        pre { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔧 OAuth Configuration Test - SVLentes</h1>

    <div class="section">
        <h2>📋 Configuração Detectada</h2>
        <pre id="config"></pre>
    </div>

    <div class="section">
        <h2>🧪 Testes de Conexão</h2>
        <button class="primary" onclick="testFirebaseConfig()">Testar Config Firebase</button>
        <button class="primary" onclick="testOAuthEndpoints()">Testar Endpoints OAuth</button>
        <button class="primary" onclick="testGoogleSignIn()">Testar Google Sign-In</button>
        <div id="test-results"></div>
    </div>

    <div class="section">
        <h2>📝 Instruções de Correção</h2>
        <div id="instructions"></div>
    </div>

    <script>
        // Firebase config from page load
        const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
        const oauthClientId = "${oauthClientId || ''}";

        // Display configuration
        document.getElementById('config').textContent = JSON.stringify({
            firebase: firebaseConfig,
            oauthClientId: oauthClientId ? oauthClientId.substring(0, 20) + '...' : 'NOT_FOUND'
        }, null, 2);

        function log(message, type = 'info') {
            const results = document.getElementById('test-results');
            const div = document.createElement('div');
            div.className = \`section \${type}\`;
            div.innerHTML = message;
            results.appendChild(div);
        }

        async function testFirebaseConfig() {
            log('🔍 Testando configuração Firebase...', 'info');

            try {
                // Test Firebase API key validity
                const response = await fetch(\`https://identitytoolkit.googleapis.com/v1/projects/\${firebaseConfig.projectId}/config?key=\${firebaseConfig.apiKey}\`);

                if (response.ok) {
                    log('✅ Configuração Firebase válida', 'success');
                } else {
                    log(\`❌ Configuração Firebase inválida: \${response.status} \${response.statusText}\`, 'error');
                }
            } catch (error) {
                log(\`❌ Erro ao testar Firebase: \${error.message}\`, 'error');
            }
        }

        async function testOAuthEndpoints() {
            log('🔍 Testando endpoints OAuth...', 'info');

            try {
                // Test Google OAuth discovery endpoint
                const discoveryResponse = await fetch('https://accounts.google.com/.well-known/openid_configuration');
                if (discoveryResponse.ok) {
                    log('✅ Endpoint de descoberta OAuth acessível', 'success');
                } else {
                    log('❌ Endpoint de descoberta OAuth inacessível', 'error');
                }

                // Test OAuth client info
                if (oauthClientId) {
                    log(\`✅ OAuth Client ID configurado: \${oauthClientId.substring(0, 20)}...\`, 'success');
                } else {
                    log('❌ OAuth Client ID não configurado', 'error');
                }
            } catch (error) {
                log(\`❌ Erro ao testar endpoints OAuth: \${error.message}\`, 'error');
            }
        }

        function testGoogleSignIn() {
            log('🔍 Iniciando teste de Google Sign-In...', 'info');
            log('⚠️ Este teste requer popup. Permita popups para este site.', 'warning');

            // This would need Firebase SDK to work properly
            log('ℹ️ Implementação completa requer Firebase SDK', 'warning');
        }

        // Generate instructions
        function generateInstructions() {
            const instructions = document.getElementById('instructions');
            instructions.innerHTML = \`
                <h3>🔧 Passos para Corrigir OAuth:</h3>
                <ol>
                    <li><strong>Acesse Google Cloud Console:</strong>
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank">https://console.cloud.google.com/apis/credentials</a>
                    </li>
                    <li><strong>Selecione o projeto:</strong> \${firebaseConfig.projectId}</li>
                    <li><strong>Verifique OAuth Client ID:</strong>
                        <ul>
                            <li>Procure por "OAuth 2.0 Client IDs"</li>
                            <li>Tipo: "Web application"</li>
                            <li>Nome: "SVLentes Web App" ou similar</li>
                        </ul>
                    </li>
                    <li><strong>Se não existir, crie um novo:</strong>
                        <ul>
                            <li>Clique em "+ CREATE CREDENTIALS"</li>
                            <li>Selecione "OAuth client ID"</li>
                            <li>Application type: "Web application"</li>
                            <li>Name: "SVLentes Web App"</li>
                        </ul>
                    </li>
                    <li><strong>Configure Authorized JavaScript origins:</strong>
                        <ul>
                            <li>https://svlentes.com.br</li>
                            <li>https://svlentes.shop</li>
                            <li>http://localhost:3000</li>
                            <li>http://localhost:5000</li>
                        </ul>
                    </li>
                    <li><strong>Configure Authorized redirect URIs:</strong>
                        <ul>
                            <li>\${firebaseConfig.authDomain}/__/auth/handler</li>
                            <li>https://svlentes.com.br</li>
                            <li>https://svlentes.shop</li>
                        </ul>
                    </li>
                    <li><strong>Copie o Client ID:</strong>
                        <ul>
                            <li>Adicione ao .env.local como NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID</li>
                            <li>Exemplo: NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"</li>
                        </ul>
                    </li>
                </ol>

                <h3>🧪 URLs de Teste:</h3>
                <ul>
                    <li><a href="https://svlentes.com.br/test-firebase-auth.html" target="_blank">Teste Firebase Original</a></li>
                    <li><a href="https://console.firebase.google.com/project/\${firebaseConfig.projectId}/authentication/providers" target="_blank">Firebase Console - Authentication</a></li>
                </ul>
            \`;
        }

        // Generate instructions on load
        generateInstructions();
    </script>
</body>
</html>
  `;

  // Write test file
  const fs = require('fs');
  fs.writeFileSync('public/oauth-test.html', oauthTestHTML);
  console.log('✅ Arquivo de teste criado: public/oauth-test.html');

  // Create Firebase v9 compatibility test
  const v9TestHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firebase v9 Test - SVLentes</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        button { padding: 10px 20px; margin: 10px 5px; border: none; border-radius: 5px; cursor: pointer; }
        .primary { background-color: #007bff; color: white; }
        pre { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔥 Firebase v9 Compatibility Test</h1>

    <div class="section">
        <h2>📋 Loading Firebase SDK...</h2>
        <div id="loading">Carregando...</div>
    </div>

    <div class="section">
        <h2>🧪 Firebase Tests</h2>
        <button class="primary" onclick="testFirebaseInit()">Initialize Firebase</button>
        <button class="primary" onclick="testGoogleAuth()">Test Google Auth</button>
        <div id="test-results"></div>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>

    <script>
        const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
        const oauthClientId = "${oauthClientId || ''}";

        function log(message, type = 'info') {
            const results = document.getElementById('test-results');
            const div = document.createElement('div');
            div.className = \`section \${type}\`;
            div.innerHTML = message;
            results.appendChild(div);
        }

        function testFirebaseInit() {
            try {
                firebase.initializeApp(firebaseConfig);
                log('✅ Firebase initialized successfully', 'success');
                log(\`Project: \${firebaseConfig.projectId}\`, 'info');
                log(\`Auth Domain: \${firebaseConfig.authDomain}\`, 'info');
            } catch (error) {
                log(\`❌ Firebase initialization failed: \${error.message}\`, 'error');
            }
        }

        async function testGoogleAuth() {
            if (!firebase.apps.length) {
                log('❌ Initialize Firebase first', 'error');
                return;
            }

            try {
                const auth = firebase.auth();
                const provider = new firebase.auth.GoogleAuthProvider();

                if (oauthClientId) {
                    provider.setCustomParameters({
                        client_id: oauthClientId
                    });
                }

                log('🔍 Attempting Google Sign-In...', 'info');
                log('⚠️ Check browser console for detailed errors', 'warning');

                const result = await auth.signInWithPopup(provider);
                log(\`✅ Sign-in successful: \${result.user.displayName}\`, 'success');
                log(\`Email: \${result.user.email}\`, 'info');
                log(\`UID: \${result.user.uid}\`, 'info');

            } catch (error) {
                log(\`❌ Google Sign-In failed: \${error.code}\`, 'error');
                log(\`Message: \${error.message}\`, 'error');

                if (error.code === 'auth/network-request-failed') {
                    log('🔧 This usually means OAuth Client ID is not configured', 'warning');
                    log('🔧 Check Google Cloud Console OAuth credentials', 'warning');
                }
            }
        }

        // Update loading status
        document.getElementById('loading').innerHTML = \`
            <p>✅ Firebase SDK v9.22.1 loaded</p>
            <p>Project ID: \${firebaseConfig.projectId}</p>
            <p>OAuth Client ID: \${oauthClientId ? oauthClientId.substring(0, 20) + '...' : 'NOT CONFIGURED'}</p>
        \`;
    </script>
</body>
</html>
  `;

  fs.writeFileSync('public/test-firebase-v9.html', v9TestHTML);
  console.log('✅ Arquivo de teste v9 criado: public/test-firebase-v9.html');
}

// Main execution
async function main() {
  console.log('Iniciando diagnóstico e correção OAuth...\n');

  // Check current configuration
  const oauthValid = await checkOAuthClient();
  const firebaseValid = await checkFirebaseConfig();

  if (!oauthValid || !firebaseValid) {
    console.log('\n❌ Problemas encontrados na configuração');
    console.log('\n🔧 Ações corretivas necessárias:');

    if (!oauthClientId) {
      console.log('1. Configure NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID no .env.local');
      console.log('2. Crie OAuth Client ID no Google Cloud Console');
    }

    console.log('\n📋 Configuração OAuth necessária:');
    const config = generateOAuthConfig();
    console.log(JSON.stringify(config, null, 2));

  } else {
    console.log('\n✅ Configuração básica válida');
    console.log('⚠️ Problemas podem estar nas permissões no Google Cloud Console');
  }

  // Create test files
  createTestFiles();

  console.log('\n🌐 URLs de teste criadas:');
  console.log('   - https://svlentes.com.br/oauth-test.html');
  console.log('   - https://svlentes.com.br/test-firebase-v9.html');

  console.log('\n🔗 Links úteis:');
  console.log(`   - Google Cloud Console: https://console.cloud.google.com/apis/credentials`);
  console.log(`   - Firebase Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
  console.log(`   - OAuth Playground: https://developers.google.com/oauthplayground`);

  console.log('\n📝 Próximos passos:');
  console.log('1. Acesse os URLs de teste acima');
  console.log('2. Siga as instruções na página de teste');
  console.log('3. Configure OAuth Client ID no Google Cloud Console se necessário');
  console.log('4. Atualize NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID no .env.local');
  console.log('5. Reinicie o servidor de desenvolvimento');
}

// Run the script
main().catch(console.error);