#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

console.log('=== SendPulse WhatsApp Integration Test Tool ===\n');
console.log(`API Base URL: ${API_BASE}\n`);

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testSendMessage() {
  console.log('\n--- Test: Send Message ---');
  
  const phone = await prompt('Enter phone number (e.g., 5511999999999): ');
  const message = await prompt('Enter message text (or press Enter for default): ');
  
  const payload = {
    phone: phone.trim(),
    message: message.trim() || 'Test message from SendPulse integration'
  };

  try {
    console.log('\nSending request...');
    const response = await fetch(`${API_BASE}/api/sendpulse/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Success!');
      console.log('Message ID:', data.messageId);
      console.log('Status:', data.status);
      console.log('Timestamp:', data.timestamp);
    } else {
      console.log('\n❌ Error!');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
      if (data.details) console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

async function testSendContextMessage() {
  console.log('\n--- Test: Send Context Message ---');
  
  const phone = await prompt('Enter phone number: ');
  const contexts = ['hero', 'pricing', 'consultation', 'support', 'calculator', 'emergency'];
  
  console.log('\nAvailable contexts:');
  contexts.forEach((ctx, i) => console.log(`  ${i + 1}. ${ctx}`));
  
  const contextIdx = parseInt(await prompt('\nSelect context (1-6): ')) - 1;
  const context = contexts[contextIdx];
  
  if (!context) {
    console.log('Invalid context selection');
    return;
  }

  const payload = {
    phone: phone.trim(),
    context,
    userData: {
      nome: await prompt('Customer name (optional): ') || undefined,
      email: await prompt('Customer email (optional): ') || undefined,
    },
    contextData: {
      page: 'test-page',
    }
  };

  try {
    console.log('\nSending request...');
    const response = await fetch(`${API_BASE}/api/sendpulse/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Success!');
      console.log('Message ID:', data.messageId);
      console.log('Status:', data.status);
    } else {
      console.log('\n❌ Error!');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

async function testWebhook() {
  console.log('\n--- Test: Simulate Webhook ---');
  
  const phone = await prompt('Enter sender phone number: ');
  const messageText = await prompt('Enter message text: ');
  
  const payload = {
    event: 'message_received',
    timestamp: Math.floor(Date.now() / 1000),
    contact: {
      phone: phone.trim(),
      name: 'Test User'
    },
    message: {
      id: `test_${Date.now()}`,
      type: 'text',
      text: messageText.trim()
    }
  };

  try {
    console.log('\nSending webhook simulation...');
    const response = await fetch(`${API_BASE}/api/webhooks/sendpulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Webhook processed successfully!');
      console.log('Status:', data.status);
    } else {
      console.log('\n❌ Error!');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

async function testGetContact() {
  console.log('\n--- Test: Get Contact Info ---');
  
  const phone = await prompt('Enter phone number: ');
  
  try {
    console.log('\nFetching contact info...');
    const response = await fetch(
      `${API_BASE}/api/sendpulse/messages?phone=${encodeURIComponent(phone.trim())}`,
      { method: 'GET' }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Success!');
      console.log('Contact:', JSON.stringify(data.contact, null, 2));
    } else {
      console.log('\n❌ Error!');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

async function main() {
  let running = true;
  
  while (running) {
    console.log('\nSelect test:');
    console.log('1. Send simple text message');
    console.log('2. Send contextual message');
    console.log('3. Simulate incoming webhook');
    console.log('4. Get contact information');
    console.log('5. Exit');
    
    const choice = await prompt('\nYour choice (1-5): ');
    
    switch (choice.trim()) {
      case '1':
        await testSendMessage();
        break;
      case '2':
        await testSendContextMessage();
        break;
      case '3':
        await testWebhook();
        break;
      case '4':
        await testGetContact();
        break;
      case '5':
        console.log('\nGoodbye!');
        running = false;
        break;
      default:
        console.log('\nInvalid choice, please try again.');
    }
  }
  
  rl.close();
}

main().catch(console.error);
