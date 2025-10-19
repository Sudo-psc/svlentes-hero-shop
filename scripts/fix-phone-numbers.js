#!/usr/bin/env node

/**
 * Fix Dr. Philipe's phone number to match WhatsApp number
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPhoneNumbers() {
  console.log('\n🔧 Fixing phone number mismatch')
  console.log('=' .repeat(60))

  try {
    // Update Dr. Philipe's record to have full phone number
    const updated = await prisma.user.update({
      where: {
        id: 'cmgwgd5bu0000kotq7b3e379f'
      },
      data: {
        phone: '553299929969',
        whatsapp: '+553299929969'
      }
    })

    console.log('✅ Updated user record:')
    console.log('   ID:', updated.id)
    console.log('   Name:', updated.name)
    console.log('   Email:', updated.email)
    console.log('   Phone:', updated.phone, '← Updated')
    console.log('   WhatsApp:', updated.whatsapp, '← Updated')

    // Optionally delete the duplicate temp record
    console.log('\n🗑️ Deleting duplicate temporary record...')
    const deleted = await prisma.user.delete({
      where: {
        id: 'cmgv1xv2k0000kot7tqx2y9an'
      }
    })

    console.log('✅ Deleted temporary record:')
    console.log('   ID:', deleted.id)
    console.log('   Email:', deleted.email)

    console.log('\n✅ Phone number sync complete!')
    console.log('   WhatsApp messages from 553299929969 will now find the correct user')
    console.log('   User has ACTIVE subscription status')

  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixPhoneNumbers()
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
