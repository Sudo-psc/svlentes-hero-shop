#!/usr/bin/env node

/**
 * Check all subscriptions in database
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSubscriptions() {
  console.log('\n📦 All Subscriptions in Database')
  console.log('=' .repeat(60))

  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Total subscriptions: ${subscriptions.length}\n`)

    subscriptions.forEach((sub, i) => {
      console.log(`${i + 1}. Subscription ID: ${sub.id}`)
      console.log(`   User: ${sub.user.name} (${sub.user.email})`)
      console.log(`   Phone: ${sub.user.phone || 'N/A'}`)
      console.log(`   WhatsApp: ${sub.user.whatsapp || 'N/A'}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Plan: ${sub.planId}`)
      console.log(`   Created: ${sub.createdAt}`)
      console.log(`   Next billing: ${sub.nextBillingDate || 'N/A'}`)
      console.log('')
    })

    // Check user with email drphilipe.saraiva.oftalmo@gmail.com
    console.log('\n🔍 Checking user: drphilipe.saraiva.oftalmo@gmail.com')
    const philipeUser = await prisma.user.findUnique({
      where: { email: 'drphilipe.saraiva.oftalmo@gmail.com' },
      include: {
        subscriptions: true
      }
    })

    if (philipeUser) {
      console.log('✅ User found:')
      console.log('   ID:', philipeUser.id)
      console.log('   Name:', philipeUser.name)
      console.log('   Phone:', philipeUser.phone)
      console.log('   WhatsApp:', philipeUser.whatsapp)
      console.log('   Subscriptions:', philipeUser.subscriptions.length)

      if (philipeUser.subscriptions.length > 0) {
        console.log('\n   Subscriptions:')
        philipeUser.subscriptions.forEach((sub, i) => {
          console.log(`   ${i + 1}. Status: ${sub.status} | Plan: ${sub.planId}`)
        })
      }
    }

  } catch (error) {
    console.error('\n❌ Database error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkSubscriptions()
  .then(() => {
    console.log('\n' + '='.repeat(60))
    console.log('Complete')
    console.log('='.repeat(60) + '\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nFailed:', error)
    process.exit(1)
  })
