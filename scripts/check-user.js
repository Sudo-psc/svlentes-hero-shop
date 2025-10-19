#!/usr/bin/env node

/**
 * Database User Investigation Script
 * Checks why subscription validation is failing for phone 553299929969
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const PHONE = '553299929969'

async function investigateUser() {
  console.log('\n🔍 Investigating user authentication issue')
  console.log('=' .repeat(60))
  console.log(`Phone number: ${PHONE}`)
  console.log('=' .repeat(60))

  try {
    // 1. Try exact match on phone field
    console.log('\n📞 Checking phone field (exact match)...')
    const userByPhone = await prisma.user.findFirst({
      where: { phone: PHONE },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (userByPhone) {
      console.log('✅ User found via phone field:')
      console.log('  ID:', userByPhone.id)
      console.log('  Name:', userByPhone.name)
      console.log('  Email:', userByPhone.email)
      console.log('  Phone:', userByPhone.phone)
      console.log('  WhatsApp:', userByPhone.whatsapp || 'N/A')
      console.log('  Total subscriptions:', userByPhone.subscriptions.length)

      if (userByPhone.subscriptions.length > 0) {
        console.log('\n📦 Subscriptions:')
        userByPhone.subscriptions.forEach((sub, i) => {
          console.log(`  ${i + 1}. Status: ${sub.status} | Plan: ${sub.planId} | Created: ${sub.createdAt}`)
        })
      }
    } else {
      console.log('❌ No user found with phone =', PHONE)
    }

    // 2. Try exact match on whatsapp field
    console.log('\n💬 Checking whatsapp field (exact match)...')
    const userByWhatsApp = await prisma.user.findFirst({
      where: { whatsapp: PHONE },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (userByWhatsApp) {
      console.log('✅ User found via whatsapp field:')
      console.log('  ID:', userByWhatsApp.id)
      console.log('  Name:', userByWhatsApp.name)
      console.log('  Email:', userByWhatsApp.email)
      console.log('  Phone:', userByWhatsApp.phone || 'N/A')
      console.log('  WhatsApp:', userByWhatsApp.whatsapp)
      console.log('  Total subscriptions:', userByWhatsApp.subscriptions.length)

      if (userByWhatsApp.subscriptions.length > 0) {
        console.log('\n📦 Subscriptions:')
        userByWhatsApp.subscriptions.forEach((sub, i) => {
          console.log(`  ${i + 1}. Status: ${sub.status} | Plan: ${sub.planId} | Created: ${sub.createdAt}`)
        })
      }
    } else {
      console.log('❌ No user found with whatsapp =', PHONE)
    }

    // 3. Try with OR condition (like auth handler does)
    console.log('\n🔄 Checking with OR condition (phone OR whatsapp)...')
    const userByOr = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: PHONE },
          { whatsapp: PHONE }
        ]
      },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'PAUSED', 'OVERDUE', 'SUSPENDED']
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (userByOr) {
      console.log('✅ User found via OR condition:')
      console.log('  ID:', userByOr.id)
      console.log('  Name:', userByOr.name)
      console.log('  Email:', userByOr.email)
      console.log('  Phone:', userByOr.phone || 'N/A')
      console.log('  WhatsApp:', userByOr.whatsapp || 'N/A')
      console.log('  Active subscriptions:', userByOr.subscriptions.length)

      if (userByOr.subscriptions.length > 0) {
        console.log('\n📦 Active Subscriptions:')
        userByOr.subscriptions.forEach((sub, i) => {
          console.log(`  ${i + 1}. Status: ${sub.status} | Plan: ${sub.planId} | Created: ${sub.createdAt}`)
        })
      } else {
        console.log('\n⚠️ No subscriptions with status: ACTIVE, PAUSED, OVERDUE, or SUSPENDED')
      }

      // Check validation logic
      const hasActiveSubscription = userByOr.subscriptions && userByOr.subscriptions.length > 0
      console.log('\n🧪 Validation check:')
      console.log('  hasActiveSubscription =', hasActiveSubscription)

      if (!hasActiveSubscription) {
        console.log('\n❌ This is why authentication failed!')
        console.log('   User found but no active subscriptions matching criteria')
      }
    } else {
      console.log('❌ No user found with phone OR whatsapp =', PHONE)
    }

    // 4. List all users to check phone formats
    console.log('\n📋 All users in database (to check phone formats):')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        whatsapp: true,
        email: true
      }
    })

    console.log(`Total users: ${allUsers.length}`)
    allUsers.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.name || 'Unnamed'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email || 'N/A'}`)
      console.log(`   Phone: ${user.phone || 'N/A'}`)
      console.log(`   WhatsApp: ${user.whatsapp || 'N/A'}`)
    })

    // 5. Check if phone with variations exists
    console.log('\n🔎 Searching for phone number variations...')
    const variations = [
      PHONE,
      `+${PHONE}`,
      PHONE.replace(/^55/, ''),
      `+55${PHONE.replace(/^55/, '')}`
    ]

    for (const variant of variations) {
      const found = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: variant },
            { whatsapp: variant }
          ]
        }
      })

      if (found) {
        console.log(`✅ Found with variant: "${variant}"`)
        console.log(`   User: ${found.name} (${found.email})`)
      }
    }

  } catch (error) {
    console.error('\n❌ Database error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute
investigateUser()
  .then(() => {
    console.log('\n' + '='.repeat(60))
    console.log('Investigation complete')
    console.log('='.repeat(60) + '\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nInvestigation failed:', error)
    process.exit(1)
  })
