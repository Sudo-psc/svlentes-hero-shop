#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Verifies all required environment variables are present before Vercel deployment
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for production deployment
const REQUIRED_VARS = {
  critical: [
    'DATABASE_URL',
    'ASAAS_ENV',
    'ASAAS_API_KEY_PROD',
    'ASAAS_WEBHOOK_TOKEN',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ],
  important: [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_WHATSAPP_NUMBER',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'SENDPULSE_APP_ID',
    'SENDPULSE_APP_SECRET',
    'SENDPULSE_BOT_ID',
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
  ],
  optional: [
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'LANGCHAIN_TRACING_V2',
    'LANGCHAIN_API_KEY',
    'LANGCHAIN_PROJECT',
    'WORDPRESS_API_URL',
    'NEXT_PUBLIC_WORDPRESS_URL',
    'REVALIDATE_SECRET',
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'NEXT_PUBLIC_ENABLE_GITHUB_AUTH',
  ],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function checkEnvFile(filePath) {
  console.log(colorize(`\n📁 Checking: ${filePath}`, 'cyan'));
  console.log('='.repeat(60));

  if (!fs.existsSync(filePath)) {
    console.log(colorize(`❌ File not found: ${filePath}`, 'red'));
    return { critical: [], important: [], optional: [], missing: true };
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  // Parse environment variables from file
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  const results = {
    critical: [],
    important: [],
    optional: [],
    missing: false,
  };

  // Check critical variables
  console.log(colorize('\n🔴 CRITICAL Variables (Must have):', 'red'));
  REQUIRED_VARS.critical.forEach(varName => {
    const exists = varName in envVars && envVars[varName] !== '';
    const status = exists ? colorize('✓', 'green') : colorize('✗', 'red');
    const value = exists
      ? envVars[varName].length > 20
        ? envVars[varName].substring(0, 20) + '...'
        : envVars[varName]
      : colorize('MISSING', 'red');
    console.log(`  ${status} ${varName}: ${value}`);
    if (!exists) results.critical.push(varName);
  });

  // Check important variables
  console.log(colorize('\n🟡 IMPORTANT Variables (Recommended):', 'yellow'));
  REQUIRED_VARS.important.forEach(varName => {
    const exists = varName in envVars && envVars[varName] !== '';
    const status = exists ? colorize('✓', 'green') : colorize('✗', 'yellow');
    const value = exists
      ? envVars[varName].length > 20
        ? envVars[varName].substring(0, 20) + '...'
        : envVars[varName]
      : colorize('MISSING', 'yellow');
    console.log(`  ${status} ${varName}: ${value}`);
    if (!exists) results.important.push(varName);
  });

  // Check optional variables
  console.log(colorize('\n🟢 OPTIONAL Variables (Nice to have):', 'green'));
  REQUIRED_VARS.optional.forEach(varName => {
    const exists = varName in envVars && envVars[varName] !== '';
    const status = exists ? colorize('✓', 'green') : colorize('○', 'blue');
    const value = exists
      ? envVars[varName].length > 20
        ? envVars[varName].substring(0, 20) + '...'
        : envVars[varName]
      : colorize('Not set', 'blue');
    console.log(`  ${status} ${varName}: ${value}`);
    if (!exists) results.optional.push(varName);
  });

  return results;
}

function validateDatabaseUrl(url) {
  if (!url) return { valid: false, message: 'DATABASE_URL is missing' };

  const hasConnectionPooling =
    url.includes('pgbouncer=true') || url.includes('connection_limit=');
  const isPostgres = url.startsWith('postgresql://') || url.startsWith('postgres://');

  if (!isPostgres) {
    return { valid: false, message: 'DATABASE_URL must use PostgreSQL' };
  }

  if (!hasConnectionPooling) {
    return {
      valid: false,
      message:
        'DATABASE_URL should include connection pooling (?pgbouncer=true&connection_limit=1)',
    };
  }

  return { valid: true, message: 'DATABASE_URL format is correct' };
}

function generateSecrets() {
  const crypto = require('crypto');

  console.log(colorize('\n🔐 Generate Missing Secrets:', 'magenta'));
  console.log('Use these commands to generate secure secrets:\n');

  console.log('# NEXTAUTH_SECRET (32+ characters)');
  console.log(colorize(`openssl rand -base64 32`, 'cyan'));
  console.log(colorize(`Result: ${crypto.randomBytes(32).toString('base64')}`, 'green'));

  console.log('\n# REVALIDATE_SECRET (hex format)');
  console.log(colorize(`openssl rand -hex 32`, 'cyan'));
  console.log(colorize(`Result: ${crypto.randomBytes(32).toString('hex')}`, 'green'));

  console.log('\n# WHATSAPP_VERIFY_TOKEN (16 characters)');
  console.log(colorize(`openssl rand -hex 16`, 'cyan'));
  console.log(colorize(`Result: ${crypto.randomBytes(16).toString('hex')}`, 'green'));

  console.log('\n# ASAAS_WEBHOOK_TOKEN (32 characters)');
  console.log(colorize(`openssl rand -base64 32`, 'cyan'));
  console.log(colorize(`Result: ${crypto.randomBytes(32).toString('base64')}`, 'green'));
}

function main() {
  console.log(colorize('\n╔════════════════════════════════════════════════════════╗', 'bright'));
  console.log(colorize('║   SV Lentes - Environment Variables Verification      ║', 'bright'));
  console.log(colorize('╚════════════════════════════════════════════════════════╝', 'bright'));

  // Check different environment files
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env.production.vercel',
    '.env',
  ];

  const results = {};
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    results[file] = checkEnvFile(filePath);
  });

  // Summary
  console.log(colorize('\n\n📊 SUMMARY', 'bright'));
  console.log('='.repeat(60));

  Object.entries(results).forEach(([file, result]) => {
    if (result.missing) {
      console.log(colorize(`\n${file}: File not found`, 'red'));
      return;
    }

    const criticalCount = result.critical.length;
    const importantCount = result.important.length;
    const optionalCount = result.optional.length;

    const status =
      criticalCount === 0 && importantCount === 0
        ? colorize('✓ READY', 'green')
        : criticalCount > 0
          ? colorize('✗ BLOCKED', 'red')
          : colorize('⚠ MISSING RECOMMENDED', 'yellow');

    console.log(`\n${file}: ${status}`);
    if (criticalCount > 0)
      console.log(
        colorize(`  ✗ Missing ${criticalCount} critical variable(s)`, 'red')
      );
    if (importantCount > 0)
      console.log(
        colorize(`  ⚠ Missing ${importantCount} important variable(s)`, 'yellow')
      );
    if (optionalCount > 0)
      console.log(
        colorize(`  ○ Missing ${optionalCount} optional variable(s)`, 'blue')
      );
  });

  // Check DATABASE_URL format
  const envLocal = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocal)) {
    const envContent = fs.readFileSync(envLocal, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
    if (dbUrlMatch) {
      const validation = validateDatabaseUrl(dbUrlMatch[1]);
      console.log(colorize('\n\n🗄️  DATABASE_URL Validation:', 'cyan'));
      if (validation.valid) {
        console.log(colorize(`  ✓ ${validation.message}`, 'green'));
      } else {
        console.log(colorize(`  ✗ ${validation.message}`, 'red'));
      }
    }
  }

  // Generate secrets if needed
  const hasAnyCriticalMissing = Object.values(results).some(
    r => !r.missing && r.critical.length > 0
  );
  if (hasAnyCriticalMissing) {
    generateSecrets();
  }

  // Deployment readiness
  console.log(colorize('\n\n🚀 DEPLOYMENT READINESS', 'bright'));
  console.log('='.repeat(60));

  const productionVercelExists = fs.existsSync('.env.production.vercel');
  const hasCriticalVars =
    results['.env.production.vercel'] &&
    !results['.env.production.vercel'].missing &&
    results['.env.production.vercel'].critical.length === 0;
  const hasImportantVars =
    results['.env.production.vercel'] &&
    !results['.env.production.vercel'].missing &&
    results['.env.production.vercel'].important.length === 0;

  if (!productionVercelExists) {
    console.log(colorize('✗ .env.production.vercel file missing', 'red'));
    console.log(colorize('  Create it from .env.vercel.example', 'yellow'));
  } else if (!hasCriticalVars) {
    console.log(colorize('✗ Critical variables missing - CANNOT DEPLOY', 'red'));
  } else if (!hasImportantVars) {
    console.log(
      colorize('⚠ Some important variables missing - DEPLOY WITH CAUTION', 'yellow')
    );
  } else {
    console.log(colorize('✓ Ready for Vercel deployment!', 'green'));
  }

  console.log('\n' + '='.repeat(60));
  console.log(colorize('\nNext Steps:', 'cyan'));
  console.log('  1. Create .env.production.vercel if missing');
  console.log('  2. Fill in all CRITICAL variables (red)');
  console.log('  3. Fill in IMPORTANT variables (yellow) for full functionality');
  console.log('  4. Run this script again to verify');
  console.log('  5. Deploy to Vercel: vercel --prod\n');
}

main();
