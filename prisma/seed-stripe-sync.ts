import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

// Initialize Stripe with test key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not found in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
})

async function main() {
  console.log('🔄 Syncing Stripe test data with database...')
  console.log('📝 Using Stripe API version: 2024-11-20.acacia')

  // Validate required environment variables
  const requiredEnvVars = [
    'TEST_USER_EMAIL',
    'TEST_USER_UID',
    'STRIPE_TEST_CUSTOMER_1',
    'STRIPE_TEST_SUBSCRIPTION_1',
    'TEST_USER_2_EMAIL',
    'TEST_USER_2_UID',
    'STRIPE_TEST_CUSTOMER_2',
    'STRIPE_TEST_SUBSCRIPTION_2'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // 1. Sync User 1 (test@example.com)
  console.log('\n👤 Syncing User 1...')
  const user1 = await prisma.user.upsert({
    where: { email: process.env.TEST_USER_EMAIL! },
    update: {
      firebaseUid: process.env.TEST_USER_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_1!,
      emailVerified: true
    },
    create: {
      email: process.env.TEST_USER_EMAIL!,
      name: 'Usuario Teste A',
      firebaseUid: process.env.TEST_USER_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_1!,
      emailVerified: true
    }
  })

  console.log(`✅ User 1 synced:`)
  console.log(`   Email: ${user1.email}`)
  console.log(`   Firebase UID: ${user1.firebaseUid}`)
  console.log(`   Stripe Customer: ${user1.stripeCustomerId}`)

  // 2. Sync User 2 (usuario.a@test.svlentes.shop)
  console.log('\n👤 Syncing User 2...')
  const user2 = await prisma.user.upsert({
    where: { email: process.env.TEST_USER_2_EMAIL! },
    update: {
      firebaseUid: process.env.TEST_USER_2_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_2!,
      emailVerified: true
    },
    create: {
      email: process.env.TEST_USER_2_EMAIL!,
      name: 'Usuario A',
      firebaseUid: process.env.TEST_USER_2_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_2!,
      emailVerified: true
    }
  })

  console.log(`✅ User 2 synced:`)
  console.log(`   Email: ${user2.email}`)
  console.log(`   Firebase UID: ${user2.firebaseUid}`)
  console.log(`   Stripe Customer: ${user2.stripeCustomerId}`)

  // 3. Fetch and sync subscription 1 from Stripe
  console.log('\n📦 Syncing Subscription 1...')
  try {
    const sub1 = await stripe.subscriptions.retrieve(
      process.env.STRIPE_TEST_SUBSCRIPTION_1!,
      { expand: ['default_payment_method', 'items.data.price.product'] }
    )

    console.log(`   Stripe Subscription: ${sub1.id}`)
    console.log(`   Status: ${sub1.status}`)
    console.log(`   Current Period: ${new Date(sub1.current_period_start * 1000).toISOString()} - ${new Date(sub1.current_period_end * 1000).toISOString()}`)

    // Get product ID from subscription items
    const priceId = sub1.items.data[0].price.id
    const productId = typeof sub1.items.data[0].price.product === 'string'
      ? sub1.items.data[0].price.product
      : sub1.items.data[0].price.product.id

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub1.id },
      update: {
        status: sub1.status.toUpperCase() as any,
        currentPeriodEnd: new Date(sub1.current_period_end * 1000),
        currentPeriodStart: new Date(sub1.current_period_start * 1000),
        cancelAtPeriodEnd: sub1.cancel_at_period_end
      },
      create: {
        userId: user1.id,
        stripeSubscriptionId: sub1.id,
        stripePriceId: priceId,
        stripeProductId: productId,
        status: sub1.status.toUpperCase() as any,
        currentPeriodStart: new Date(sub1.current_period_start * 1000),
        currentPeriodEnd: new Date(sub1.current_period_end * 1000),
        cancelAtPeriodEnd: sub1.cancel_at_period_end
      }
    })

    console.log(`✅ Subscription 1 synced:`)
    console.log(`   ID: ${sub1.id}`)
    console.log(`   Product: ${productId}`)
    console.log(`   Price: ${priceId}`)
  } catch (error) {
    console.error(`❌ Failed to sync Subscription 1:`, error)
    throw error
  }

  // 4. Fetch and sync subscription 2 from Stripe
  console.log('\n📦 Syncing Subscription 2...')
  try {
    const sub2 = await stripe.subscriptions.retrieve(
      process.env.STRIPE_TEST_SUBSCRIPTION_2!,
      { expand: ['default_payment_method', 'items.data.price.product'] }
    )

    console.log(`   Stripe Subscription: ${sub2.id}`)
    console.log(`   Status: ${sub2.status}`)
    console.log(`   Current Period: ${new Date(sub2.current_period_start * 1000).toISOString()} - ${new Date(sub2.current_period_end * 1000).toISOString()}`)

    // Get product ID from subscription items
    const priceId = sub2.items.data[0].price.id
    const productId = typeof sub2.items.data[0].price.product === 'string'
      ? sub2.items.data[0].price.product
      : sub2.items.data[0].price.product.id

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub2.id },
      update: {
        status: sub2.status.toUpperCase() as any,
        currentPeriodEnd: new Date(sub2.current_period_end * 1000),
        currentPeriodStart: new Date(sub2.current_period_start * 1000),
        cancelAtPeriodEnd: sub2.cancel_at_period_end
      },
      create: {
        userId: user2.id,
        stripeSubscriptionId: sub2.id,
        stripePriceId: priceId,
        stripeProductId: productId,
        status: sub2.status.toUpperCase() as any,
        currentPeriodStart: new Date(sub2.current_period_start * 1000),
        currentPeriodEnd: new Date(sub2.current_period_end * 1000),
        cancelAtPeriodEnd: sub2.cancel_at_period_end
      }
    })

    console.log(`✅ Subscription 2 synced:`)
    console.log(`   ID: ${sub2.id}`)
    console.log(`   Product: ${productId}`)
    console.log(`   Price: ${priceId}`)
  } catch (error) {
    console.error(`❌ Failed to sync Subscription 2:`, error)
    throw error
  }

  console.log('\n🎉 Stripe sync completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 2 users synced`)
  console.log(`   - 2 subscriptions synced`)
  console.log(`   - All data linked with Firebase UIDs and Stripe IDs`)
}

main()
  .catch((e) => {
    console.error('\n❌ Sync failed with error:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
