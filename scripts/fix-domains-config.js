#!/usr/bin/env node

/**
 * Fix Domains Configuration Script
 *
 * This script provides specific instructions to fix the domain authorization
 * issues that are causing auth/network-request-failed errors.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Correção de Configuração de Domínios');
console.log('=====================================\n');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const oauthClientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

console.log('📋 Configuração Atual:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   OAuth Client ID: ${oauthClientId ? oauthClientId.substring(0, 30) + '...' : 'Não configurado'}`);

console.log('\n🎯 PROBLEMA IDENTIFICADO:');
console.log('========================');
console.log('❌ Serviços OAuth retornando HTTP 404');
console.log('❌ Isso indica que os domínios não estão autorizados no OAuth Client ID');
console.log('❌ Ou o projeto não está acessível publicamente');

console.log('\n🔧 SOLUÇÃO - CONFIGURAR DOMÍNIOS AUTORIZADOS:');
console.log('===========================================');

console.log('\n📝 PASSO 1: Configurar OAuth Client ID no Google Cloud Console');
console.log('-----------------------------------------------------------');

console.log('\n1. Acesse o Google Cloud Console:');
console.log('   👉 https://console.cloud.google.com/apis/credentials');

console.log(`\n2. Selecione o projeto: ${firebaseConfig.projectId}`);

console.log('\n3. Localize seu OAuth Client ID:');
console.log('   - Procure por "OAuth 2.0 Client IDs"');
console.log(`   - Encontre o Client ID: ${oauthClientId ? oauthClientId.substring(0, 30) + '...' : 'OAuth_CLIENT_ID_AQUI'}`);
console.log('   - Clique no nome do cliente para editar');

console.log('\n4. Configure "Authorized JavaScript origins":');
console.log('   🌐 ADICIONE OBRIGATORIAMENTE:');
console.log('   • https://svlentes.com.br');
console.log('   • https://svlentes.shop');
console.log('   • http://localhost:3000');
console.log('   • http://localhost:5000');

console.log('\n5. Configure "Authorized redirect URIs":');
console.log('   🔄 ADICIONE OBRIGATORIAMENTE:');
console.log(`   • https://${firebaseConfig.authDomain}/__/auth/handler`);
console.log('   • https://svlentes.com.br');
console.log('   • https://svlentes.shop');

console.log('\n6. Salve as alterações');
console.log('   💡 Pode levar alguns minutos para propagar');

console.log('\n📝 PASSO 2: Configurar Domínios no Firebase Console');
console.log('--------------------------------------------------');

console.log('\n1. Acesse o Firebase Console:');
console.log(`   👉 https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);

console.log('\n2. Vá para "Configurações" > "Geral"');
console.log('   (ou Settings > General no menu lateral)');

console.log('\n3. Role até "Seus domínios"');
console.log('   (Your domains section)');

console.log('\n4. Adicione os domínios:');
console.log('   🌐 ADICIONE:');
console.log('   • svlentes.com.br');
console.log('   • svlentes.shop');
console.log('   • localhost (para desenvolvimento)');

console.log('\n5. Siga as instruções para verificação:');
console.log('   - Adicione os registros DNS fornecidos');
console.log('   - Aguarde a verificação (pode levar até 24h)');

console.log('\n📝 PASSO 3: Habilitar Google Authentication');
console.log('-------------------------------------------');

console.log('\n1. No Firebase Console, vá para "Authentication"');
console.log(`   👉 https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication`);

console.log('\n2. Clique em "Sign-in method"');

console.log('\n3. Localize "Google" e clique nele');

console.log('\n4. Habilite o Google provider:');
console.log('   ✅ Ative "Enable"');
console.log('   📧 Adicione seu email de suporte');
console.log('   ✅ Clique em "Save"');

console.log('\n🧪 PASSO 4: Testar a Configuração');
console.log('--------------------------------');

console.log('\n1. Aguarde 5-10 minutos para propagação');

console.log('\n2. Teste com a página de diagnóstico:');
console.log('   👉 https://svlentes.com.br/oauth-test.html');

console.log('\n3. Execute os scripts de verificação:');
console.log('   👉 node scripts/check-oauth-config.js');
console.log('   👉 node scripts/test-oauth-client.js');

console.log('\n4. Teste o login real:');
console.log('   👉 https://svlentes.com.br/area-assinante/login');

console.log('\n🚨 VERIFICAÇÃO IMPORTANTE:');
console.log('=========================');

console.log('\n✅ O que deve funcionar após a configuração:');
console.log('   • HTTP 200 nos endpoints OAuth discovery');
console.log('   • Configuração Firebase acessível via API');
console.log('   • Login com Google sem erros network-request-failed');

console.log('\n❌ O que indica que ainda há problemas:');
console.log('   • HTTP 404 nos endpoints OAuth');
console.log('   • Erro auth/network-request-failed persistindo');
console.log('   - Verifique se os domínios estão exatamente como acima');
console.log('   - Não adicione barras no final (ex: https://svlentes.com.br/)');

console.log('\n🔧 SOLUÇÃO ALTERNATIVA (se acima não funcionar):');
console.log('=================================================');

console.log('\nSe os problemas persistirem, crie um NOVO OAuth Client ID:');

console.log('\n1. No Google Cloud Console > APIs & Services > Credentials:');
console.log('   - Clique em "+ CREATE CREDENTIALS"');
console.log('   - Selecione "OAuth client ID"');
console.log('   - Application type: "Web application"');
console.log('   - Name: "SVLentes Web App (Updated)"');

console.log('\n2. Configure EXATAMENTE:');
console.log('   📍 Authorized JavaScript origins:');
console.log('     https://svlentes.com.br');
console.log('     https://svlentes.shop');
console.log('     http://localhost:3000');
console.log('     http://localhost:5000');

console.log('\n   📍 Authorized redirect URIs:');
console.log(`     https://${firebaseConfig.authDomain}/__/auth/handler`);
console.log('     https://svlentes.com.br');
console.log('     https://svlentes.shop');

console.log('\n3. Copie o NOVO Client ID gerado');
console.log('   📝 Atualize .env.local:');
console.log(`   NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="NOVO_CLIENT_ID_AQUI"`);

console.log('\n4. Remova o Client ID antigo (opcional)');
console.log('   - Clique no Client ID antigo');
console.log('   - Clique em "Delete"');

console.log('\n📋 CHECKLIST FINAL:');
console.log('=================');

const checklist = [
  '☐ Domínios configurados no OAuth Client ID (Google Cloud)',
  '☐ Redirect URIs configuradas no OAuth Client ID',
  '☐ Domínios autorizados no Firebase Console',
  '☐ Google provider habilitado no Firebase Authentication',
  '☐ NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID atualizado se necessário',
  '☐ Aguardar propagação (5-30 minutos)',
  '☐ Testar com oauth-test.html',
  '☐ Testar login real no /area-assinante/login'
];

checklist.forEach(item => console.log(item));

console.log('\n⏰ TEMPO ESPERADO:');
console.log('   • Propagação OAuth: 5-15 minutos');
console.log('   • Propagação Firebase: 1-5 minutos');
console.log('   • Verificação DNS: 5 minutos - 24 horas');

console.log('\n📞 SE PERSISTIR:');
console.log('   • Verifique logs do console do navegador');
console.log('   • Execute os scripts de diagnóstico novamente');
console.log('   • Considere criar novo projeto no Google Cloud');

console.log('\n✅ Após seguir estes passos, o erro auth/network-request-failed será resolvido!');
console.log('\n');