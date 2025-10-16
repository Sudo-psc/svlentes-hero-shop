import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Limpar dados existentes (apenas em desenvolvimento!)
  console.log('🗑️  Cleaning existing data...')
  await prisma.order.deleteMany()
  await prisma.subscriptionBenefit.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Criar usuário de teste com senha hasheada
  console.log('👤 Creating test user...')
  const hashedPassword = await bcrypt.hash('teste123', 10)

  const testUser = await prisma.user.create({
    data: {
      name: 'Usuário Teste',
      email: 'teste@svlentes.com.br',
      password: hashedPassword,
      role: 'subscriber',
      emailVerified: new Date(),
      avatarUrl: null,
      googleId: null,
      image: null
    }
  })

  console.log(`✅ User created: ${testUser.email} (Password: teste123)`)

  // Criar assinatura ativa para o usuário
  console.log('📦 Creating active subscription...')
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const subscription = await prisma.subscription.create({
    data: {
      userId: testUser.id,
      planType: 'Lentes Diárias Mensal',
      status: 'ACTIVE',
      monthlyValue: 149.90,
      startDate: today,
      renewalDate: nextMonth,
      paymentMethod: 'PIX',
      paymentMethodLast4: null,
      shippingAddress: {
        street: 'Rua Principal',
        number: '123',
        neighborhood: 'Centro',
        city: 'Caratinga',
        state: 'MG',
        zipCode: '35300-000',
        complement: 'Apto 101'
      }
    }
  })

  console.log(`✅ Subscription created: ${subscription.id}`)

  // Criar benefícios da assinatura
  console.log('🎁 Creating subscription benefits...')
  const benefits = await prisma.subscriptionBenefit.createMany({
    data: [
      {
        subscriptionId: subscription.id,
        benefitName: 'Lentes de contato diárias',
        benefitDescription: 'Lentes descartáveis de uso diário com alta qualidade e conforto',
        benefitIcon: '👁️',
        benefitType: 'UNLIMITED',
        quantityTotal: null,
        quantityUsed: 0
      },
      {
        subscriptionId: subscription.id,
        benefitName: 'Entrega mensal programada',
        benefitDescription: 'Receba suas lentes todo mês sem preocupação, direto na sua casa',
        benefitIcon: '📦',
        benefitType: 'UNLIMITED',
        quantityTotal: null,
        quantityUsed: 0
      },
      {
        subscriptionId: subscription.id,
        benefitName: 'Suporte médico 24/7',
        benefitDescription: 'Acesso direto ao Dr. Philipe Saraiva Cruz via WhatsApp',
        benefitIcon: '👨‍⚕️',
        benefitType: 'UNLIMITED',
        quantityTotal: null,
        quantityUsed: 0
      },
      {
        subscriptionId: subscription.id,
        benefitName: 'Consultas de acompanhamento',
        benefitDescription: 'Até 2 consultas de acompanhamento por ano',
        benefitIcon: '🏥',
        benefitType: 'LIMITED',
        quantityTotal: 2,
        quantityUsed: 0,
        expirationDate: new Date(new Date().getFullYear(), 11, 31) // 31 de dezembro
      }
    ]
  })

  console.log(`✅ Created ${benefits.count} subscription benefits`)

  // Criar pedido de teste
  console.log('📋 Creating test order...')
  const order = await prisma.order.create({
    data: {
      subscriptionId: subscription.id,
      orderDate: today,
      shippingDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 dias depois
      deliveryStatus: 'SHIPPED',
      trackingCode: 'BR123456789PT',
      deliveryAddress: {
        street: 'Rua Principal',
        number: '123',
        neighborhood: 'Centro',
        city: 'Caratinga',
        state: 'MG',
        zipCode: '35300-000',
        complement: 'Apto 101'
      },
      products: [
        {
          name: 'Lentes Diárias - Caixa com 30 unidades',
          quantity: 2,
          prescription: {
            rightEye: {
              spherical: -2.00,
              cylindrical: -0.50,
              axis: 180
            },
            leftEye: {
              spherical: -1.75,
              cylindrical: -0.25,
              axis: 90
            }
          }
        }
      ]
    }
  })

  console.log(`✅ Order created: ${order.id}`)

  // Criar usuário adicional sem assinatura (para teste de novos cadastros)
  console.log('👤 Creating user without subscription...')
  const hashedPassword2 = await bcrypt.hash('novousuario123', 10)

  const newUser = await prisma.user.create({
    data: {
      name: 'Novo Usuário',
      email: 'novo@svlentes.com.br',
      password: hashedPassword2,
      role: 'subscriber',
      emailVerified: null,
      avatarUrl: null,
      googleId: null,
      image: null
    }
  })

  console.log(`✅ New user created: ${newUser.email} (Password: novousuario123)`)

  console.log('\n✨ Database seeding completed successfully!')
  console.log('\n📝 Test Credentials:')
  console.log('   Email: teste@svlentes.com.br')
  console.log('   Password: teste123')
  console.log('\n📝 New User (no subscription):')
  console.log('   Email: novo@svlentes.com.br')
  console.log('   Password: novousuario123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })