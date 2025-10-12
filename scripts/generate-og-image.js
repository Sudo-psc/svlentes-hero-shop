const fs = require('fs');
const path = require('path');

console.log('📸 Gerando imagem OpenGraph otimizada...');

// Verificar se a imagem og-image.jpg já existe
const ogImagePath = path.join(__dirname, '..', 'public', 'images', 'og-image.jpg');
const logoPath = path.join(__dirname, '..', 'public', 'logosv-xl.png');

if (fs.existsSync(ogImagePath)) {
    const stats = fs.statSync(ogImagePath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Imagem OpenGraph já existe:`);
    console.log(`   📍 Localização: public/images/og-image.jpg`);
    console.log(`   📏 Tamanho: ${sizeKB} KB`);
    console.log(`   🔗 URL: https://svlentes.shop/images/og-image.jpg`);

    // Verificar se precisa otimizar (se for muito grande)
    if (stats.size > 500 * 1024) { // > 500KB
        console.log(`\n⚠️  Imagem está grande (${sizeKB} KB)`);
        console.log(`   💡 Recomendação: Otimizar para < 300KB para melhor performance`);
        console.log(`   🔧 Use: https://tinypng.com/ ou https://squoosh.app/`);
    } else {
        console.log(`\n✨ Tamanho otimizado! Perfeito para OpenGraph.`);
    }
} else {
    console.log(`❌ Imagem OpenGraph não encontrada em: ${ogImagePath}`);
    console.log(`\n📝 Para criar uma imagem OpenGraph:`);
    console.log(`   1. Dimensões: 1200x630 pixels`);
    console.log(`   2. Formato: JPG ou PNG`);
    console.log(`   3. Tamanho: < 300KB`);
    console.log(`   4. Conteúdo sugerido:`);
    console.log(`      - Logo SV Lentes`);
    console.log(`      - Título: "Nunca Mais Fique Sem Lentes"`);
    console.log(`      - Subtítulo: "Assinatura com Acompanhamento Médico"`);
    console.log(`      - Dr. Philipe Saraiva Cruz - CRM 69.870`);
}

// Verificar logo
if (fs.existsSync(logoPath)) {
    console.log(`\n✅ Logo encontrado: public/logosv-xl.png`);
} else {
    console.log(`\n⚠️  Logo não encontrado em: ${logoPath}`);
}

// Criar diretório images se não existir
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`\n📁 Diretório criado: public/images/`);
}

console.log(`\n🎨 Informações para design da imagem OpenGraph:`);
console.log(`   🌐 Domínio: svlentes.shop`);
console.log(`   🎨 Cores: #0f4c75 (azul médico), #0284c7 (azul claro)`);
console.log(`   👨‍⚕️ Médico: Dr. Philipe Saraiva Cruz`);
console.log(`   📋 CRM: 69.870 (MG)`);
console.log(`   💰 Destaque: Economia de até 40%`);
console.log(`   📞 WhatsApp: +55 33 99860-1427`);

console.log(`\n✨ Script concluído!`);
