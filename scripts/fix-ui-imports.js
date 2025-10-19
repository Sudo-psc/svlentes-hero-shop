#!/usr/bin/env node

/**
 * Script para corrigir importações de componentes UI de maiúsculas para minúsculas
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo importações de componentes UI...');

// Mapeamento de componentes para corrigir
const componentMappings = {
  '@/components/ui/Button': '@/components/ui/button',
  '@/components/ui/Input': '@/components/ui/input',
  '@/components/ui/Label': '@/components/ui/label',
  '@/components/ui/Badge': '@/components/ui/badge',
  '@/components/ui/Card': '@/components/ui/card',
  '@/components/ui/Alert': '@/components/ui/alert',
  '@/components/ui/Modal': '@/components/ui/modal',
  '@/components/ui/Select': '@/components/ui/select',
  '@/components/ui/Textarea': '@/components/ui/textarea',
  '@/components/ui/Table': '@/components/ui/table',
  '@/components/ui/Skeleton': '@/components/ui/skeleton',
  '@/components/ui/Progress': '@/components/ui/progress',
  '@/components/ui/Tabs': '@/components/ui/tabs',
  '@/components/ui/Toast': '@/components/ui/toast',
  '@/components/ui/Dialog': '@/components/ui/dialog',
  '@/components/ui/Calendar': '@/components/ui/calendar',
  '@/components/ui/Loader': '@/components/ui/loader',
  '@/components/ui/Icon': '@/components/ui/icon',
  '@/components/ui/Logo': '@/components/ui/logo',
  '@/components/ui/Separator': '@/components/ui/separator',
  '@/components/ui/Switch': '@/components/ui/switch',
  '@/components/ui/Tooltip': '@/components/ui/tooltip',
  '@/components/ui/ScrollArea': '@/components/ui/scroll-area',
  '@/components/ui/DropdownMenu': '@/components/ui/dropdown-menu',
  '@/components/ui/Popover': '@/components/ui/popover',
  '@/components/ui/OptimizedImage': '@/components/ui/optimized-image',
  '@/components/ui/SmoothScroll': '@/components/ui/smooth-scroll',
  '@/components/ui/LazySection': '@/components/ui/lazy-section',
  '@/components/ui/SectionSkeleton': '@/components/ui/section-skeleton',
  '@/components/ui/StripeFallback': '@/components/ui/stripe-fallback'
};

// Encontrar todos os arquivos .tsx que precisam ser corrigidos
function findFilesToFix(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasIncorrectImports = Object.keys(componentMappings).some(pattern =>
          content.includes(pattern)
        );

        if (hasIncorrectImports) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

// Corrigir importações em um arquivo
function fixFileImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [incorrect, correct] of Object.entries(componentMappings)) {
    if (content.includes(incorrect)) {
      content = content.replace(new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
    return true;
  }

  return false;
}

// Função principal
function main() {
  const srcDir = path.join(__dirname, '..', 'src');

  console.log('🔍 Procurando arquivos com importações incorretas...');
  const filesToFix = findFilesToFix(srcDir);

  console.log(`📁 Encontrados ${filesToFix.length} arquivos para corrigir`);

  let fixedCount = 0;
  for (const file of filesToFix) {
    if (fixFileImports(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Concluído! ${fixedCount} arquivos corrigidos de ${filesToFix.length}`);

  if (fixedCount > 0) {
    console.log('\n📋 Importações corrigidas:');
    Object.entries(componentMappings).forEach(([incorrect, correct]) => {
      console.log(`   ${incorrect} → ${correct}`);
    });
  }
}

if (require.main === module) {
  main();
}