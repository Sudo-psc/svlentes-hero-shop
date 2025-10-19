#!/bin/bash
# Test SendPulse integration by sending messages to a phone number
# Usage: ./scripts/test-sendpulse-direct.sh [phone_number]

set -e

PHONE=${1:-"32999929969"}
FULL_PHONE="55${PHONE}"

echo "═══════════════════════════════════════════════════════"
echo "  SendPulse Direct Test via Node"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📱 Target Phone: ${FULL_PHONE}"
echo ""

# Create a temporary Node.js test script
cat > /tmp/test-sendpulse.mjs << 'NODESCRIPT'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import modules using dynamic import
const { sendPulseClient } = await import('../src/lib/sendpulse-client.js');
const { sendMessageWithFallback } = await import('../src/lib/mcp-sendpulse-client.js');

const phone = process.argv[2] || '32999929969';
const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

console.log('🧪 Test 1: Direct API Message');
console.log('───────────────────────────────────────────────────────');

try {
  const result = await sendPulseClient.sendMessage({
    phone: fullPhone,
    message: '🤖 Teste de mensagem via API Direta SendPulse\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente! ✅',
    isChatOpened: false
  });

  console.log('✅ SUCCESS: Message sent via Direct API');
  console.log('Response:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ FAILED: Direct API error');
  console.error('Error:', error.message);
}

console.log('\n🧪 Test 2: Hybrid Fallback Mechanism');
console.log('───────────────────────────────────────────────────────');

try {
  const botId = process.env.SENDPULSE_BOT_ID || '';
  const fallbackResult = await sendMessageWithFallback(
    sendPulseClient,
    {
      phone: fullPhone,
      message: '🔄 Teste do mecanismo de fallback híbrido\n\nEsta mensagem testa a capacidade do sistema de usar MCP como fallback quando a API direta falha.',
      botId
    }
  );

  if (fallbackResult.success) {
    console.log(`✅ SUCCESS: Message delivered via ${fallbackResult.method.toUpperCase()}`);
    console.log('Method used:', fallbackResult.method);
  } else {
    console.error('❌ FAILED: All delivery methods failed');
    console.error('Error:', fallbackResult.error);
  }
} catch (error) {
  console.error('❌ FAILED: Fallback mechanism error');
  console.error('Error:', error.message);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  Test Complete');
console.log('═══════════════════════════════════════════════════════\n');
NODESCRIPT

# Navigate to project root
cd /root/svlentes-hero-shop

# Run the Node.js script
node --experimental-modules /tmp/test-sendpulse.mjs "${FULL_PHONE}"

# Clean up
rm /tmp/test-sendpulse.mjs
