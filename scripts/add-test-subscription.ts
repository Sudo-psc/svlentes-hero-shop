#!/usr/bin/env tsx
/**
 * Script para adicionar assinatura de teste para Dr. Philipe
 *
 * Uso: npx tsx scripts/add-test-subscription.ts
 */

import { PrismaClient, SubscriptionStatus, PaymentMethod } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando criação de assinatura de teste...\n')

  const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com'
  const testPhone = '+5533986061427'

  try {
    // 1. Verificar se usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (!user) {
      console.log('👤 Criando usuário de teste...')
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Dr. Philipe Saraiva Cruz',
          phone: testPhone,
          whatsapp: testPhone,
          role: 'subscriber',
          emailVerified: new Date(),
          firebaseUid: `test-${Date.now()}`,
          preferences: {
            notifications: {
              email: true,
              whatsapp: true,
              sms: false
            }
          }
        }
      })
      console.log(`✅ Usuário criado: ${user.id}\n`)
    } else {
      console.log(`✅ Usuário já existe: ${user.id}\n`)
    }

    // 2. Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING_ACTIVATION]
        }
      }
    })

    if (existingSubscription) {
      console.log('⚠️  Usuário já possui assinatura ativa!')
      console.log(`   ID: ${existingSubscription.id}`)
      console.log(`   Plano: ${existingSubscription.planType}`)
      console.log(`   Status: ${existingSubscription.status}\n`)

      const answer = await prompt('Deseja criar uma nova assinatura mesmo assim? (s/n): ')
      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada pelo usuário.')
        return
      }
    }

    // 3. Criar assinatura de teste
    console.log('📦 Criando assinatura de teste...')

    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planType: 'Plano Mensal Premium - Lentes Diárias',
        status: SubscriptionStatus.ACTIVE,
        monthlyValue: 149.90,
        startDate: today,
        renewalDate: nextMonth,
        nextBillingDate: nextMonth,
        paymentMethod: PaymentMethod.PIX,
        activatedAt: today,
        lensType: 'Lentes de Descarte Diário',
        bothEyes: true,
        differentGrades: false,
        shippingAddress: {
          street: 'Rua Exemplo',
          number: '123',
          complement: 'Sala 101',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-000',
          country: 'Brasil'
        },
        contactInfo: {
          phone: testPhone,
          email: testEmail,
          whatsapp: testPhone
        },
        metadata: {
          isTestSubscription: true,
          createdBy: 'add-test-subscription script',
          createdAt: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Assinatura criada: ${subscription.id}`)
    console.log(`   Plano: ${subscription.planType}`)
    console.log(`   Valor: R$ ${subscription.monthlyValue}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Próxima cobrança: ${subscription.nextBillingDate?.toLocaleDateString('pt-BR')}\n`)

    // 4. Adicionar benefícios da assinatura
    console.log('🎁 Adicionando benefícios da assinatura...')

    const benefits = [
      {
        benefitName: 'Lentes de Contato Mensais',
        benefitDescription: 'Par de lentes de contato de descarte diário entregues mensalmente',
        benefitIcon: '👁️',
        benefitType: 'LIMITED' as const,
        quantityTotal: 30,
        quantityUsed: 0,
        expirationDate: nextMonth
      },
      {
        benefitName: 'Frete Grátis',
        benefitDescription: 'Entrega gratuita em todo o Brasil',
        benefitIcon: '🚚',
        benefitType: 'UNLIMITED' as const
      },
      {
        benefitName: 'Suporte Prioritário',
        benefitDescription: 'Atendimento prioritário via WhatsApp',
        benefitIcon: '💬',
        benefitType: 'UNLIMITED' as const
      },
      {
        benefitName: 'Consulta Médica Online',
        benefitDescription: 'Consulta médica online inclusa',
        benefitIcon: '👨‍⚕️',
        benefitType: 'LIMITED' as const,
        quantityTotal: 1,
        quantityUsed: 0,
        expirationDate: nextMonth
      }
    ]

    for (const benefit of benefits) {
      await prisma.subscriptionBenefit.create({
        data: {
          subscriptionId: subscription.id,
          ...benefit
        }
      })
      console.log(`   ✅ ${benefit.benefitIcon} ${benefit.benefitName}`)
    }

    // 5. Criar histórico de assinatura
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        userId: user.id,
        changeType: 'SUBSCRIPTION_CREATED',
        description: 'Assinatura de teste criada via script',
        newValue: {
          planType: subscription.planType,
          status: subscription.status,
          monthlyValue: subscription.monthlyValue.toString()
        },
        metadata: {
          createdBy: 'add-test-subscription script',
          isTestSubscription: true
        }
      }
    })

    console.log('\n✅ Assinatura de teste criada com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   👤 Usuário: ${user.name} (${user.email})`)
    console.log(`   📦 Assinatura: ${subscription.id}`)
    console.log(`   💰 Plano: ${subscription.planType}`)
    console.log(`   💵 Valor: R$ ${subscription.monthlyValue}`)
    console.log(`   📅 Próxima cobrança: ${subscription.nextBillingDate?.toLocaleDateString('pt-BR')}`)
    console.log(`   🎁 Benefícios: ${benefits.length}`)
    console.log('\n🔗 Acesse o painel: https://svlentes.shop/area-assinante/dashboard')

  } catch (error) {
    console.error('❌ Erro ao criar assinatura de teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function for simple prompt (Node.js)
async function prompt(question: string): Promise<string> {
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close()
      resolve(answer)
    })
  })
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
