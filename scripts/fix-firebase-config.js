#!/usr/bin/env node

// Firebase Configuration Fix Script
// This script identifies and fixes Firebase configuration issues

const fs = require('fs');
const https = require('https');

console.log('🔧 Firebase Configuration Fix Script\n');

// Load current configuration
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const config = {};

    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !line.startsWith('#')) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }

        config[key] = value;
      }
    });

    return config;
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

// Test Firebase project accessibility
function testFirebaseProject(projectId) {
  return new Promise((resolve) => {
    const testUrl = `https://firebase.googleapis.com/v1alpha/projects/${projectId}`;

    const req = https.get(testUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          data: res.statusCode === 200 ? JSON.parse(data) : null,
          error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: 'Request timeout'
      });
    });

    req.setTimeout(10000);
    req.end();
  });
}

// Main fix function
async function fixFirebaseConfig() {
  const config = loadEnvFile('.env.local');
  if (!config) {
    console.log('❌ Could not load .env.local file');
    return;
  }

  const projectId = config.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  console.log('📋 Current Configuration:');
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Auth Domain: ${authDomain}`);
  console.log(`  API Key: ${config.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'Missing'}`);

  if (!projectId || !authDomain) {
    console.log('\n❌ Critical Firebase configuration missing');
    return;
  }

  console.log('\n🔍 Testing Firebase Project Accessibility...');

  // Test Firebase project
  const projectTest = await testFirebaseProject(projectId);

  if (projectTest.success) {
    console.log('✅ Firebase project is accessible via Google APIs');
  } else {
    console.log(`❌ Firebase project not accessible: ${projectTest.error}`);

    if (projectTest.statusCode === 403) {
      console.log('💡 This suggests the project ID is incorrect or Firebase is not enabled');
    } else if (projectTest.statusCode === 404) {
      console.log('💡 This suggests the project does not exist');
    }
  }

  console.log('\n🌐 Testing Firebase Auth Domain...');

  // Test auth domain
  const authDomainTest = await new Promise((resolve) => {
    const testUrl = `https://${authDomain}`;

    const req = https.get(testUrl, { timeout: 5000 }, (res) => {
      resolve({
        success: res.statusCode < 500, // Any response other than server error is okay
        statusCode: res.statusCode,
        error: res.statusCode >= 500 ? `HTTP ${res.statusCode}` : null
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        error: 'Request timeout'
      });
    });

    req.setTimeout(5000);
    req.end();
  });

  if (authDomainTest.success) {
    console.log('✅ Firebase auth domain is reachable');
  } else {
    console.log(`❌ Firebase auth domain issue: ${authDomainTest.error}`);

    // Suggest fixes
    console.log('\n💡 Possible Solutions:');
    console.log('  1. Verify Firebase project exists in Firebase Console');
    console.log('  2. Ensure Authentication is enabled in Firebase project');
    console.log('  3. Check if authDomain format is correct (should be projectId.firebaseapp.com)');
    console.log('  4. Verify project is not disabled or suspended');
  }

  console.log('\n🔧 Recommended Actions:');

  // Generate corrected configuration
  const expectedAuthDomain = `${projectId}.firebaseapp.com`;
  if (authDomain !== expectedAuthDomain) {
    console.log(`  1. Update authDomain to: ${expectedAuthDomain}`);
    console.log(`     Current: ${authDomain}`);
    console.log(`     Expected: ${expectedAuthDomain}`);
  }

  if (!projectTest.success) {
    console.log('  2. Verify Firebase project configuration in Firebase Console');
    console.log('     - Check project exists: https://console.firebase.google.com');
    console.log('     - Ensure Authentication is enabled');
    console.log('     - Verify Web App configuration');
  }

  // Check for common issues
  console.log('\n🔍 Common Issues to Check:');
  console.log('  - Firebase project exists and is active');
  console.log('  - Authentication is enabled in Firebase Console');
  console.log('  - Web app is registered with correct domain');
  console.log('  - API keys are valid and not restricted');
  console.log('  - OAuth consent screen is configured (for Google Sign-In)');

  console.log('\n📝 Next Steps:');
  console.log('  1. Fix any configuration issues identified above');
  console.log('  2. Test login functionality in browser');
  console.log('  3. Check browser console for Firebase initialization errors');
  console.log('  4. Verify Firebase SDK is loading correctly');
}

// Run the fix
fixFirebaseConfig().catch(console.error);