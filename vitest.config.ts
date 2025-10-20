import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Limiares mais altos para código crítico de resiliência
        './src/lib/resilient-data-fetcher.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        './src/lib/offline-storage.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        './src/hooks/useResilientSubscription.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        './src/lib/backup-auth.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    // Configuração para testes de performance
    hookTimeout: 30000,
    testTimeout: 15000,
    // Include files
    include: ['src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Exclude files
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  // Otimizações para testes de resiliência
  define: {
    // Desabilitar modo desenvolvimento para testes mais realistas
    'process.env.NODE_ENV': '"test"',
    // Habilitar logs detalhados para debug em testes
    'process.env.DEBUG_TESTS': '"true"'
  },
  // Configuração para suporte a módulos CSS
  css: {
    modules: {
      classNameStrategy: 'stable'
    }
  }
})