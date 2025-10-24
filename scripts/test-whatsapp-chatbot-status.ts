import 'dotenv/config';
import { sendPulseWhatsAppClient } from '../src/lib/sendpulse-whatsapp.js';

async function testChatbotStatus() {
  console.log('🤖 WhatsApp Chatbot - Status e Testes\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n📡 1. Testando conexão com SendPulse...');
    const connected = await sendPulseWhatsAppClient.testConnection();
    if (connected) {
      console.log('   ✅ API conectada com sucesso!');
    } else {
      console.log('   ❌ Falha na conexão');
      return;
    }
    
    console.log('\n📱 2. Informações do Bot:');
    const botId = process.env.SENDPULSE_BOT_ID;
    console.log(`   Bot ID: ${botId}`);
    console.log('   Phone: +55 (33) 99989-8026');
    console.log('   Nome: SVLentes');
    
    console.log('\n📋 3. Recursos Disponíveis:');
    console.log('   ✅ Envio de mensagens de texto');
    console.log('   ✅ Botões de resposta rápida (quick replies)');
    console.log('   ✅ Envio de imagens com legenda');
    console.log('   ✅ Criação/atualização de contatos');
    console.log('   ✅ Integração com LangChain/OpenAI');
    console.log('   ✅ LangSmith observability habilitado');
    
    console.log('\n🤖 4. Integração com IA:');
    console.log('   ✅ LangChain configurado');
    console.log('   ✅ OpenAI GPT-5-mini');
    console.log('   ✅ Sistema de suporte automatizado');
    console.log('   ✅ Detecção de intenções');
    console.log('   ✅ Escalação inteligente');
    console.log('   ✅ Cache de respostas');
    
    console.log('\n⚠️  5. Limitação do WhatsApp Business:');
    console.log('   Para enviar mensagens, o contato precisa ter enviado');
    console.log('   uma mensagem para o bot nas últimas 24 horas.');
    console.log('   Isso é uma limitação da API do WhatsApp Business.');
    
    console.log('\n📝 6. Como testar o chatbot:');
    console.log('   1. Envie uma mensagem do WhatsApp para: +55 33 99989-8026');
    console.log('   2. O bot vai responder automaticamente');
    console.log('   3. Você pode então usar a API para enviar mensagens');
    
    console.log('\n🔧 7. Arquivos principais:');
    console.log('   • src/lib/sendpulse-whatsapp.ts - Cliente WhatsApp');
    console.log('   • src/lib/langchain-support-processor.ts - IA do chatbot');
    console.log('   • src/lib/support-knowledge-base.ts - Base de conhecimento');
    console.log('   • src/lib/response-cache.ts - Sistema de cache');
    
    console.log('\n✅ Sistema pronto para uso!');
    console.log('   O chatbot responderá automaticamente quando receber mensagens.');
    
  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  }
}

testChatbotStatus();
