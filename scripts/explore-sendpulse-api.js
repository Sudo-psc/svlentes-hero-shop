#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.SENDPULSE_CLIENT_ID;
const CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET;

async function getToken() {
  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  const data = await response.json();
  return data.access_token;
}

async function testEndpoint(token, method, endpoint, body = null) {
  console.log(`\n🔍 Testing: ${method} ${endpoint}`);
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`https://api.sendpulse.com${endpoint}`, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      console.log(`   ✅ Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    } else {
      console.log(`   ❌ Error:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }
}

async function main() {
  console.log('🔍 Exploring SendPulse API Endpoints...\n');
  
  const token = await getToken();
  console.log('✅ Got access token\n');
  
  // Test various endpoints
  await testEndpoint(token, 'GET', '/balance');
  await testEndpoint(token, 'GET', '/addressbooks');
  await testEndpoint(token, 'GET', '/sms/phones');
  await testEndpoint(token, 'GET', '/webpush/websites');
  
  // Chatbot endpoints
  console.log('\n📱 Testing Chatbot Endpoints:');
  await testEndpoint(token, 'GET', '/chatbots');
  await testEndpoint(token, 'GET', '/whatsapp/account');
  await testEndpoint(token, 'GET', '/whatsapp/chats');
  await testEndpoint(token, 'GET', '/facebook/account');
  await testEndpoint(token, 'GET', '/telegram/account');
  
  console.log('\n✅ API exploration complete!');
}

main().catch(console.error);
