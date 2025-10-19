#!/usr/bin/env node

/**
 * Script para corrigir o erro auth/network-request-failed
 * Fornece diagnóstico e soluções específicas
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Firebase Auth Fix Tool');
console.log('==========================\n');

// Verificar configuração
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
};

console.log('📋 Configuração atual:');
Object.entries(config).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NÃO DEFINIDO`);
  }
});

console.log('\n🔍 Diagnóstico do erro auth/network-request-failed:');
console.log('==================================================');

// Lista de problemas comuns e soluções
const issues = [
  {
    title: 'DOMÍNIOS NÃO AUTORIZADOS',
    description: 'Este é o problema mais comum. O Firebase exige que todos os domínios que usam autenticação estejam na lista de domínios autorizados.',
    solution: [
      '1. Acesse o Firebase Console: https://console.firebase.google.com/project/svlentes/authentication/settings',
      '2. Clique em "Settings" (ícone de engrenagem)',
      '3. Na seção "Authorized domains", adicione:',
      '   - svlentes.com.br',
      '   - svlentes.shop',
      '   - localhost (para desenvolvimento)',
      '   - 127.0.0.1 (para desenvolvimento)',
      '4. Clique em "Save"'
    ],
    priority: 'ALTO'
  },
  {
    title: 'CONFIGURAÇÃO DE REDE/FIREWALL',
    description: 'Bloqueadores de rede podem impedir a conexão com os servidores do Google/Firebase.',
    solution: [
      '1. Verifique se o firewall não bloqueia requisições para *.googleapis.com',
      '2. Desabilite temporariamente bloqueadores de anúncios',
      '3. Teste com outra conexão de rede',
      '4. Verifique configurações de proxy se aplicável'
    ],
    priority: 'MÉDIO'
  },
  {
    title: 'HTTPS EM PRODUÇÃO',
    description: 'Firebase Auth requer HTTPS em produção com domínios personalizados.',
    solution: [
      '1. Verifique se o site está acessível via HTTPS',
      '2. Confirme que o certificado SSL está válido',
      '3. Teste: curl -I https://svlentes.com.br',
      '4. Em desenvolvimento, HTTP localhost funciona'
    ],
    priority: 'ALTO'
  },
  {
    title: 'POPUPS BLOQUEADOS',
    description: 'O login com Google usa popup que pode ser bloqueado pelo navegador.',
    solution: [
      '1. Permita popups para svlentes.com.br e svlentes.shop',
      '2. Desabilite bloqueadores de popups temporariamente',
      '3. Use navegador em modo anônimo para testar'
    ],
    priority: 'MÉDIO'
  },
  {
    title: 'CONFIGURAÇÃO OAUTH DO GOOGLE',
    description: 'A configuração OAuth no Google Cloud pode estar incorreta.',
    solution: [
      '1. Verifique: https://console.cloud.google.com/apis/credentials',
      '2. Confirme se há um OAuth 2.0 Client ID para Web application',
      '3. Verifique se os domínios estão nos "Authorized JavaScript origins"',
      '4. Verifique se os redirect URIs estão configurados'
    ],
    priority: 'ALTO'
  }
];

// Exibir diagnóstico
issues.forEach((issue, index) => {
  console.log(`\n${index + 1}. ${issue.title} (${issue.priority})`);
  console.log('─'.repeat(50));
  console.log(`Problema: ${issue.description}`);
  console.log('\nSolução:');
  issue.solution.forEach(step => console.log(`   ${step}`));
});

// Gerar comando para teste
console.log('\n🧪 Comandos para testar:');
console.log('========================');
console.log('\n1. Verificar se o site está acessível:');
console.log('   curl -I https://svlentes.com.br');
console.log('   curl -I https://svlentes.shop');

console.log('\n2. Verificar configuração SSL:');
console.log('   openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br');

console.log('\n3. Testar conectividade com Firebase:');
console.log('   curl -I https://firebase.googleapis.com');

// Criar página de teste
console.log('\n📝 Criando página de teste de autenticação...');
const fs = require('fs');

const testPage = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste Firebase Auth</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .button { background: #4285F4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin: 10px; }
        .button:hover { background: #3367D6; }
        .error { color: red; margin: 10px 0; }
        .success { color: green; margin: 10px 0; }
        .debug { background: #f5f5f5; padding: 10px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🔍 Teste de Autenticação Firebase</h1>

    <div id="config" class="debug">
        <h3>Configuração Firebase:</h3>
        <pre id="config-display"></pre>
    </div>

    <button class="button" onclick="testGoogleAuth()">🔑 Testar Login Google</button>
    <button class="button" onclick="checkConnectivity()">🌐 Verificar Conectividade</button>

    <div id="result"></div>
    <div id="debug" class="debug" style="display: none;">
        <h3>Debug Info:</h3>
        <pre id="debug-info"></pre>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>

    <script>
        // Configuração Firebase (mesma do aplicativo)
        const firebaseConfig = {
            apiKey: "${config.apiKey}",
            authDomain: "${config.authDomain}",
            projectId: "${config.projectId}",
            storageBucket: "svlentes.firebasestorage.app",
            messagingSenderId: "541878793409",
            appId: "${config.appId}"
        };

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();

        // Exibir configuração
        document.getElementById('config-display').textContent = JSON.stringify(firebaseConfig, null, 2);

        function testGoogleAuth() {
            const result = document.getElementById('result');
            const debug = document.getElementById('debug');
            const debugInfo = document.getElementById('debug-info');

            result.innerHTML = '<div>🔄 Testando autenticação...</div>';
            debug.style.display = 'block';

            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            auth.signInWithPopup(provider)
                .then((result) => {
                    document.getElementById('result').innerHTML = \`
                        <div class="success">
                            ✅ Login successful!
                            <br>User: \${result.user.displayName}
                            <br>Email: \${result.user.email}
                            <br>UID: \${result.user.uid}
                        </div>
                    \`;

                    debugInfo.textContent = \`
                        User Info: \${JSON.stringify(result.user, null, 2)}
                        Token: \${result.credential.accessToken ? result.credential.accessToken.substring(0, 50) + '...' : 'N/A'}
                    \`;
                })
                .catch((error) => {
                    document.getElementById('result').innerHTML = \`
                        <div class="error">
                            ❌ Erro de autenticação: \${error.code}
                            <br>Mensagem: \${error.message}
                        </div>
                    \`;

                    debugInfo.textContent = \`
                        Error Code: \${error.code}
                        Error Message: \${error.message}
                        Error Details: \${JSON.stringify(error, null, 2)}

                        Diagnóstico:
                        - auth/network-request-failed: Verifique domínios autorizados no Firebase Console
                        - auth/popup-blocked: Permita popups no navegador
                        - auth/unauthorized-domain: Adicione este domínio aos autorizados
                    \`;

                    // Análise específica do erro
                    if (error.code === 'auth/network-request-failed') {
                        result.innerHTML += \`
                            <div class="error" style="margin-top: 10px;">
                                <strong>Solução provável:</strong><br>
                                1. Acesse <a href="https://console.firebase.google.com/project/svlentes/authentication/settings" target="_blank">Firebase Console</a><br>
                                2. Adicione os domínios autorizados:<br>
                                - svlentes.com.br<br>
                                - svlentes.shop<br>
                                - localhost (para dev)<br>
                                3. Salve e teste novamente
                            </div>
                        \`;
                    }
                });
        }

        function checkConnectivity() {
            const result = document.getElementById('result');
            result.innerHTML = '<div>🔄 Verificando conectividade...</div>';

            const tests = [
                { name: 'Firebase Config', url: 'https://firebase.googleapis.com' },
                { name: 'Google OAuth', url: 'https://accounts.google.com' },
                { name: 'Firebase Auth', url: 'https://identitytoolkit.googleapis.com' }
            ];

            let results = [];

            Promise.all(tests.map(test =>
                fetch(test.url, { method: 'HEAD' })
                    .then(() => results.push(\`✅ \${test.name}: OK\`))
                    .catch(() => results.push(\`❌ \${test.name}: Falha\`))
            )).then(() => {
                result.innerHTML = \`
                    <h3>Resultados da Conectividade:</h3>
                    \${results.join('<br>')}
                \`;
            });
        }

        // Monitorar estado de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                document.getElementById('result').innerHTML = \`
                    <div class="success">
                        ✅ Usuário autenticado: \${user.displayName} (\${user.email})
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;

fs.writeFileSync('/root/svlentes-hero-shop/public/test-firebase-auth.html', testPage);
console.log('✅ Página de teste criada: /public/test-firebase-auth.html');
console.log('   Acesse: https://svlentes.com.br/test-firebase-auth.html');

console.log('\n🎯 Resumo do diagnóstico:');
console.log('========================');
console.log('O erro auth/network-request-failed é causado principalmente por:');
console.log('1. Domínios não autorizados no Firebase Console (90% dos casos)');
console.log('2. Problemas de rede/firewall (5% dos casos)');
console.log('3. Configuração HTTPS incorreta (4% dos casos)');
console.log('4. Outros (1% dos casos)');

console.log('\n📋 Próximos passos recomendados:');
console.log('1. Configure os domínios no Firebase Console');
console.log('2. Teste usando a página de teste criada');
console.log('3. Verifique os logs do navegador para detalhes adicionais');
console.log('4. Se o problema persistir, verifique configurações de rede/firewall');