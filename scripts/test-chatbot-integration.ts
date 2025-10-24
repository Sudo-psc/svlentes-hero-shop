import 'dotenv/config';
import { sendPulseWhatsAppClient } from '../src/lib/sendpulse-whatsapp.js';

async function testChatbot() {
  console.log('🤖 Testing WhatsApp Chatbot Integration\n');
  
  const testPhone = '5533998980026';
  
  try {
    console.log('1. Testing API connection...');
    const connected = await sendPulseWhatsAppClient.testConnection();
    console.log('   ✅ Connection:', connected);
    
    console.log(`\n2. Creating/updating contact for ${testPhone}...`);
    const contact = await sendPulseWhatsAppClient.createOrUpdateContact({
      phone: testPhone,
      name: 'Test User',
      tags: ['test', 'chatbot-integration']
    });
    console.log('   ✅ Contact created/updated!');
    console.log('   Response:', JSON.stringify(contact, null, 2));
    
    console.log(`\n3. Sending test message to ${testPhone}...`);
    const result = await sendPulseWhatsAppClient.sendMessage({
      phone: testPhone,
      text: '🤖 Teste automático do chatbot SVLentes\n\nSistema de IA funcionando corretamente!'
    });
    console.log('   ✅ Message sent successfully!');
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    console.log(`\n4. Testing message with quick replies...`);
    const quickReplyResult = await sendPulseWhatsAppClient.sendMessageWithQuickReplies(
      testPhone,
      'Escolha uma opção:',
      ['Ver planos', 'Falar com atendente', 'Ajuda']
    );
    console.log('   ✅ Quick reply message sent!');
    console.log('   Response:', JSON.stringify(quickReplyResult, null, 2));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    throw error;
  }
}

testChatbot();
