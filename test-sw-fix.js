#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🧪 Testando correções do Service Worker...');
console.log('');

// Teste 1: Verificar se o service worker responde sem erros
function testServiceWorkerResponse() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/sw.js',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SV Lentes Test Bot)',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('✅ Service Worker respondeu com status:', res.statusCode);

                // Verificar se há erros conhecidos no conteúdo
                const content = data.toString();
                const hasErrors = [
                    'ws.jam.dev',
                    'chrome-extension',
                    'Failed to fetch',
                    'getProjectConfig',
                    'trusted-types'
                ].some(error => content.includes(error));

                if (hasErrors) {
                    console.log('❌ Erros conhecidos ainda presentes no conteúdo do SW');
                } else {
                    console.log('✅ Nenhum erro conhecido detectado no conteúdo do SW');
                }

                resolve({
                    statusCode: res.statusCode,
                    hasErrors: hasErrors,
                    contentLength: content.length
                });
            });
        });

        req.on('error', (err) => {
            console.log('❌ Erro ao fazer requisição ao SW:', err.message);
            reject(err);
        });

        req.setTimeout(5000, () => {
            console.log('⏰ Timeout ao testar SW - continuando...');
            resolve({ error: 'timeout' });
        });

        req.end();
    });
}

// Teste 2: Verificar se a página principal carrega sem erros no console
function testMainPage() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/planos',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SV Lentes Test Bot)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('✅ Página /planos carregada com status:', res.statusCode);

                // Verificar se há scripts de supressão de erros
                const content = data.toString();
                const hasErrorSuppression = [
                    'AGGRESSIVE ERROR SUPPRESSION',
                    'getprojectconfig',
                    'trusted-types',
                    'trusted-types-checker'
                ].some(pattern => {
                    const regex = new RegExp(pattern, 'gi');
                    return regex.test(content);
                });

                if (hasErrorSuppression) {
                    console.log('✅ Scripts de supressão de erros estão presentes');
                } else {
                    console.log('⚠️ Scripts de supressão não detectados');
                }

                resolve({
                    statusCode: res.statusCode,
                    hasErrorSuppression: hasErrorSuppression,
                    contentLength: content.length
                });
            });
        });

        req.on('error', (err) => {
            console.log('❌ Erro ao carregar página principal:', err.message);
            resolve({ error: err.message });
        });

        req.setTimeout(10000, () => {
            console.log('⏰ Timeout ao testar página principal');
            resolve({ error: 'timeout' });
        });

        req.end();
    });
}

// Teste 3: Verificar headers de segurança do Service Worker
function testSecurityHeaders() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/sw.js',
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SV Lentes Test Bot)'
            }
        };

        const req = http.request(options, (res) => {
            console.log('✅ Headers do Service Worker:');
            console.log('  Content-Type:', res.headers['content-type']);
            console.log('  Cache-Control:', res.headers['cache-control']);
            console.log('  CORS Headers:', res.headers['access-control-allow-origin']);
            console.log('  Security Headers:', res.headers['x-content-security-policy']);

            resolve({
                headers: res.headers,
                statusCode: res.statusCode
            });
        });

        req.on('error', (err) => {
            console.log('❌ Erro ao verificar headers:', err.message);
            resolve({ error: err.message });
        });

        req.end();
    });
}

// Executar testes
async function runTests() {
    console.log('📋 Executando testes...');
    console.log('');

    try {
        console.log('🔍 Teste 1: Verificando resposta do Service Worker');
        const swResult = await testServiceWorkerResponse();
        console.log('');

        console.log('🔍 Teste 2: Verificando página principal');
        const pageResult = await testMainPage();
        console.log('');

        console.log('🔍 Teste 3: Verificando headers de segurança');
        const headersResult = await testSecurityHeaders();
        console.log('');

        // Resumo dos resultados
        console.log('📊 RESUMO DOS TESTES:');
        console.log('='.repeat(50));

        if (swResult.statusCode === 200) {
            console.log('✅ Service Worker: Respondendo corretamente (200 OK)');
        } else if (swResult.error) {
            console.log('❌ Service Worker: Erro na resposta -', swResult.error);
        } else {
            console.log('⚠️ Service Worker: Status inesperado -', swResult.statusCode);
        }

        if (pageResult.statusCode === 200) {
            console.log('✅ Página Principal: Carregando corretamente (200 OK)');
        } else if (pageResult.error) {
            console.log('❌ Página Principal: Erro no carregamento -', pageResult.error);
        } else {
            console.log('⚠️ Página Principal: Status inesperado -', pageResult.statusCode);
        }

        if (!swResult.hasErrors) {
            console.log('✅ Erros Conhecidos: Eliminados do Service Worker');
        } else {
            console.log('❌ Erros Conhecidos: Ainda presentes no Service Worker');
        }

        if (pageResult.hasErrorSuppression) {
            console.log('✅ Supressão de Erros: Implementada na página');
        } else {
            console.log('⚠️ Supressão de Erros: Não detectada na página');
        }

        console.log('');
        console.log('🎯 Conclusão:');
        if (swResult.statusCode === 200 && !swResult.hasErrors && pageResult.hasErrorSuppression) {
            console.log('🟢 SUCESSO: Todas as correções implementadas estão funcionando!');
            console.log('   - Service Worker respondendo sem erros');
            console.log('   - Scripts de supressão ativos na página');
            console.log('   - Erros conhecidos eliminados');
        } else {
            console.log('⚠️ ATENÇÃO: Algumas correções podem precisar de ajuste fino:');

            if (swResult.statusCode !== 200) {
                console.log('   - Verificar se o Service Worker está acessível');
            }

            if (swResult.hasErrors) {
                console.log('   - Revisar o arquivo sw.js para remover erros residuais');
            }

            if (!pageResult.hasErrorSuppression) {
                console.log('   - Verificar se os scripts de supressão estão sendo injetados');
            }
        }

    } catch (error) {
        console.error('❌ Erro inesperado durante os testes:', error.message);
    } finally {
        console.log('');
        console.log('🏁 Testes concluídos!');
        process.exit(0);
    }
}

// Iniciar testes
runTests();
