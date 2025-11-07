#!/usr/bin/env node

/**
 * Firebase Domain Verification Script
 *
 * This script verifies if the current domain is authorized in Firebase
 * and provides instructions for fixing domain authorization issues.
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔍 Firebase Domain Verification');
console.log('===============================\n');

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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Check Firebase project configuration
async function checkFirebaseConfig() {
  console.log('🔍 Verificando configuração Firebase...');

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${firebaseConfig.projectId}/config?key=${firebaseConfig.apiKey}`;
    const response = await makeRequest(url);

    if (response.statusCode === 200) {
      const config = JSON.parse(response.data);
      console.log('✅ Configuração Firebase válida');
      console.log(`   - Project ID: ${config.projectId}`);
      console.log(`   - API Key válida: ${response.statusCode === 200 ? 'Sim' : 'Não'}`);

      // Check if domains are configured
      const domains = config.authorizedDomains || [];
      console.log(`   - Domínios autorizados: ${domains.length} encontrados`);
      domains.forEach(domain => {
        console.log(`     * ${domain}`);
      });

      return { valid: true, domains };
    } else {
      console.log(`❌ Configuração Firebase inválida: HTTP ${response.statusCode}`);
      return { valid: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar Firebase: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// Check if current domains are in authorized list
function checkCurrentDomains(authorizedDomains) {
  console.log('\n🔍 Verificando domínios atuais...');

  const currentDomains = [
    'svlentes.com.br',
    'svlentes.shop',
    'localhost',
    'svlentes.firebaseapp.com'
  ];

  const results = [];
  currentDomains.forEach(domain => {
    const isAuthorized = authorizedDomains.includes(domain);
    results.push({ domain, isAuthorized });
    console.log(`   - ${domain}: ${isAuthorized ? '✅ Autorizado' : '❌ Não autorizado'}`);
  });

  return results;
}

// Generate domain authorization instructions
function generateDomainInstructions(unauthorizedDomains) {
  if (unauthorizedDomains.length === 0) {
    console.log('\n✅ Todos os domínios estão autorizados');
    return;
  }

  console.log('\n🔧 Domínios que precisam ser autorizados:');
  unauthorizedDomains.forEach(({ domain }) => {
    console.log(`   - ${domain}`);
  });

  console.log('\n📝 Para autorizar os domínios:');
  console.log('1. Acesse o Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
  console.log('\n2. Vá para "Configurações" > "Geral"');
  console.log('3. Role até "Seus domínios"');
  console.log('4. Adicione os seguintes domínios:');
  unauthorizedDomains.forEach(({ domain }) => {
    console.log(`   - ${domain}`);
  });
  console.log('\n5. Clique em "Adicionar domínio" para cada um');
  console.log('6. Aguarde a propagação (pode levar alguns minutos)');
}

// Generate OAuth Client ID instructions
function generateOAuthInstructions() {
  console.log('\n🔧 Configuração OAuth Client ID:');
  console.log('1. Acesse o Google Cloud Console:');
  console.log('   https://console.cloud.google.com/apis/credentials');
  console.log(`\n2. Selecione o projeto: ${firebaseConfig.projectId}`);
  console.log('\n3. Verifique ou crie "OAuth 2.0 Client ID":');
  console.log('   - Application type: Web application');
  console.log('   - Name: SVLentes Web App');
  console.log('\n4. Configure "Authorized JavaScript origins":');
  console.log('   - https://svlentes.com.br');
  console.log('   - https://svlentes.shop');
  console.log('   - http://localhost:3000');
  console.log('\n5. Configure "Authorized redirect URIs":');
  console.log(`   - https://${firebaseConfig.authDomain}/__/auth/handler`);
  console.log('   - https://svlentes.com.br');
  console.log('   - https://svlentes.shop');
  console.log('\n6. Copie o Client ID gerado');
  console.log('\n7. Adicione ao .env.local:');
  console.log('   NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="seu-client-id-aqui"');
}

// Create domain verification HTML file
function createDomainVerificationHTML() {
  const fs = require('fs');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Domínios - SVLentes</title>
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
    <h1>🔍 Verificação de Domínios Firebase</h1>

    <div class="section">
        <h2>📋 Configuração Atual</h2>
        <pre id="current-config"></pre>
    </div>

    <div class="section">
        <h2>🧪 Testes de Domínio</h2>
        <button class="primary" onclick="testFirebaseConfig()">Testar Configuração Firebase</button>
        <button class="primary" onclick="testDomainAuth()">Testar Autorização de Domínio</button>
        <div id="test-results"></div>
    </div>

    <div class="section">
        <h2>🔧 Instruções de Correção</h2>
        <div id="instructions"></div>
    </div>

    <script>
        const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

        // Display current configuration
        document.getElementById('current-config').textContent = JSON.stringify({
            project: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain,
            currentDomain: window.location.hostname,
            protocol: window.location.protocol,
            port: window.location.port
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
                const response = await fetch(\`https://identitytoolkit.googleapis.com/v1/projects/\${firebaseConfig.projectId}/config?key=\${firebaseConfig.apiKey}\`);

                if (response.ok) {
                    const config = await response.json();
                    log('✅ Configuração Firebase válida', 'success');
                    log(\`Project ID: \${config.projectId}\`, 'info');

                    const domains = config.authorizedDomains || [];
                    log(\`Domínios autorizados: \${domains.length}\`, 'info');
                    domains.forEach(domain => {
                        log(\`  - \${domain}\`, 'info');
                    });

                    // Check if current domain is authorized
                    const currentDomain = window.location.hostname;
                    const isAuthorized = domains.includes(currentDomain);

                    if (isAuthorized) {
                        log(\`✅ Domínio atual (\${currentDomain}) está autorizado\`, 'success');
                    } else {
                        log(\`❌ Domínio atual (\${currentDomain}) NÃO está autorizado\`, 'error');
                    }

                } else {
                    log(\`❌ Configuração Firebase inválida: \${response.status} \${response.statusText}\`, 'error');
                }
            } catch (error) {
                log(\`❌ Erro ao testar Firebase: \${error.message}\`, 'error');
            }
        }

        async function testDomainAuth() {
            log('🔍 Testando autorização de domínio...', 'info');

            try {
                // Test if we can reach Firebase Auth with current domain
                const authUrl = \`https://identitytoolkit.googleapis.com/v1/projects/\${firebaseConfig.projectId}:lookup?key=\${firebaseConfig.apiKey}\`;

                const testData = {
                    idToken: 'test_token_for_domain_verification'
                };

                const response = await fetch(authUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testData)
                });

                // This will fail with invalid token, but we're checking domain auth
                if (response.status === 400) {
                    const error = await response.json();
                    if (error.error?.message?.includes('DOMAIN_NOT_WHITELISTED')) {
                        log('❌ Domínio não está na lista de permissões', 'error');
                    } else {
                        log('✅ Domínio parece estar autorizado (erro de token é esperado)', 'success');
                    }
                } else {
                    log(\`Resposta inesperada: \${response.status}\`, 'warning');
                }

            } catch (error) {
                log(\`❌ Erro ao testar autorização: \${error.message}\`, 'error');
            }
        }

        // Generate instructions
        function generateInstructions() {
            const instructions = document.getElementById('instructions');
            const currentDomain = window.location.hostname;

            instructions.innerHTML = \`
                <h3>🔧 Se o domínio não estiver autorizado:</h3>
                <ol>
                    <li><strong>Acesse Firebase Console:</strong>
                        <a href="https://console.firebase.google.com/project/\${firebaseConfig.projectId}/authentication/providers" target="_blank">
                            Firebase Authentication
                        </a>
                    </li>
                    <li><strong>Vá para Configurações > Geral</strong></li>
                    <li><strong>Role até "Seus domínios"</strong></li>
                    <li><strong>Adicione os domínios necessários:</strong>
                        <ul>
                            <li>\${currentDomain}</li>
                            <li>svlentes.com.br</li>
                            <li>svlentes.shop</li>
                            <li>localhost (para desenvolvimento)</li>
                        </ul>
                    </li>
                    <li><strong>Clique em "Adicionar domínio"</strong></li>
                    <li><strong>Adicione os registros DNS necessários</strong></li>
                    <li><strong>Aguarde a propagação</strong></li>
                </ol>

                <h3>🔧 Para problemas OAuth:</h3>
                <ol>
                    <li><strong>Acesse Google Cloud Console:</strong>
                        <a href="https://console.cloud.google.com/apis/credentials" target="_blank">
                            APIs & Services > Credentials
                        </a>
                    </li>
                    <li><strong>Verifique OAuth 2.0 Client ID</strong></li>
                    <li><strong>Configure Authorized JavaScript origins:</strong>
                        <ul>
                            <li>https://svlentes.com.br</li>
                            <li>https://svlentes.shop</li>
                            <li>http://localhost:3000</li>
                        </ul>
                    </li>
                </ol>

                <h3>🧪 URLs úteis:</h3>
                <ul>
                    <li><a href="/oauth-test.html" target="_blank">Teste Completo OAuth</a></li>
                    <li><a href="/test-firebase-v9.html" target="_blank">Teste Firebase v9</a></li>
                    <li><a href="https://console.firebase.google.com/project/\${firebaseConfig.projectId}/authentication/providers" target="_blank">
                        Firebase Console
                    </a></li>
                </ul>
            \`;
        }

        // Generate instructions on load
        generateInstructions();
    </script>
</body>
</html>
  `;

  fs.writeFileSync('public/domain-verification.html', html);
  console.log('✅ Arquivo de verificação criado: public/domain-verification.html');
}

// Main execution
async function main() {
  console.log('Iniciando verificação de domínios Firebase...\n');

  // Check Firebase configuration
  const configResult = await checkFirebaseConfig();

  if (configResult.valid) {
    // Check current domains
    const domainResults = checkCurrentDomains(configResult.domains);

    // Find unauthorized domains
    const unauthorizedDomains = domainResults.filter(result => !result.isAuthorized);

    // Generate instructions for unauthorized domains
    generateDomainInstructions(unauthorizedDomains);
  } else {
    console.log('\n❌ Não foi possível verificar a configuração Firebase');
  }

  // Always show OAuth instructions since this is a common issue
  generateOAuthInstructions();

  // Create verification HTML file
  createDomainVerificationHTML();

  console.log('\n🌐 URL de verificação criada:');
  console.log('   - https://svlentes.com.br/domain-verification.html');

  console.log('\n📝 Resumo:');
  console.log('1. Verifique se os domínios estão autorizados no Firebase Console');
  console.log('2. Configure OAuth Client ID no Google Cloud Console');
  console.log('3. Teste usando as páginas de verificação criadas');
  console.log('4. Aguarde a propagação das configurações');
}

// Run the script
main().catch(console.error);