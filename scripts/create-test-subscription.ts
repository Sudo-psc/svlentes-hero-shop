/**
 * Script para criar assinatura de teste no banco de dados
 * Uso: npx tsx scripts/create-test-subscription.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestSubscription() {
  try {
    console.log('🚀 Iniciando criação de assinatura de teste...\n');

    const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com';
    const testName = 'Dr. Philipe Saraiva Cruz';
    const testPhone = '5533999898026';

    // 1. Criar ou encontrar usuário
    console.log(`📧 Procurando usuário: ${testEmail}`);
    let user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!user) {
      console.log('👤 Usuário não encontrado. Criando novo usuário...');
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: testName,
          phone: testPhone,
          whatsapp: testPhone,
          role: 'subscriber',
          emailVerified: new Date(),
          asaasCustomerId: 'cus_test_' + Date.now(), // ID de teste do Asaas
        }
      });
      console.log(`✅ Usuário criado: ${user.id}`);
    } else {
      console.log(`✅ Usuário encontrado: ${user.id}`);
    }

    // 2. Verificar se já existe assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['ACTIVE', 'PENDING_ACTIVATION']
        }
      }
    });

    if (existingSubscription) {
      console.log('\n⚠️  Usuário já possui assinatura ativa!');
      console.log('ID da assinatura:', existingSubscription.id);
      console.log('Status:', existingSubscription.status);
      console.log('Plano:', existingSubscription.planType);
      console.log('Valor mensal:', existingSubscription.monthlyValue.toString());
      console.log('\nDeseja continuar? Cancelando operação para evitar duplicatas.');
      return;
    }

    // 3. Criar assinatura de teste
    console.log('\n💳 Criando assinatura de teste...');

    const today = new Date();
    const renewalDate = new Date(today);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        asaasSubscriptionId: 'sub_test_' + Date.now(),
        planType: 'Lentes Diárias Premium',
        status: 'ACTIVE',
        monthlyValue: 99.90,
        renewalDate: renewalDate,
        startDate: today,
        paymentMethod: 'CREDIT_CARD',
        paymentMethodLast4: '4242',
        lensType: 'Diária',
        bothEyes: true,
        differentGrades: false,
        nextBillingDate: renewalDate,
        activatedAt: new Date(),
        shippingAddress: {
          street: 'Rua Principal',
          number: '123',
          complement: 'Apto 101',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-000'
        },
        contactInfo: {
          phone: testPhone,
          whatsapp: testPhone,
          email: testEmail
        }
      }
    });

    console.log(`✅ Assinatura criada: ${subscription.id}`);

    // 4. Criar benefícios da assinatura
    console.log('\n🎁 Adicionando benefícios da assinatura...');

    const benefits = await prisma.subscriptionBenefit.createMany({
      data: [
        {
          subscriptionId: subscription.id,
          benefitName: 'Lentes mensais',
          benefitDescription: 'Caixa de lentes de contato entregue mensalmente',
          benefitIcon: 'Package',
          benefitType: 'LIMITED',
          quantityTotal: 12,
          quantityUsed: 1
        },
        {
          subscriptionId: subscription.id,
          benefitName: 'Consultas de acompanhamento',
          benefitDescription: 'Consultas oftalmológicas de acompanhamento',
          benefitIcon: 'Eye',
          benefitType: 'LIMITED',
          quantityTotal: 2,
          quantityUsed: 0
        },
        {
          subscriptionId: subscription.id,
          benefitName: 'Suporte por WhatsApp',
          benefitDescription: 'Atendimento prioritário via WhatsApp',
          benefitIcon: 'MessageCircle',
          benefitType: 'UNLIMITED'
        }
      ]
    });

    console.log(`✅ ${benefits.count} benefícios adicionados`);

    // 5. Criar primeiro pedido
    console.log('\n📦 Criando pedido inicial...');

    const order = await prisma.order.create({
      data: {
        subscriptionId: subscription.id,
        orderDate: today,
        type: 'subscription',
        totalAmount: 99.90,
        paymentStatus: 'paid',
        deliveryStatus: 'DELIVERED',
        deliveryAddress: subscription.shippingAddress,
        products: {
          items: [
            {
              name: 'Lentes de Contato Diárias - Ambos os Olhos',
              quantity: 1,
              unitPrice: 99.90,
              grau_od: '-2.00',
              grau_oe: '-2.00'
            }
          ]
        },
        estimatedDelivery: today,
        deliveredAt: today,
        notes: 'Primeiro pedido da assinatura - Entregue'
      }
    });

    console.log(`✅ Pedido criado: ${order.id}`);

    // 6. Criar pagamento confirmado
    console.log('\n💰 Registrando pagamento...');

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        asaasPaymentId: 'pay_test_' + Date.now(),
        asaasCustomerId: user.asaasCustomerId!,
        asaasSubscriptionId: subscription.asaasSubscriptionId!,
        amount: 99.90,
        netValue: 96.91,
        status: 'CONFIRMED',
        billingType: 'CREDIT_CARD',
        description: 'Assinatura Mensal - Lentes Diárias Premium',
        dueDate: today,
        paymentDate: today,
        confirmedDate: today,
        invoiceUrl: 'https://exemplo.com/invoice/test'
      }
    });

    console.log(`✅ Pagamento registrado: ${payment.id}`);

    // 7. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✨ ASSINATURA DE TESTE CRIADA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumo:');
    console.log(`  Usuário: ${user.name} (${user.email})`);
    console.log(`  ID do Usuário: ${user.id}`);
    console.log(`  Assinatura ID: ${subscription.id}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Plano: ${subscription.planType}`);
    console.log(`  Valor Mensal: R$ ${subscription.monthlyValue}`);
    console.log(`  Data de Renovação: ${renewalDate.toLocaleDateString('pt-BR')}`);
    console.log(`  Benefícios: ${benefits.count} itens`);
    console.log(`  Pedidos: 1 pedido entregue`);
    console.log(`  Pagamentos: 1 pagamento confirmado`);
    console.log('\n🔗 Acesso ao painel:');
    console.log(`  URL: ${process.env.NEXT_PUBLIC_APP_URL}/area-assinante`);
    console.log(`  Login: ${user.email}`);
    console.log('\n💡 Próximos passos:');
    console.log('  1. Fazer login no Firebase com este email');
    console.log('  2. Acessar /area-assinante');
    console.log('  3. Verificar dados da assinatura');
    console.log('  4. Testar funcionalidades do painel');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar assinatura de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
createTestSubscription()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
