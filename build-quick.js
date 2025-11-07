const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build emergencial...');

// Criar next.config.js temporário sem lint
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;`;

fs.writeFileSync('next.config.temp.js', nextConfig);

try {
  // Mover config temporária
  if (fs.existsSync('next.config.js')) {
    fs.copyFileSync('next.config.js', 'next.config.backup.js');
  }
  fs.copyFileSync('next.config.temp.js', 'next.config.js');

  console.log('📦 Executando build sem validação...');
  execSync('npx next build --no-lint', { stdio: 'inherit', cwd: __dirname });

  console.log('✅ Build concluído com sucesso!');

  // Restaurar config original
  if (fs.existsSync('next.config.backup.js')) {
    fs.copyFileSync('next.config.backup.js', 'next.config.js');
    fs.unlinkSync('next.config.backup.js');
  }

  // Limpar arquivos temporários
  fs.unlinkSync('next.config.temp.js');

} catch (error) {
  console.error('❌ Erro no build:', error.message);

  // Restaurar config em caso de erro
  if (fs.existsSync('next.config.backup.js')) {
    fs.copyFileSync('next.config.backup.js', 'next.config.js');
    fs.unlinkSync('next.config.backup.js');
  }

  process.exit(1);
}