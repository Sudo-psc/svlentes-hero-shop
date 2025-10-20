#!/usr/bin/env node

/**
 * 🚀 Quick Win: Script para limpar console logs de produção
 *
 * Remove console.log e console.debug do código de produção
 * Mantém console.error e console.warn para debugging crítico
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 🎯 Alvos de limpeza
const CONSOLE_PATTERNS = [
    // Remover console.log (não seguro para produção)
    {
        pattern: /console\.log\s*\([^)]*\);?/g,
        description: 'console.log statements'
    },
    // Remover console.debug (debug em produção)
    {
        pattern: /console\.debug\s*\([^)]*\);?/g,
        description: 'console.debug statements'
    },
    // Remover console.info (informação detalhada)
    {
        pattern: /console\.info\s*\([^)]*\);?/g,
        description: 'console.info statements'
    }
];

// 🔒 Preservar estes (críticos para debugging)
const PRESERVE_PATTERNS = [
    /console\.error/,  // Error crítico
    /console\.warn/,   // Warnings importantes
];

function shouldPreserve(line) {
    return PRESERVE_PATTERNS.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modifiedContent = content;
        let changesCount = 0;

        const lines = content.split('\n');
        const cleanedLines = lines.map((line, index) => {
            if (shouldPreserve(line)) {
                return line; // Preservar logs críticos
            }

            let newLine = line;
            let lineChanged = false;

            CONSOLE_PATTERNS.forEach(({ pattern, description }) => {
                const originalLine = newLine;
                newLine = newLine.replace(pattern, '');
                if (newLine !== originalLine) {
                    lineChanged = true;
                    changesCount++;
                }
            });

            return newLine;
        });

        const finalContent = cleanedLines.join('\n');

        // Remover linhas vazias deixadas pela limpeza
        const finalCleanedContent = finalContent
            .split('\n')
            .filter(line => line.trim() !== '' || line.includes('//') || line.includes('*'))
            .join('\n');

        if (finalCleanedContent !== content) {
            fs.writeFileSync(filePath, finalCleanedContent);
            console.log(`✅ Cleaned ${filePath} (${changesCount} console statements removed)`);
            return true;
        }

        return false;

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Starting console logs cleanup...\n');

    // Encontrar todos os arquivos TypeScript/JavaScript
    const patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx',
        'app/**/*.ts',
        'app/**/*.tsx',
        'lib/**/*.ts'
    ];

    let totalFilesProcessed = 0;
    let totalFilesCleaned = 0;
    let totalStatementsRemoved = 0;

    patterns.forEach(pattern => {
        const files = glob.sync(pattern);

        files.forEach(filePath => {
            // Ignorar arquivos de teste
            if (filePath.includes('.test.') ||
                filePath.includes('.spec.') ||
                filePath.includes('__tests__/') ||
                filePath.includes('node_modules/')) {
                return;
            }

            totalFilesProcessed++;

            if (cleanFile(filePath)) {
                totalFilesCleaned++;
            }
        });
    });

    console.log('\n📊 Cleanup Summary:');
    console.log(`📁 Files processed: ${totalFilesProcessed}`);
    console.log(`🧹 Files cleaned: ${totalFilesCleaned}`);
    console.log(`🗑️  Console statements removed: ${totalStatementsRemoved}`);
    console.log('\n✅ Quick Win completed! Console logs cleaned for production.');
    console.log('🔒 Preserved: console.error and console.warn for critical debugging');

    if (totalFilesCleaned > 0) {
        console.log('\n🎯 Next steps:');
        console.log('1. Run tests: npm test');
        console.log('2. Build project: npm run build');
        console.log('3. Deploy with confidence! 🚀');
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanFile, main };