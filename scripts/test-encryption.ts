/**
 * Script de teste para validar criptografia de dados médicos
 *
 * Uso: npx ts-node scripts/test-encryption.ts
 */

import {
    encrypt,
    decrypt,
    encryptPrescription,
    decryptPrescription,
    checkEncryptionConfig,
    testEncryption,
    generateKey
} from '../src/lib/encryption';

console.log('\n🔐 === TESTE DE CRIPTOGRAFIA DE DADOS MÉDICOS ===\n');

// 1. Verificar configuração
console.log('1️⃣ Verificando configuração...');
const config = checkEncryptionConfig();
console.log('   Configurado:', config.configured ? '✅' : '❌');
console.log('   Tamanho da chave:', config.keyLength, 'caracteres');
console.log('   Ambiente:', config.environment);
if (config.warnings.length > 0) {
    console.log('   ⚠️ Avisos:');
    config.warnings.forEach(warning => console.log('      -', warning));
}
console.log('');

// 2. Testar criptografia básica
console.log('2️⃣ Testando criptografia básica...');
const testResult = testEncryption();
console.log('   Roundtrip test:', testResult ? '✅ Passou' : '❌ Falhou');
console.log('');

// 3. Testar criptografia de prescrição médica
console.log('3️⃣ Testando criptografia de prescrição médica...');
const prescriptionData = {
    type: 'daily',
    brand: 'Acuvue',
    rightEye: {
        sphere: -2.5,
        cylinder: -0.75,
        axis: 180
    },
    leftEye: {
        sphere: -2.0,
        cylinder: -0.50,
        axis: 90
    },
    prescriptionDate: '2024-01-15',
    doctorCRM: 'CRM-MG 69870',
    doctorName: 'Dr. Philipe Saraiva Cruz'
};

console.log('   Dados originais:');
console.log('   ', JSON.stringify(prescriptionData, null, 2).split('\n').join('\n    '));

try {
    const encrypted = encryptPrescription(prescriptionData);
    console.log('\n   ✅ Criptografado com sucesso!');
    console.log('   Tamanho:', encrypted.length, 'caracteres');
    console.log('   Formato:', encrypted.substring(0, 20) + '...');
    console.log('   Começa com "U2FsdGVk"?', encrypted.startsWith('U2FsdGVk') ? '✅' : '❌');

    const decrypted = decryptPrescription(encrypted);
    console.log('\n   ✅ Descriptografado com sucesso!');

    // Comparar dados
    const match = JSON.stringify(prescriptionData) === JSON.stringify(decrypted);
    console.log('   Dados correspondem:', match ? '✅' : '❌');

    if (!match) {
        console.log('\n   ⚠️ Dados descriptografados:');
        console.log('   ', JSON.stringify(decrypted, null, 2).split('\n').join('\n    '));
    }
} catch (error) {
    console.log('   ❌ Erro:', error instanceof Error ? error.message : error);
}
console.log('');

// 4. Testar compatibilidade com dados legados
console.log('4️⃣ Testando compatibilidade com dados legados...');
const legacyDataJson = JSON.stringify({
    type: 'monthly',
    rightEye: { sphere: -1.5 },
    leftEye: { sphere: -1.75 }
});

console.log('   JSON legado:', legacyDataJson);
console.log('   Formato detectado:', legacyDataJson.startsWith('U2FsdGVk') ? 'Criptografado' : 'Legado (não criptografado)');
console.log('');

// 5. Gerar chave para ambiente
console.log('5️⃣ Gerando nova chave de criptografia...');
console.log('   Para usar em produção, adicione ao .env:');
console.log('   ENCRYPTION_KEY="' + generateKey() + '"');
console.log('');

console.log('✅ === TESTE CONCLUÍDO ===\n');
