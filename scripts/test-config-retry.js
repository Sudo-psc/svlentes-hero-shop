/**
 * Test Script for Configuration API with Retry Logic
 * Tests the configuration endpoints with exponential backoff retry
 */

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://svlentes.com.br'
  : 'http://localhost:3000';

/**
 * Fetch with exponential backoff retry
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Fetching: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ConfigTest/1.0',
          ...options.headers
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Success on attempt ${attempt}`);
      return data;

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // Don't retry on client errors (4xx)
      if (error.message.includes('HTTP 4')) {
        throw error;
      }

      // If not the last attempt, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Test configuration endpoint
 */
async function testConfigEndpoint(path, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('=' .repeat(50));

  const url = `${BASE_URL}${path}`;

  try {
    const result = await fetchWithRetry(url);
    console.log('✅ Response received successfully');
    console.log('📊 Response preview:', JSON.stringify(result, null, 2).substring(0, 300) + '...');

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Configuration API Test Suite');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('⏰ Started at:', new Date().toISOString());

  const tests = [
    {
      path: '/api/config?locale=pt-BR',
      name: 'Main Config Endpoint (Full)'
    },
    {
      path: '/api/config?locale=pt-BR&section=i18n',
      name: 'Config I18n Section'
    },
    {
      path: '/api/config?locale=pt-BR&section=site',
      name: 'Config Site Section'
    },
    {
      path: '/api/config-simple?locale=pt-BR',
      name: 'Simple Config Endpoint (Fallback)'
    },
    {
      path: '/api/config-simple?locale=pt-BR&section=i18n',
      name: 'Simple Config I18n Section'
    }
  ];

  const results = [];

  for (const test of tests) {
    const result = await testConfigEndpoint(test.path, test.name);
    results.push({ ...test, ...result });

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📋 Test Summary');
  console.log('=' .repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n🏁 Test completed at:', new Date().toISOString());

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});