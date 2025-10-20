import { defineConfig, devices } from '@playwright/test'

/**
 * Configuração do Playwright específica para testes de resiliência
 * Focada em cenários de rede, storage e performance
 */

export default defineConfig({
  testDir: './src/__tests__/integration',

  // Configurações para testes de resiliência exigem mais tempo
  fullyParallel: false, // Executar sequencialmente para evitar interferência
  retries: 2, // Mais retentativas para testes de resiliência
  workers: 1, // Um worker para evitar concorrência em testes de rede/storage

  reporter: [
    ['html', { outputFolder: 'playwright-resilience-report' }],
    ['json', { outputFile: 'playwright-resilience-report/results.json' }],
    ['line'], // Output simples no terminal
    process.env.CI ? ['github'] : ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Configurações específicas para resiliência
    trace: 'retain-on-failure', // Manter trace para análise de falhas
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Timeouts maiores para testes de resiliência
    actionTimeout: 30000, // 30s para ações
    navigationTimeout: 60000, // 1min para navegação

    // Capturar logs de console para debug
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },

  // Projetos para diferentes cenários de resiliência
  projects: [
    {
      name: 'resilience-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Configurações para testes de resiliência
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      testMatch: '**/*.resilience.e2e.test.ts',
    },

    {
      name: 'offline-scenarios',
      use: {
        ...devices['Desktop Chrome'],
        // Começar offline para testes específicos
        offline: true,
        launchOptions: {
          args: [
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--no-first-run'
          ]
        }
      },
      testMatch: '**/offline*.e2e.test.ts',
    },

    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simular condições de rede ruins
        launchOptions: {
          args: [
            '--proxy-server=http://localhost:8080',
            '--disable-web-security',
            '--proxy-bypass-list="<-loopback>"'
          ]
        }
      },
      testMatch: '**/network*.e2e.test.ts',
    },

    {
      name: 'mobile-resilience',
      use: {
        ...devices['Pixel 5'],
        // Configurações mobile para testes de resiliência
        launchOptions: {
          args: [
            '--disable-mobile-emulation',
            '--force-device-scale-factor=1'
          ]
        }
      },
      testMatch: '**/mobile*.e2e.test.ts',
    },

    {
      name: 'memory-constraint',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--memory-pressure-off',
            '--max-old-space-size=256', // Limitar memória
            '--optimize-for-size',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling'
          ]
        }
      },
      testMatch: '**/memory*.e2e.test.ts',
    }
  ],

  // Server setup com mais tempo para estabilização
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutos
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Configurações de timeout específicas para resiliência
  expect: {
    timeout: 15000, // 15s para assertions
  },

  timeout: 120000, // 2 minutos por teste

  // Global setup para preparar ambiente de testes
  globalSetup: require.resolve('./src/__tests__/e2e/resilience-global-setup.ts'),

  // Output específico para resiliência
  outputDir: 'playwright-resilience-report',

  // Metadata para análise
  metadata: {
    'Test Suite': 'Resilience System',
    'Environment': 'Testing',
    'Focus': ['Network', 'Storage', 'Performance', 'Error Recovery'],
    'Critical': true
  },
})