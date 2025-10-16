#!/usr/bin/env node
/**
 * Test SendPulse OAuth2 Authentication
 * Run: node scripts/test-sendpulse-oauth.js
 */

require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.SENDPULSE_CLIENT_ID;
const CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET;

async function testSendPulseAuth() {
  console.log('🔐 Testing SendPulse OAuth2 Authentication...\n');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Error: SENDPULSE_CLIENT_ID and SENDPULSE_CLIENT_SECRET must be set in .env.local');
    process.exit(1);
  }

  console.log('📋 Client ID:', CLIENT_ID);
  console.log('🔑 Client Secret:', CLIENT_SECRET.substring(0, 8) + '...' + CLIENT_SECRET.substring(CLIENT_SECRET.length - 4));
  console.log('');

  try {
    console.log('🌐 Requesting access token from SendPulse...');
    
    const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Authentication failed!');
      console.error('Status:', response.status);
      console.error('Error:', JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ Authentication successful!\n');
    console.log('📊 Token Details:');
    console.log('  - Token Type:', data.token_type);
    console.log('  - Expires In:', data.expires_in, 'seconds (', data.expires_in / 60, 'minutes )');
    console.log('  - Access Token (first 50 chars):', data.access_token.substring(0, 50) + '...');
    console.log('');

    // Decode JWT to show user info
    const tokenParts = data.access_token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('👤 User Information:');
      console.log('  - User ID:', payload.user?.id);
      console.log('  - Area:', payload.user?.area);
      console.log('  - Expires At:', new Date(payload.exp * 1000).toLocaleString());
      console.log('  - Issued At:', new Date(payload.iat * 1000).toLocaleString());
    }

    console.log('\n✅ SendPulse OAuth2 is working correctly!');
    console.log('');
    console.log('Next steps:');
    console.log('1. ✅ OAuth2 authentication is configured');
    console.log('2. Test API endpoints for WhatsApp/chatbots');
    console.log('3. Verify webhook configuration');
    
    return data.access_token;

  } catch (error) {
    console.error('❌ Error during authentication test:', error.message);
    process.exit(1);
  }
}

// Test account info endpoint
async function testAccountInfo(token) {
  console.log('\n📊 Testing Account Info Endpoint...');
  
  try {
    const response = await fetch('https://api.sendpulse.com/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.log('⚠️  Account info endpoint returned:', response.status);
      return;
    }

    const data = await response.json();
    console.log('✅ Account Balance:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.log('⚠️  Could not fetch account info:', error.message);
  }
}

// Run tests
testSendPulseAuth()
  .then(token => testAccountInfo(token))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
