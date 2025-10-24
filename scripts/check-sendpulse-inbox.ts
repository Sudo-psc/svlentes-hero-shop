import 'dotenv/config';

async function checkInbox() {
  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
  const botId = process.env.SENDPULSE_BOT_ID;

  console.log('📬 Verificando Inbox do SendPulse\n');

  try {
    // Get token
    const tokenRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const { access_token } = await tokenRes.json();

    // Get chats
    const chatsRes = await fetch(`https://api.sendpulse.com/whatsapp/chats?bot_id=${botId}&limit=10`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const chatsData = await chatsRes.json();

    if (chatsData.success && chatsData.data) {
      console.log(`📊 Total de conversas: ${chatsData.data.length}\n`);

      chatsData.data.forEach((chat: any, i: number) => {
        const lastMsg = chat.inbox_last_message;
        const phone = chat.contact?.channel_data?.phone || 'Unknown';
        const name = chat.contact?.channel_data?.name || 'Sem nome';
        const unread = chat.inbox_unread_count || 0;
        
        console.log(`${i + 1}. ${name} (${phone})`);
        console.log(`   Não lidas: ${unread}`);
        
        if (lastMsg) {
          const text = lastMsg.data?.text?.body || 
                      lastMsg.data?.interactive?.button_reply?.title ||
                      lastMsg.data?.interactive?.list_reply?.title ||
                      '[Mídia]';
          const date = new Date(lastMsg.created_at).toLocaleString('pt-BR');
          const direction = lastMsg.direction === 1 ? '📤' : '📥';
          
          console.log(`   Última msg: ${direction} "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          console.log(`   Data: ${date}`);
        }
        console.log('');
      });

      const totalUnread = chatsData.data.reduce((sum: number, chat: any) => 
        sum + (chat.inbox_unread_count || 0), 0
      );

      console.log(`\n⚠️  Total de mensagens não lidas: ${totalUnread}`);
      
      if (totalUnread > 0) {
        console.log('\n🔧 AÇÃO NECESSÁRIA:');
        console.log('Configure o webhook no painel do SendPulse para que');
        console.log('o bot possa responder automaticamente.');
        console.log('\nVeja: CHATBOT_SETUP.md');
      }

    } else {
      console.log('❌ Erro ao obter chats');
      console.log('Response:', JSON.stringify(chatsData, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

checkInbox();
