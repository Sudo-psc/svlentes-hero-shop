/**
 * Test Database Seed Script
 *
 * Populates test database with fixtures for E2E testing
 *
 * Usage:
 *   npm run db:seed:test
 *   npx ts-node --esm e2e/seed-test-database.ts
 */

import { PrismaClient } from '@prisma/client'
import {
  ALL_TEST_USERS,
  ALL_TEST_SUBSCRIPTIONS,
  ALL_TEST_PRESCRIPTIONS,
  ALL_TEST_ORDERS,
  ALL_TEST_PAYMENTS
} from './fixtures/index'

const prisma = new PrismaClient()

async function seedTestDatabase() {
  console.log('🌱 Starting test database seeding...\n')

  try {
    // 1. Clear existing test data
    console.log('🗑️  Clearing existing test data...')
    await clearTestData()
    console.log('✅ Cleared existing test data\n')

    // 2. Seed Users
    console.log('👤 Seeding test users...')
    for (const user of ALL_TEST_USERS) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          firebaseUid: user.firebaseUid,
          phone: user.phone,
          cpf: user.cpf,
          role: user.id.includes('admin') ? 'ADMIN' : 'USER',
          createdAt: user.createdAt
        }
      })
      console.log(`  ✓ Created user: ${user.email}`)
    }
    console.log(`✅ Seeded ${ALL_TEST_USERS.length} users\n`)

    // 3. Seed Subscriptions
    console.log('📦 Seeding test subscriptions...')
    for (const subscription of ALL_TEST_SUBSCRIPTIONS) {
      await prisma.subscription.create({
        data: {
          id: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          nextBillingDate: subscription.nextBillingDate,
          billingCycle: subscription.billingCycle,
          price: subscription.price,
          shippingAddress: subscription.shippingAddress,
          lensSpecifications: subscription.lensSpecifications
        }
      })
      console.log(`  ✓ Created subscription: ${subscription.id} for user ${subscription.userId}`)
    }
    console.log(`✅ Seeded ${ALL_TEST_SUBSCRIPTIONS.length} subscriptions\n`)

    // 4. Seed Prescriptions
    // NOTE: Prescription model not yet implemented in schema - commenting out for now
    console.log('📄 Skipping prescriptions (model not yet in schema)...')
    // console.log('📄 Seeding test prescriptions...')
    // for (const prescription of ALL_TEST_PRESCRIPTIONS) {
    //   await prisma.prescription.create({
    //     data: {
    //       id: prescription.id,
    //       userId: prescription.userId,
    //       subscriptionId: prescription.subscriptionId,
    //       fileName: prescription.fileName,
    //       fileUrl: prescription.fileUrl,
    //       fileType: prescription.fileType,
    //       fileSize: prescription.fileSize,
    //       doctorName: prescription.doctorName,
    //       doctorCRM: prescription.doctorCRM,
    //       issueDate: prescription.issueDate,
    //       expiryDate: prescription.expiryDate,
    //       rightEye: prescription.rightEye,
    //       leftEye: prescription.leftEye,
    //       status: prescription.status
    //     }
    //   })
    //   console.log(`  ✓ Created prescription: ${prescription.id} for user ${prescription.userId}`)
    // }
    // console.log(`✅ Seeded ${ALL_TEST_PRESCRIPTIONS.length} prescriptions\n`)

    // 5. Seed Orders
    console.log('📦 Seeding test orders...')
    for (const order of ALL_TEST_ORDERS) {
      await prisma.order.create({
        data: {
          id: order.id,
          userId: order.userId,
          subscriptionId: order.subscriptionId,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          trackingCode: order.trackingCode,
          courier: order.courier,
          items: order.items,
          totalPrice: order.totalPrice,
          shippingAddress: order.shippingAddress
        }
      })
      console.log(`  ✓ Created order: ${order.orderNumber} for user ${order.userId}`)
    }
    console.log(`✅ Seeded ${ALL_TEST_ORDERS.length} orders\n`)

    // 6. Seed Payments
    console.log('💳 Seeding test payments...')
    for (const payment of ALL_TEST_PAYMENTS) {
      await prisma.payment.create({
        data: {
          id: payment.id,
          userId: payment.userId,
          subscriptionId: payment.subscriptionId,
          orderId: payment.orderId,
          transactionId: payment.transactionId,
          status: payment.status === 'FAILED' ? 'CANCELLED' : payment.status,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          metadata: payment.cardLastFour ? {
            cardLastFour: payment.cardLastFour,
            cardBrand: payment.cardBrand
          } : undefined
        }
      })
      console.log(`  ✓ Created payment: ${payment.id} (${payment.status})`)
    }
    console.log(`✅ Seeded ${ALL_TEST_PAYMENTS.length} payments\n`)

    // 7. Create DeliveryPreferences for test users
    // NOTE: DeliveryPreferences model not yet implemented in schema - commenting out for now
    console.log('🚚 Skipping delivery preferences (model not yet in schema)...')
    // console.log('🚚 Seeding delivery preferences...')
    // for (const subscription of ALL_TEST_SUBSCRIPTIONS) {
    //   await prisma.deliveryPreferences.create({
    //     data: {
    //       subscriptionId: subscription.id,
    //       preferredDeliveryDay: 'ANY',
    //       deliveryInstructions: 'Deixar com porteiro',
    //       notificationPreferences: {
    //         email: true,
    //         sms: true,
    //         whatsapp: true
    //       }
    //     }
    //   })
    //   console.log(`  ✓ Created delivery preferences for subscription ${subscription.id}`)
    // }
    // console.log(`✅ Seeded delivery preferences\n`)

    console.log('🎉 Test database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - ${ALL_TEST_USERS.length} users`)
    console.log(`  - ${ALL_TEST_SUBSCRIPTIONS.length} subscriptions`)
    console.log(`  - ${ALL_TEST_PRESCRIPTIONS.length} prescriptions`)
    console.log(`  - ${ALL_TEST_ORDERS.length} orders`)
    console.log(`  - ${ALL_TEST_PAYMENTS.length} payments`)
    console.log(`  - ${ALL_TEST_SUBSCRIPTIONS.length} delivery preferences`)

  } catch (error) {
    console.error('❌ Error seeding test database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function clearTestData() {
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.deliveryPreferences.deleteMany({
    where: {
      subscription: {
        id: {
          startsWith: 'test_'
        }
      }
    }
  })

  await prisma.payment.deleteMany({
    where: {
      id: {
        startsWith: 'test_'
      }
    }
  })

  await prisma.order.deleteMany({
    where: {
      id: {
        startsWith: 'test_'
      }
    }
  })

  await prisma.prescription.deleteMany({
    where: {
      id: {
        startsWith: 'test_'
      }
    }
  })

  await prisma.subscription.deleteMany({
    where: {
      id: {
        startsWith: 'test_'
      }
    }
  })

  await prisma.user.deleteMany({
    where: {
      id: {
        startsWith: 'test_'
      }
    }
  })

  // Also clear audit logs for test users
  await prisma.auditLog.deleteMany({
    where: {
      userId: {
        startsWith: 'test_'
      }
    }
  })
}

/**
 * Clear test database (utility function)
 */
export async function clearTestDatabase() {
  console.log('🗑️  Clearing test database...')
  await clearTestData()
  console.log('✅ Test database cleared')
  await prisma.$disconnect()
}

// Run seed if called directly
if (require.main === module) {
  seedTestDatabase()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedTestDatabase }
