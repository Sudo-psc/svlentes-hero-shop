/**
 * Simplified Test Database Seed Script
 * Uses only existing Prisma models
 */

import { PrismaClient } from '@prisma/client'
import {
  ALL_TEST_USERS,
  ALL_TEST_SUBSCRIPTIONS,
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
          // Note: firebaseUid, phone, cpf fields may not exist - adjust as needed
          emailVerified: new Date(),
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
          planType: subscription.planId,
          status: subscription.status,
          monthlyValue: subscription.price,
          startDate: subscription.startDate,
          renewalDate: subscription.nextBillingDate,
          nextBillingDate: subscription.nextBillingDate,
          paymentMethod: 'CREDIT_CARD',
          shippingAddress: subscription.shippingAddress
        }
      })
      console.log(`  ✓ Created subscription: ${subscription.id}`)
    }
    console.log(`✅ Seeded ${ALL_TEST_SUBSCRIPTIONS.length} subscriptions\n`)

    // 4. Seed Orders
    console.log('📦 Seeding test orders...')
    for (const order of ALL_TEST_ORDERS) {
      // Map order status to payment status
      const paymentStatus =
        order.status === 'DELIVERED' || order.status === 'SHIPPED' ? 'paid' :
        order.status === 'CANCELLED' ? 'refunded' :
        'pending'

      // Map fixture status to Prisma DeliveryStatus enum
      const deliveryStatus =
        order.status === 'pending_payment' ? 'PENDING' :
        order.status === 'PROCESSING' ? 'PENDING' :
        order.status === 'SHIPPED' ? 'SHIPPED' :
        order.status === 'IN_TRANSIT' ? 'IN_TRANSIT' :
        order.status === 'DELIVERED' ? 'DELIVERED' :
        order.status === 'CANCELLED' ? 'CANCELLED' :
        'PENDING'

      await prisma.order.create({
        data: {
          id: order.id,
          subscriptionId: order.subscriptionId,
          deliveryStatus,  // Use mapped delivery status
          type: 'subscription',  // All test orders are subscription orders
          paymentStatus,  // Based on order status
          totalAmount: order.totalPrice,
          trackingCode: order.trackingCode,  // Tracking code for delivery
          deliveryAddress: order.shippingAddress,  // Delivery address JSON
          products: order.items,  // Order items as JSON
          orderDate: order.createdAt,
          deliveredAt: order.deliveredAt,  // When order was delivered (if applicable)
          createdAt: order.createdAt
        }
      })
      console.log(`  ✓ Created order: ${order.orderNumber}`)
    }
    console.log(`✅ Seeded ${ALL_TEST_ORDERS.length} orders\n`)

    // 5. Seed Payments
    console.log('💳 Seeding test payments...')
    for (const payment of ALL_TEST_PAYMENTS) {
      // Map payment method to Asaas billing type
      const billingType =
        payment.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' :
        payment.paymentMethod === 'PIX' ? 'PIX' :
        payment.paymentMethod === 'BOLETO' ? 'BOLETO' :
        'UNDEFINED'

      // Set due date based on payment status
      const dueDate = payment.paidAt || payment.createdAt

      await prisma.payment.create({
        data: {
          id: payment.id,
          userId: payment.userId,
          subscriptionId: payment.subscriptionId,
          asaasPaymentId: payment.transactionId,
          asaasCustomerId: `asaas_cust_${payment.userId.slice(-3)}`,  // Generate test customer ID
          amount: payment.amount,
          status: payment.status === 'CONFIRMED' ? 'RECEIVED' :
                  payment.status === 'FAILED' ? 'CANCELLED' : payment.status,
          billingType,  // Asaas billing type (replaces paymentMethod)
          dueDate,  // Payment due date
          createdAt: payment.createdAt
        }
      })
      console.log(`  ✓ Created payment: ${payment.id} (${payment.status})`)
    }
    console.log(`✅ Seeded ${ALL_TEST_PAYMENTS.length} payments\n`)

    console.log('🎉 Test database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - ${ALL_TEST_USERS.length} users`)
    console.log(`  - ${ALL_TEST_SUBSCRIPTIONS.length} subscriptions`)
    console.log(`  - ${ALL_TEST_ORDERS.length} orders`)
    console.log(`  - ${ALL_TEST_PAYMENTS.length} payments`)

  } catch (error) {
    console.error('❌ Error seeding test database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function clearTestData() {
  // Delete in reverse order of dependencies
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

  // Clear audit logs if they exist
  try {
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          startsWith: 'test_'
        }
      }
    })
  } catch (e) {
    // AuditLog might not exist yet
  }
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
