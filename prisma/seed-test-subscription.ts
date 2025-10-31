/**
 * Seed Script: Create Test Subscription for Dr. Philipe
 *
 * Creates a complete test subscription with:
 * - User account (if doesn't exist)
 * - Active subscription
 * - Payment records
 * - Order history
 *
 * Usage:
 * npx tsx prisma/seed-test-subscription.ts
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { PrismaClient, SubscriptionStatus, PaymentMethod, PaymentStatus, DeliveryStatus } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_EMAIL = 'drphilipe.saraiva.oftalmo@gmail.com'
const TEST_NAME = 'Dr. Philipe Saraiva Cruz'
const TEST_PHONE = '5533986061427'
const TEST_STRIPE_CUSTOMER_ID = 'cus_test_drphilipe_' + Date.now()

async function main() {
  console.log('🌱 Starting seed for test subscription...\n')

  // 1. Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    include: { subscriptions: true }
  })

  if (user) {
    console.log(`✅ User already exists: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Existing subscriptions: ${user.subscriptions.length}`)
  } else {
    // 2. Create user
    console.log('📝 Creating new user...')
    user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: TEST_NAME,
        phone: TEST_PHONE,
        whatsapp: TEST_PHONE,
        role: 'subscriber',
        emailVerified: new Date(),
        // Simulate Firebase UID
        firebaseUid: 'firebase_test_' + Date.now(),
        // Add Asaas customer ID for payment integration
        asaasCustomerId: 'cus_asaas_test_' + Date.now(),
      },
    })
    console.log(`✅ User created: ${user.email}`)
    console.log(`   ID: ${user.id}`)
  }

  // 3. Create test subscription
  console.log('\n💳 Creating test subscription...')

  const today = new Date()
  const renewalDate = new Date(today)
  renewalDate.setMonth(renewalDate.getMonth() + 1) // Next renewal in 1 month

  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - 2) // Started 2 months ago

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planType: 'VIP Anual',
      status: SubscriptionStatus.ACTIVE,
      monthlyValue: 89.90,
      renewalDate: renewalDate,
      startDate: startDate,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentMethodLast4: '4242',

      // Additional fields
      lensType: 'Lentes Diárias Acuvue',
      bothEyes: true,
      differentGrades: false,

      // Shipping address
      shippingAddress: {
        street: 'Rua Principal',
        number: '123',
        complement: 'Consultório',
        neighborhood: 'Centro',
        city: 'Caratinga',
        state: 'MG',
        zipCode: '35300-000',
        country: 'Brasil',
      },

      // Contact info
      contactInfo: {
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        whatsapp: TEST_PHONE,
      },

      // Asaas integration
      asaasSubscriptionId: 'sub_asaas_test_' + Date.now(),

      // Lifecycle tracking
      activatedAt: startDate,
      nextBillingDate: renewalDate,

      // Metadata
      metadata: {
        testSubscription: true,
        createdBy: 'seed-test-subscription.ts',
        purpose: 'Testing Stripe Portal integration',
        notes: 'This is a test subscription for Dr. Philipe to test the Stripe Customer Portal',
      },
    },
  })

  console.log(`✅ Subscription created: ${subscription.id}`)
  console.log(`   Plan: ${subscription.planType}`)
  console.log(`   Status: ${subscription.status}`)
  console.log(`   Monthly Value: R$ ${subscription.monthlyValue}`)
  console.log(`   Next Renewal: ${subscription.renewalDate.toLocaleDateString('pt-BR')}`)

  // 4. Create subscription benefits
  console.log('\n🎁 Creating subscription benefits...')

  const benefits = [
    {
      subscriptionId: subscription.id,
      benefitName: 'Lentes Mensais',
      benefitDescription: 'Receba suas lentes todo mês automaticamente',
      benefitIcon: 'calendar',
      benefitType: 'UNLIMITED' as const,
      quantityUsed: 2,
    },
    {
      subscriptionId: subscription.id,
      benefitName: 'Frete Grátis',
      benefitDescription: 'Entrega sem custo adicional',
      benefitIcon: 'truck',
      benefitType: 'UNLIMITED' as const,
      quantityUsed: 2,
    },
    {
      subscriptionId: subscription.id,
      benefitName: 'Consultas de Acompanhamento',
      benefitDescription: 'Até 3 consultas gratuitas por ano',
      benefitIcon: 'medical',
      benefitType: 'LIMITED' as const,
      quantityTotal: 3,
      quantityUsed: 1,
    },
  ]

  await prisma.subscriptionBenefit.createMany({
    data: benefits,
  })

  console.log(`✅ ${benefits.length} benefits created`)

  // 5. Create payment records (last 2 months)
  console.log('\n💰 Creating payment history...')

  const payments = []

  // Ensure user has asaasCustomerId
  if (!user.asaasCustomerId) {
    console.log('⚠️  User missing asaasCustomerId, updating...')
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        asaasCustomerId: 'cus_asaas_test_' + Date.now(),
      },
    })
    console.log(`✅ Updated asaasCustomerId: ${user.asaasCustomerId}`)
  }

  // Payment 1 - 2 months ago (CONFIRMED)
  const payment1Date = new Date(startDate)
  payments.push({
    userId: user.id,
    subscriptionId: subscription.id,
    asaasPaymentId: 'pay_' + Date.now() + '_1',
    asaasCustomerId: user.asaasCustomerId,
    asaasSubscriptionId: subscription.asaasSubscriptionId!,
    amount: subscription.monthlyValue,
    netValue: subscription.monthlyValue.toNumber() * 0.97, // After fees
    status: PaymentStatus.CONFIRMED,
    billingType: 'CREDIT_CARD',
    description: 'Assinatura VIP Anual - Mês 1',
    dueDate: payment1Date,
    paymentDate: payment1Date,
    confirmedDate: payment1Date,
    invoiceNumber: 'INV-2023-001',
  })

  // Payment 2 - 1 month ago (CONFIRMED)
  const payment2Date = new Date(startDate)
  payment2Date.setMonth(payment2Date.getMonth() + 1)
  payments.push({
    userId: user.id,
    subscriptionId: subscription.id,
    asaasPaymentId: 'pay_' + Date.now() + '_2',
    asaasCustomerId: user.asaasCustomerId,
    asaasSubscriptionId: subscription.asaasSubscriptionId!,
    amount: subscription.monthlyValue,
    netValue: subscription.monthlyValue.toNumber() * 0.97,
    status: PaymentStatus.CONFIRMED,
    billingType: 'CREDIT_CARD',
    description: 'Assinatura VIP Anual - Mês 2',
    dueDate: payment2Date,
    paymentDate: payment2Date,
    confirmedDate: payment2Date,
    invoiceNumber: 'INV-2023-002',
  })

  // Payment 3 - Current month (PENDING)
  payments.push({
    userId: user.id,
    subscriptionId: subscription.id,
    asaasPaymentId: 'pay_' + Date.now() + '_3',
    asaasCustomerId: user.asaasCustomerId,
    asaasSubscriptionId: subscription.asaasSubscriptionId!,
    amount: subscription.monthlyValue,
    status: PaymentStatus.PENDING,
    billingType: 'CREDIT_CARD',
    description: 'Assinatura VIP Anual - Mês 3',
    dueDate: renewalDate,
  })

  await prisma.payment.createMany({
    data: payments,
  })

  console.log(`✅ ${payments.length} payments created`)

  // 6. Create order history
  console.log('\n📦 Creating order history...')

  const orders = [
    {
      subscriptionId: subscription.id,
      orderDate: payment1Date,
      shippingDate: new Date(payment1Date.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
      deliveryStatus: DeliveryStatus.DELIVERED,
      trackingCode: 'BR123456789BR',
      deliveryAddress: subscription.shippingAddress,
      products: [
        {
          name: 'Lentes de Contato Acuvue Oasys',
          quantity: 2,
          unitPrice: 44.95,
        },
      ],
      type: 'subscription',
      totalAmount: 89.90,
      paymentStatus: 'paid',
      deliveredAt: new Date(payment1Date.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
    },
    {
      subscriptionId: subscription.id,
      orderDate: payment2Date,
      shippingDate: new Date(payment2Date.getTime() + 2 * 24 * 60 * 60 * 1000),
      deliveryStatus: DeliveryStatus.DELIVERED,
      trackingCode: 'BR987654321BR',
      deliveryAddress: subscription.shippingAddress,
      products: [
        {
          name: 'Lentes de Contato Acuvue Oasys',
          quantity: 2,
          unitPrice: 44.95,
        },
      ],
      type: 'subscription',
      totalAmount: 89.90,
      paymentStatus: 'paid',
      deliveredAt: new Date(payment2Date.getTime() + 4 * 24 * 60 * 60 * 1000),
    },
  ]

  await prisma.order.createMany({
    data: orders,
  })

  console.log(`✅ ${orders.length} orders created`)

  // 7. Create subscription history log
  console.log('\n📝 Creating subscription history...')

  const historyEntries = [
    {
      subscriptionId: subscription.id,
      userId: user.id,
      changeType: 'SUBSCRIPTION_CREATED' as const,
      description: 'Assinatura criada via seed script',
      newValue: {
        planType: subscription.planType,
        monthlyValue: subscription.monthlyValue.toString(),
        status: subscription.status,
      },
      metadata: {
        source: 'seed-test-subscription.ts',
      },
    },
    {
      subscriptionId: subscription.id,
      userId: user.id,
      changeType: 'STATUS_CHANGE' as const,
      description: 'Assinatura ativada após primeiro pagamento',
      oldValue: { status: 'PENDING_ACTIVATION' },
      newValue: { status: 'ACTIVE' },
      metadata: {
        activatedAt: startDate.toISOString(),
      },
    },
  ]

  await prisma.subscriptionHistory.createMany({
    data: historyEntries,
  })

  console.log(`✅ ${historyEntries.length} history entries created`)

  // 8. Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test subscription seed completed successfully!')
  console.log('='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   User: ${user.email}`)
  console.log(`   User ID: ${user.id}`)
  console.log(`   Firebase UID: ${user.firebaseUid}`)
  console.log(`   Asaas Customer ID: ${user.asaasCustomerId}`)
  console.log(`\n   Subscription ID: ${subscription.id}`)
  console.log(`   Plan: ${subscription.planType}`)
  console.log(`   Status: ${subscription.status}`)
  console.log(`   Monthly Value: R$ ${subscription.monthlyValue}`)
  console.log(`   Next Billing: ${subscription.renewalDate.toLocaleDateString('pt-BR')}`)
  console.log(`\n   Benefits: ${benefits.length}`)
  console.log(`   Payments: ${payments.length}`)
  console.log(`   Orders: ${orders.length}`)
  console.log('\n🔗 Next Steps:')
  console.log('   1. Create a Stripe customer with this email: drphilipe.saraiva.oftalmo@gmail.com')
  console.log('   2. Update user.firebaseUid in Firebase Auth with custom claims:')
  console.log(`      stripeCustomerId: "cus_xxx..." (from Stripe)`)
  console.log('   3. Test the Stripe Portal integration in /area-assinante/dashboard')
  console.log('\n💡 Tip: Use Stripe test mode for safe testing')
  console.log('   Test card: 4242 4242 4242 4242')
  console.log('   Expiry: any future date')
  console.log('   CVC: any 3 digits')
  console.log('\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('\n❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
