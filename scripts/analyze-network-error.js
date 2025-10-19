#!/usr/bin/env node

/**
 * Análise detalhada do erro auth/network-request-failed
 * Considerando que os domínios já estão autorizados
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Análise Avançada - auth/network-request-failed');
console.log('===============================================\n');

// Análise das possíveis causas quando domínios já estão autorizados
const advancedCauses = [
  {
    title: 'CONFIGURAÇÃO OAUTH GOOGLE CLOUD',
    description: 'OAuth 2.0 Client ID pode não estar configurado corretamente',
    probability: 'ALTA',
    solution: [
      '1. Acesse: https://console.cloud.google.com/apis/credentials',
      '2. Procure por "OAuth 2.0 Client ID"',
      '3. Verifique se existe um Client ID para Web application',
      '4. Em "Authorized JavaScript origins", adicione:',
      '   - https://svlentes.com.br',
      '   - https://svlentes.shop',
      '   - http://localhost:3000 (dev)',
      '5. Em "Authorized redirect URIs", adicione:',
      '   - https://svlentes.firebaseapp.com/__/auth/handler',
      '   - https://svlentes.com.br/**'
    ]
  },
  {
    title: 'CONFIGURAÇÃO SHA-1/FINGERPRINT',
    description: 'Pode haver mismatch entre SHA-1 do certificado SSL e o configurado',
    probability: 'MÉDIA',
    solution: [
      '1. Verifique o SHA-1 do certificado atual:',
      '   openssl s_client -connect svlentes.com.br:443 -showcerts 2>/dev/null | openssl x509 -noout -fingerprint -sha1',
      '2. Compare com o configurado no Firebase Console',
      '3. Se necessário, regenere o certificado ou atualize no Firebase'
    ]
  },
  {
    title: 'BLOQUEIO DE REDE/FIREWALL',
    description: 'Requisições para APIs do Google podem estar sendo bloqueadas',
    probability: 'MÉDIA',
    solution: [
      '1. Teste conectividade com as APIs:',
      '   curl -I https://accounts.google.com/o/oauth2/v2/auth',
      '   curl -I https://firebase.googleapis.com',
      '2. Verifique regras de firewall:',
      '   iptables -L | grep google',
      '3. Verifique se há proxy configurado'
    ]
  },
  {
    title: 'CONFIGURAÇÃO DE TEMPO/TIMEOUT',
    description: 'Timeout nas requisições OAuth pode estar muito curto',
    probability: 'BAIXA',
    solution: [
      '1. Aumentar timeout no Firebase Auth config',
      '2. Verificar latência de rede:',
      '   ping accounts.google.com',
      '   traceroute accounts.google.com'
    ]
  },
  {
    title: 'VERSÃO DO FIREBASE WEB SDK',
    description: 'Pode haver incompatibilidade de versão',
    probability: 'BAIXA',
    solution: [
      '1. Verificar versão do Firebase SDK',
      '2. Atualizar para versão mais recente',
      '3. Testar com diferentes versões'
    ]
  }
];

console.log('📋 Análise das causas possíveis (domínios já autorizados):');
advancedCauses.forEach((cause, index) => {
  console.log(`\n${index + 1}. ${cause.title} (${cause.probability})`);
  console.log('─'.repeat(60));
  console.log(`Descrição: ${cause.description}`);
  console.log('\nSolução:');
  cause.solution.forEach(step => console.log(`   ${step}`));
});

// Testes de conectividade
console.log('\n🧪 Executando testes de conectividade...');
const https = require('https');

const tests = [
  { name: 'Google OAuth Endpoint', host: 'accounts.google.com', path: '/o/oauth2/v2/auth' },
  { name: 'Firebase Auth API', host: 'firebase.googleapis.com', path: '/' },
  { name: 'Google Identity Toolkit', host: 'identitytoolkit.googleapis.com', path: '/v1/projects' },
  { name: 'Google APIs', host: 'apis.google.com', path: '/' }
];

tests.forEach((test, index) => {
  const options = {
    hostname: test.host,
    port: 443,
    path: test.path,
    method: 'HEAD',
    timeout: 5000
  };

  const req = https.request(options, (res) => {
    console.log(`✅ ${test.name}: HTTP ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.log(`❌ ${test.name}: ${error.message}`);
  });

  req.on('timeout', () => {
    console.log(`⏰ ${test.name}: Timeout`);
    req.destroy();
  });

  req.end();
});

// Verificar certificado SSL
console.log('\n🔒 Verificando certificado SSL...');
const { execSync } = require('child_process');

try {
  const certInfo = execSync('openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br 2>/dev/null | openssl x509 -noout -dates -subject -issuer', { encoding: 'utf8' });
  console.log('📋 Informações do Certificado:');
  console.log(certInfo.trim());
} catch (error) {
  console.log('❌ Erro ao verificar certificado:', error.message);
}

// Análise do erro específico
console.log('\n🔍 Análise do Erro Específico:');
console.log('================================');
console.log('O erro contém: "SyntaxError: Unexpected token \'O\', \"Offline - \"... is not valid JSON"');
console.log('');
console.log('Isso sugere que:');
console.log('1. A requisição está sendo feita corretamente');
console.log('2. Há um problema na resposta da API do Google');
console.log('3. Pode ser um problema de parsing ou formato de resposta');
console.log('');
console.log('Possíveis causas deste erro específico:');
console.log('- Proxy ou firewall interferindo na resposta');
console.log('- Formato de resposta inesperado da API');
console.log('- Problema de codificação/charset na resposta');

// Recomendações
console.log('\n📋 Próximos Passos Recomendados:');
console.log('==================================');
console.log('1. VERIFICAR OAUTH GOOGLE CLOUD:');
console.log('   - Acessar https://console.cloud.google.com/apis/credentials');
console.log('   - Verificar OAuth 2.0 Client ID');
console.log('   - Configurar Authorized JavaScript origins');
console.log('');
console.log('2. TESTAR SEM FIREWALL/PROXY:');
console.log('   - Tentar de outra rede');
console.log('   - Testar com tethering de celular');
console.log('');
console.log('3. VERIFICAR LOGS DO NAVEGADOR:');
console.log('   - Network tab: Verificar requisições que falham');
console.log('   - Console: Verificar erros CORS ou CSP');
console.log('');
console.log('4. TESTAR COM OUTRO CONTEXTO:');
console.log('   - Modo anônimo do navegador');
console.log('   - Outro navegador');
console.log('   - Incognito window');

console.log('\n🎯 Prioridade de Investigação:');
console.log('1. OAuth Google Cloud (mais provável)');
console.log('2. Firewall/Proxy (segundo mais provável)');
console.log('3. Certificado SSL (menos provável)');
console.log('4. Versão Firebase SDK (raro)');