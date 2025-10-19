#!/usr/bin/env node

/**
 * Script para verificar e adicionar domínios autorizados no Firebase
 * Este script usa a API REST do Firebase para verificar a configuração
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { readFileSync } = require('fs');

console.log('🔍 Firebase Domains Configuration Check');
console.log('=======================================\n');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!projectId || !serviceAccountKey) {
  console.log('❌ Variáveis de ambiente do Firebase não configuradas');
  process.exit(1);
}

console.log(`📦 Project ID: ${projectId}`);
console.log(`🔧 Service Account: ${serviceAccountKey.client_email}`);

// Obter token de acesso para a API do Firebase
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = require('jsonwebtoken');

    const jwtPayload = {
      iss: serviceAccountKey.client_email,
      scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    };

    const signedJwt = jwt.sign(jwtPayload, serviceAccountKey.private_key, { algorithm: 'RS256' });

    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Access token not found in response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Verificar configuração atual do Firebase Auth
async function checkAuthConfig(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firebase.googleapis.com',
      port: 443,
      path: `/v1beta/projects/${projectId}/config`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Função principal
async function main() {
  try {
    console.log('🔑 Obtendo access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtido');

    console.log('\n🔍 Verificando configuração do Firebase Auth...');
    const config = await checkAuthConfig(accessToken);

    console.log('📋 Configuração atual:');
    console.log(JSON.stringify(config, null, 2));

    // Verificar se há informações de domínios autorizados
    if (config.oauthConfig && config.oauthConfig.authorizedDomains) {
      console.log('\n🔒 Domínios autorizados encontrados:');
      config.oauthConfig.authorizedDomains.forEach(domain => {
        console.log(`   ✅ ${domain}`);
      });
    } else {
      console.log('\n⚠️  Não foi possível verificar domínios autorizados via API');
      console.log('   Verifique manualmente no Firebase Console');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);

    console.log('\n📝 Instruções manuais:');
    console.log('1. Acesse: https://console.firebase.google.com/project/svlentes/authentication/settings');
    console.log('2. Em "Authorized domains", adicione:');
    console.log('   - svlentes.com.br');
    console.log('   - svlentes.shop');
    console.log('   - localhost');
    console.log('   - 127.0.0.1');
    console.log('3. Salve as alterações');
    console.log('4. Limpe o cache do navegador e teste novamente');
  }
}

if (require.main === module) {
  main();
}