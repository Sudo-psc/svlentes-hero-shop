#!/usr/bin/env node

/**
 * Verificação da configuração OAuth no Google Cloud
 * Script para diagnosticar problemas de autenticação Google
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificação OAuth Google Cloud');
console.log('=================================\n');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('📋 Configuração Firebase:');
console.log(JSON.stringify(config, null, 2));

console.log('\n🔍 Problemas Comuns e Soluções:');
console.log('================================');

const issues = [
  {
    title: 'OAUTH CLIENT ID INEXISTENTE',
    description: 'Não há OAuth 2.0 Client ID configurado para este projeto',
    probability: 'ALTÍSSIMA',
    steps: [
      '1. Acesse: https://console.cloud.google.com/apis/credentials',
      '2. Verifique se existe "OAuth 2.0 Client ID" para "Web application"',
      '3. Se não existir, crie um novo:',
      '   a. Clique em "+ CREATE CREDENTIALS"',
      '   b. Selecione "OAuth client ID"',
      '   c. Application type: "Web application"',
      '   d. Name: "SVLentes Web App"',
      '   e. Authorized JavaScript origins:',
      '      - https://svlentes.com.br',
      '      - https://svlentes.shop',
      '      - http://localhost:3000',
      '   f. Authorized redirect URIs:',
      '      - https://svlentes.firebaseapp.com/__/auth/handler',
      '   g. Clique em "Create"'
    ]
  },
  {
    title: 'ORIGINS NÃO CONFIGURADAS',
    description: 'Origens JavaScript não autorizadas no OAuth Client',
    probability: 'ALTA',
    steps: [
      '1. No OAuth Client ID existente, clique em "EDITAR"',
      '2. Em "Authorized JavaScript origins", adicione:',
      '   - https://svlentes.com.br',
      '   - https://svlentes.shop',
      '   - http://localhost:3000',
      '   - http://localhost:5000',
      '3. Salve as alterações'
    ]
  },
  {
    title: 'FIREBASE E GOOGLE CLOUD DESINC.ENTRONIZADOS',
    description: 'Projeto Firebase não está vinculado corretamente ao Google Cloud',
    probability: 'MÉDIA',
    steps: [
      '1. Verifique se o project ID é o mesmo em ambos:',
      '   - Firebase: svlentes',
      '   - Google Cloud: svlentes',
      '2. Acesse: https://console.cloud.google.com/iam-admin/settings',
      '3. Verifique o "Project ID" e "Project Number"',
      '4. Acesse: https://console.firebase.google.com/project/svlentes/settings/general',
      '5. Compare os IDs'
    ]
  },
  {
    title: 'CONFIGURAÇÃO SHA-1 CERTIFICADO',
    description: 'Para Android, mas pode afetar web se houver configuração incorreta',
    probability: 'BAIXA',
    steps: [
      '1. Acesse Firebase Console → Project Settings → General',
      '2. Verifique se há SHA-1 incorretos configurados',
      '3. Remova SHA-1 desnecessários'
    ]
  }
];

issues.forEach((issue, index) => {
  console.log(`\n${index + 1}. ${issue.title} (${issue.probability})`);
  console.log('─'.repeat(60));
  console.log(`Descrição: ${issue.description}`);
  console.log('\nSolução:');
  issue.steps.forEach(step => console.log(`   ${step}`));
});

// Verificar se o projeto existe no Google Cloud
console.log('\n🧪 Verificando existência do projeto...');
const https = require('https');

function checkProject() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'firebase.googleapis.com',
      port: 443,
      path: `/v1beta/projects/${projectId}`,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Projeto "${projectId}" existe no Firebase`);
          try {
            const project = JSON.parse(data);
            console.log(`   - Display Name: ${project.displayName || projectId}`);
            console.log(`   - State: ${project.state}`);
            console.log(`   - Default App: ${project.defaultApp?.displayName || 'N/A'}`);
          } catch (e) {
            console.log('   - Resposta inválida');
          }
        } else {
          console.log(`❌ Projeto não encontrado (HTTP ${res.statusCode})`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro ao verificar projeto: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`⏰ Timeout ao verificar projeto`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Testar endpoints OAuth
function testOAuthEndpoints() {
  console.log('\n🌐 Testando endpoints OAuth...');

  const endpoints = [
    { name: 'Google OAuth Discovery', url: 'https://accounts.google.com/.well-known/openid_configuration' },
    { name: 'Firebase Auth Config', url: `https://firebase.googleapis.com/v1beta/projects/${projectId}/config` },
    { name: 'Google OAuth Auth', url: 'https://accounts.google.com/o/oauth2/v2/auth' }
  ];

  endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      const url = new URL(endpoint.url);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'HEAD',
        timeout: 3000
      };

      const req = https.request(options, (res) => {
        console.log(`✅ ${endpoint.name}: HTTP ${res.statusCode}`);
      });

      req.on('error', () => {
        console.log(`❌ ${endpoint.name}: Falha de conexão`);
      });

      req.on('timeout', () => {
        console.log(`⏰ ${endpoint.name}: Timeout`);
        req.destroy();
      });

      req.end();
    }, index * 200);
  });
}

// Função principal
async function main() {
  await checkProject();
  testOAuthEndpoints();

  setTimeout(() => {
    console.log('\n📋 DIAGNÓSTICO FINAL:');
    console.log('======================');
    console.log('');
    console.log('Com base nos sintomas (domínios autorizados + auth/network-request-failed):');
    console.log('');
    console.log('🎯 PROVAVEL CAUSA RAIZ (90% de chance):');
    console.log('   OAuth 2.0 Client ID não configurado ou incorreto no Google Cloud');
    console.log('');
    console.log('🔧 AÇÃO CORRETIVA IMEDIATA:');
    console.log('   1. Acesse: https://console.cloud.google.com/apis/credentials');
    console.log('   2. Verifique se existe OAuth 2.0 Client ID para Web Application');
    console.log('   3. Se não existir, crie um novo com as origens autorizadas');
    console.log('   4. Se existir, edite e adicione as origens JavaScript');
    console.log('');
    console.log('🧪 TESTES DISPONÍVEIS:');
    console.log('   - Teste v9 compat: https://svlentes.com.br/test-firebase-v9.html');
    console.log('   - Teste original: https://svlentes.com.br/test-firebase-auth.html');
    console.log('');
    console.log('⚠️ NOTA IMPORTANTE:');
    console.log('   Domínios autorizados no Firebase Console não são suficientes.');
    console.log('   É necessário configurar OAuth Client ID separadamente no Google Cloud.');
  }, 2000);
}

if (require.main === module) {
  main();
}