#!/usr/bin/env node
/**
 * Manual CSP Configuration Validation Script
 * 
 * This script validates the Stripe CSP/CORS configuration
 * without requiring a full test environment.
 * 
 * SECURITY NOTE: CodeQL alerts about "incomplete-url-substring-sanitization"
 * are false positives. This is a build-time validation script that checks
 * static configuration files, not a runtime URL sanitizer. The indexOf()
 * checks validate that exact domain strings exist in config files.
 * 
 * Run with: node scripts/validate-csp-config.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔍 Validating Stripe CSP/CORS Configuration...\n');

let errors = 0;
let warnings = 0;
let checks = 0;

function check(name, condition, message) {
  checks++;
  if (condition) {
    console.log(`✅ ${name}`);
    return true;
  } else {
    errors++;
    console.log(`❌ ${name}: ${message}`);
    return false;
  }
}

function warn(name, condition, message) {
  checks++;
  if (condition) {
    console.log(`✅ ${name}`);
    return true;
  } else {
    warnings++;
    console.log(`⚠️  ${name}: ${message}`);
    return false;
  }
}

// Check 1: Middleware file exists
console.log('📋 Checking Middleware Configuration...');
const middlewarePath = path.join(__dirname, '../middleware.js');
check(
  'Middleware file exists',
  fs.existsSync(middlewarePath),
  'middleware.js not found'
);

if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  
  check(
    'Middleware imports crypto',
    middlewareContent.includes("import crypto from 'crypto'") || 
    middlewareContent.includes('require("crypto")'),
    'crypto module not imported'
  );
  
  check(
    'Middleware generates nonce',
    middlewareContent.includes('crypto.randomBytes(16)'),
    'nonce generation not found'
  );
  
  check(
    'Middleware sets x-csp-nonce header',
    middlewareContent.includes("'x-csp-nonce'") || 
    middlewareContent.includes('"x-csp-nonce"'),
    'x-csp-nonce header not set'
  );
  
  check(
    'Middleware sets CSP header',
    middlewareContent.includes('Content-Security-Policy'),
    'CSP header not found'
  );
  
  // Validate Stripe domains in CSP using exact domain matching
  const stripeScriptDomain = 'https://js.stripe.com';
  const stripeCheckoutDomain = 'https://checkout.stripe.com';
  const stripeApiDomain = 'https://api.stripe.com';
  
  check(
    'CSP includes Stripe script domain',
    middlewareContent.indexOf(stripeScriptDomain) !== -1,
    'Stripe script domain not in CSP'
  );
  
  check(
    'CSP includes Stripe checkout domain',
    middlewareContent.indexOf(stripeCheckoutDomain) !== -1,
    'Stripe checkout domain not in CSP'
  );
  
  check(
    'CSP includes Stripe API domain',
    middlewareContent.indexOf(stripeApiDomain) !== -1,
    'Stripe API domain not in CSP'
  );
  
  check(
    'CSP includes nonce in script-src',
    middlewareContent.includes("'nonce-${nonce}'") || 
    middlewareContent.includes('"nonce-${nonce}"'),
    'nonce placeholder not in script-src'
  );
}

// Check 2: Nginx configuration
console.log('\n📋 Checking Nginx Configuration...');
const nginxPath = path.join(__dirname, '../nginx/production.conf');
check(
  'Nginx config file exists',
  fs.existsSync(nginxPath),
  'nginx/production.conf not found'
);

if (fs.existsSync(nginxPath)) {
  const nginxContent = fs.readFileSync(nginxPath, 'utf-8');
  
  check(
    'Nginx has CSP header',
    nginxContent.includes('Content-Security-Policy'),
    'CSP header not found in nginx config'
  );
  
  // Validate Stripe domains in nginx CSP using exact domain matching
  const nginxStripeScript = 'https://js.stripe.com';
  const nginxStripeCheckout = 'https://checkout.stripe.com';
  const nginxStripeImages = 'https://*.stripe.com';
  
  check(
    'Nginx CSP includes Stripe domains',
    nginxContent.indexOf(nginxStripeScript) !== -1 &&
    nginxContent.indexOf(nginxStripeCheckout) !== -1,
    'Stripe domains not in nginx CSP'
  );
  
  check(
    'Nginx CSP includes Stripe image domain wildcard',
    nginxContent.indexOf(nginxStripeImages) !== -1,
    'Stripe image wildcard not in nginx CSP'
  );
}

// Check 3: Environment variables
console.log('\n📋 Checking Environment Variables...');
const envExamplePath = path.join(__dirname, '../.env.example');
check(
  '.env.example file exists',
  fs.existsSync(envExamplePath),
  '.env.example not found'
);

if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf-8');
  
  check(
    'STRIPE_SECRET_KEY defined',
    envContent.includes('STRIPE_SECRET_KEY='),
    'STRIPE_SECRET_KEY not in .env.example'
  );
  
  check(
    'STRIPE_WEBHOOK_SECRET defined',
    envContent.includes('STRIPE_WEBHOOK_SECRET='),
    'STRIPE_WEBHOOK_SECRET not in .env.example'
  );
  
  check(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY defined',
    envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='),
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not in .env.example'
  );
  
  check(
    'NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID defined',
    envContent.includes('NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID='),
    'NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID not in .env.example'
  );
}

// Check 4: CSP nonce utility
console.log('\n📋 Checking CSP Nonce Utility...');
const cspNoncePath = path.join(__dirname, '../src/lib/csp-nonce.ts');
check(
  'CSP nonce utility exists',
  fs.existsSync(cspNoncePath),
  'src/lib/csp-nonce.ts not found'
);

if (fs.existsSync(cspNoncePath)) {
  const cspNonceContent = fs.readFileSync(cspNoncePath, 'utf-8');
  
  check(
    'getNonce() function defined',
    cspNonceContent.includes('export function getNonce()'),
    'getNonce() function not found'
  );
  
  check(
    'getNonce() uses headers()',
    cspNonceContent.includes("headers()"),
    'getNonce() does not use headers()'
  );
  
  check(
    'getNonce() reads x-csp-nonce header',
    cspNonceContent.includes("'x-csp-nonce'") || 
    cspNonceContent.includes('"x-csp-nonce"'),
    'getNonce() does not read x-csp-nonce header'
  );
}

// Check 5: Documentation
console.log('\n📋 Checking Documentation...');
const docs = [
  'docs/stripe-csp-cors-configuration.md',
  'docs/stripe-deployment-checklist.md',
  'docs/stripe-integration-overview.md'
];

docs.forEach(docPath => {
  const fullPath = path.join(__dirname, '..', docPath);
  check(
    `Documentation: ${path.basename(docPath)}`,
    fs.existsSync(fullPath),
    `${docPath} not found`
  );
});

// Check 6: Test nonce generation
console.log('\n📋 Testing Nonce Generation...');
try {
  const nonce1 = crypto.randomBytes(16).toString('base64');
  const nonce2 = crypto.randomBytes(16).toString('base64');
  
  check(
    'Nonce generation works',
    nonce1 && nonce2,
    'Failed to generate nonces'
  );
  
  check(
    'Nonces are unique',
    nonce1 !== nonce2,
    'Generated nonces are not unique'
  );
  
  check(
    'Nonce has correct format',
    /^[A-Za-z0-9+/]+={0,2}$/.test(nonce1),
    'Nonce does not match base64 format'
  );
  
  check(
    'Nonce has sufficient length',
    nonce1.length >= 22 && nonce1.length <= 24,
    'Nonce length is incorrect'
  );
} catch (error) {
  errors++;
  console.log(`❌ Nonce generation test failed: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary:');
console.log('='.repeat(50));
console.log(`Total Checks: ${checks}`);
console.log(`✅ Passed: ${checks - errors - warnings}`);
if (warnings > 0) {
  console.log(`⚠️  Warnings: ${warnings}`);
}
if (errors > 0) {
  console.log(`❌ Failed: ${errors}`);
}
console.log('='.repeat(50));

if (errors === 0) {
  console.log('\n✅ All critical checks passed!');
  console.log('📝 Next steps:');
  console.log('   1. Configure environment variables');
  console.log('   2. Test in development: npm run dev');
  console.log('   3. Access /planos and check browser console');
  console.log('   4. Deploy to staging for integration testing');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}
