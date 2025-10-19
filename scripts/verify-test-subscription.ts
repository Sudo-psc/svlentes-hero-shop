/**
 * Script para verificar assinatura de teste
 * Uso: npx tsx scripts/verify-test-subscription.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTestSubscription() {
  try {
    const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com';

    console.log('🔍 Verificando assinatura de teste...\n');

    // 1. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        subscriptions: {
          include: {
            benefits: true,
            orders: true,
            payments: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('👤 Usuário:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Telefone: ${user.phone}`);
    console.log(`   WhatsApp: ${user.whatsapp}`);
    console.log(`   Asaas Customer ID: ${user.asaasCustomerId}`);

    console.log(`\n📋 Assinaturas: ${user.subscriptions.length}\n`);

    user.subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Assinatura ${sub.id}:`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plano: ${sub.planType}`);
      console.log(`   Valor Mensal: R$ ${sub.monthlyValue}`);
      console.log(`   Data de Início: ${sub.startDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Data de Renovação: ${sub.renewalDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Próximo Pagamento: ${sub.nextBillingDate?.toLocaleDateString('pt-BR') || 'N/A'}`);
      console.log(`   Tipo de Lente: ${sub.lensType}`);
      console.log(`   Ambos os Olhos: ${sub.bothEyes ? 'Sim' : 'Não'}`);

      console.log(`\n   🎁 Benefícios (${sub.benefits.length}):`);
      sub.benefits.forEach((benefit, i) => {
        const usage = benefit.benefitType === 'UNLIMITED'
          ? 'Ilimitado'
          : `${benefit.quantityUsed}/${benefit.quantityTotal}`;
        console.log(`      ${i + 1}. ${benefit.benefitName} - ${usage}`);
      });

      console.log(`\n   📦 Pedidos (${sub.orders.length}):`);
      sub.orders.forEach((order, i) => {
        console.log(`      ${i + 1}. Pedido ${order.id}`);
        console.log(`         Status: ${order.deliveryStatus}`);
        console.log(`         Data: ${order.orderDate.toLocaleDateString('pt-BR')}`);
        console.log(`         Valor: R$ ${order.totalAmount}`);
        console.log(`         Pagamento: ${order.paymentStatus}`);
      });

      console.log(`\n   💰 Pagamentos (${sub.payments.length}):`);
      sub.payments.forEach((payment, i) => {
        console.log(`      ${i + 1}. Pagamento ${payment.id}`);
        console.log(`         Status: ${payment.status}`);
        console.log(`         Valor: R$ ${payment.amount}`);
        console.log(`         Tipo: ${payment.billingType}`);
        console.log(`         Data: ${payment.paymentDate?.toLocaleDateString('pt-BR') || 'Pendente'}`);
      });

      console.log('\n');
    });

    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar assinatura:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestSubscription()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
