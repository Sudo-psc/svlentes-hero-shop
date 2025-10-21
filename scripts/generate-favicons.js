#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

const imagePath = path.join(__dirname, '../public/images/favicon-compacted.jpeg');
const publicPath = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('🎨 Gerando favicons profissionais da SV Lentes...\n');

  const imageBuffer = fs.readFileSync(imagePath);

  for (const { size, name } of sizes) {
    try {
      await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(path.join(publicPath, name));

      const stats = fs.statSync(path.join(publicPath, name));
      console.log(`✅ ${name.padEnd(30)} - ${size}x${size}px - ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${name}:`, error.message);
    }
  }

  // Gerar favicon.ico usando a versão 32x32
  try {
    await sharp(imageBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat('png')
      .toFile(path.join(publicPath, 'favicon.ico'));

    const stats = fs.statSync(path.join(publicPath, 'favicon.ico'));
    console.log(`✅ ${'favicon.ico'.padEnd(30)} - 32x32px - ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Erro ao gerar favicon.ico:', error.message);
  }

  console.log('\n✨ Favicons gerados com sucesso!');
  console.log('📊 Total de arquivos: ' + (sizes.length + 1));
}

generateFavicons().catch(console.error);
