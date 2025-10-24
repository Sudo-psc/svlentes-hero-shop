import 'dotenv/config';

async function configureWebhook() {
  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
  const botId = process.env.SENDPULSE_BOT_ID;
  const webhookUrl = 'https://svlentes.com.br/api/webhooks/sendpulse';

  console.log('🔧 Configurando Webhook do SendPulse\n');
  console.log(`Bot ID: ${botId}`);
  console.log(`Webhook URL: ${webhookUrl}\n`);

  try {
    // Get OAuth token
    console.log('1. Obtendo token de acesso...');
    const tokenRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenRes.ok) {
      throw new Error(`Erro ao obter token: ${tokenRes.status}`);
    }

    const { access_token } = await tokenRes.json();
    console.log('   ✅ Token obtido\n');

    // Configure webhook
    console.log('2. Configurando webhook...');
    
    // Try different possible endpoints
    const endpoints = [
      `https://api.sendpulse.com/whatsapp/bots/${botId}/webhook`,
      `https://api.sendpulse.com/whatsapp/bots/${botId}/settings`,
      `https://api.sendpulse.com/messengers/whatsapp/${botId}/webhook`,
    ];

    for (const endpoint of endpoints) {
      console.log(`   Tentando: ${endpoint}`);
      
      const webhookRes = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          enabled: true,
          events: ['incoming_message', 'message_status']
        })
      });

      const data = await webhookRes.json();
      console.log(`   Status: ${webhookRes.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 300));
      
      if (webhookRes.ok && data.success) {
        console.log('\n✅ Webhook configurado com sucesso!');
        return;
      }
    }

    console.log('\n⚠️  Não foi possível configurar o webhook via API.');
    console.log('\n📝 Configure manualmente:');
    console.log('1. Acesse: https://login.sendpulse.com/messengers/whatsapp/');
    console.log('2. Clique no bot "SVlentes"');
    console.log('3. Vá em "Settings" ou "Configurações"');
    console.log('4. Procure por "Webhook" ou "API"');
    console.log(`5. Configure a URL: ${webhookUrl}`);
    console.log('6. Ative o webhook para eventos de mensagens recebidas');

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  }
}

configureWebhook();
