#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

async function getToken() {
  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SENDPULSE_CLIENT_ID,
      client_secret: process.env.SENDPULSE_CLIENT_SECRET
    })
  });
  const data = await response.json();
  return data.access_token;
}

async function testWhatsApp(token) {
  console.log('📱 Testing WhatsApp Endpoints...\n');
  
  // Get account
  console.log('1. GET /whatsapp/account');
  let res = await fetch('https://api.sendpulse.com/whatsapp/account', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let data = await res.json();
  console.log('   Status:', res.status);
  console.log('   Response:', JSON.stringify(data, null, 2));
  
  // Get bots
  console.log('\n2. GET /whatsapp/bots');
  res = await fetch('https://api.sendpulse.com/whatsapp/bots', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  console.log('   Status:', res.status);
  console.log('   Response:', JSON.stringify(data, null, 2));
  
  if (data.success && data.data && data.data.length > 0) {
    const botId = data.data[0].id;
    console.log('\n   📌 Found bot ID:', botId);
    
    // Get bot contacts
    console.log('\n3. GET /whatsapp/contacts (bot:', botId, ')');
    res = await fetch(`https://api.sendpulse.com/whatsapp/contacts?bot_id=${botId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500));
  }
  
  // Get chats
  console.log('\n4. GET /whatsapp/chats');
  res = await fetch('https://api.sendpulse.com/whatsapp/chats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  console.log('   Status:', res.status);
  console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500));
}

getToken().then(testWhatsApp).catch(console.error);
