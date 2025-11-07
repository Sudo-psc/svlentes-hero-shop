/**
 * Stripe Integration Test Script
 *
 * Tests the complete Stripe integration:
 * 1. Environment variables
 * 2. API endpoints
 * 3. Pricing page loading
 * 4. Checkout creation
 *
 * Run with: node test-stripe-integration.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Test utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEnvironment() {
  console.log('\n🔍 Testing Environment Variables...');

  const requiredEnvVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const results = {};
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    results[envVar] = {
      present: !!value,
      format: value ?
        (envVar.includes('PUBLISHABLE') ?
          (value.startsWith('pk_') ? '✅ Valid' : '❌ Invalid') :
          (value.startsWith('sk_') ? '✅ Valid' : '❌ Invalid')
        ) : 'N/A'
    };
  }

  console.log('Environment Variables:', JSON.stringify(results, null, 2));
  return Object.values(results).every(r => r.present);
}

async function testAPIEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');

  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/api/health-check`,
      expectedStatus: 200
    },
    {
      name: 'Stripe Products',
      url: `${BASE_URL}/api/stripe/products`,
      expectedStatus: 200
    }
  ];

  const results = {};
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await makeRequest(test.url);

      results[test.name] = {
        status: response.status,
        success: response.status === test.expectedStatus,
        data: test.name.includes('Products') ?
          (response.data.count ? `${response.data.count} products` : 'Invalid response') :
          response.data.status || 'OK'
      };

      console.log(`✅ ${test.name}: ${response.status} - ${results[test.name].data}`);
    } catch (error) {
      results[test.name] = {
        status: 'ERROR',
        success: false,
        error: error.message
      };
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }

  return Object.values(results).every(r => r.success);
}

async function testCheckoutEndpoint() {
  console.log('\n🔍 Testing Checkout Endpoint...');

  try {
    // First get a valid price ID from products API
    console.log('Fetching valid price ID...');
    const productsResponse = await makeRequest(`${BASE_URL}/api/stripe/products`);

    if (!productsResponse.data.products || productsResponse.data.products.length === 0) {
      console.log('❌ No products available for checkout testing');
      return false;
    }

    const firstProduct = productsResponse.data.products[0];
    const priceId = firstProduct.defaultPrice?.id;

    if (!priceId) {
      console.log('❌ No price ID found in products');
      return false;
    }

    console.log(`Using price ID: ${priceId}`);

    // Test checkout creation
    const checkoutData = {
      priceId: priceId,
      customerEmail: 'test@example.com'
    };

    const checkoutResponse = await makeRequest(`${BASE_URL}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    const success = checkoutResponse.status === 200 && checkoutResponse.data.checkoutUrl;

    if (success) {
      console.log(`✅ Checkout created successfully`);
      console.log(`   Checkout URL: ${checkoutResponse.data.checkoutUrl.substring(0, 50)}...`);
    } else {
      console.log(`❌ Checkout creation failed: ${JSON.stringify(checkoutResponse.data)}`);
    }

    return success;

  } catch (error) {
    console.log(`❌ Checkout test error: ${error.message}`);
    return false;
  }
}

async function testPricingPage() {
  console.log('\n🔍 Testing Pricing Page...');

  try {
    const response = await makeRequest(`${BASE_URL}/planos`);

    const success = response.status === 200;
    const hasStripeContent = response.data && response.data.includes('stripe');

    console.log(`✅ Pricing page loads: ${success}`);
    console.log(`   Contains Stripe integration: ${hasStripeContent ? 'Yes' : 'No'}`);

    return success;
  } catch (error) {
    console.log(`❌ Pricing page test error: ${error.message}`);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Stripe Integration Tests...');
  console.log('=====================================');

  const results = {
    environment: await testEnvironment(),
    apiEndpoints: await testAPIEndpoints(),
    checkoutEndpoint: await testCheckoutEndpoint(),
    pricingPage: await testPricingPage()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('=====================================');

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)}`);
  });

  const allPassed = Object.values(results).every(r => r);

  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  if (allPassed) {
    console.log('\n🎉 Stripe integration is working correctly!');
    console.log('   • Environment variables configured');
    console.log('   • API endpoints responding');
    console.log('   • Product catalog loading');
    console.log('   • Checkout creation working');
    console.log('   • Pricing page functional');
  } else {
    console.log('\n⚠️  Some issues found. Please check the failed tests above.');
  }

  return allPassed;
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };