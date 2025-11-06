import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * API Route: List Stripe Products and Prices
 *
 * Fetches all active products and their prices from Stripe
 * for display in pricing pages and subscription management.
 *
 * @route GET /api/stripe/products
 * @access Public (no auth required for product listing)
 *
 * @returns {object} { products: StripeProduct[] }
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/stripe/products')
 * const { products } = await response.json()
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch all active products with prices
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // 2. Fetch all active prices for these products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    })

    // 3. Build product list with associated prices
    const productList = products.data.map(product => {
      // Find all prices for this product
      const productPrices = prices.data.filter(
        price => typeof price.product === 'string'
          ? price.product === product.id
          : price.product.id === product.id
      )

      // Sort prices by amount (lowest first)
      const sortedPrices = productPrices.sort((a, b) => {
        const amountA = a.unit_amount || 0
        const amountB = b.unit_amount || 0
        return amountA - amountB
      })

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        active: product.active,
        prices: sortedPrices.map(price => ({
          id: price.id,
          currency: price.currency,
          unit_amount: price.unit_amount,
          recurring: price.recurring ? {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          } : null,
          type: price.type,
          active: price.active,
        })),
        // Get the default/lowest price
        defaultPrice: sortedPrices[0] ? {
          id: sortedPrices[0].id,
          amount: sortedPrices[0].unit_amount || 0,
          currency: sortedPrices[0].currency,
          recurring: sortedPrices[0].recurring,
        } : null,
      }
    })

    // 4. Filter out products with no prices
    const validProducts = productList.filter(p => p.prices.length > 0)

    // 5. Sort by metadata.sort_order if available, otherwise by price
    const sortedProducts = validProducts.sort((a, b) => {
      const sortOrderA = parseInt(a.metadata.sort_order || '999', 10)
      const sortOrderB = parseInt(b.metadata.sort_order || '999', 10)

      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB
      }

      // Fallback to price sorting
      const priceA = a.defaultPrice?.amount || 0
      const priceB = b.defaultPrice?.amount || 0
      return priceA - priceB
    })

    return NextResponse.json({
      products: sortedProducts,
      count: sortedProducts.length,
    }, { status: 200 })

  } catch (error: any) {
    console.error('[STRIPE_PRODUCTS_ERROR]', error)

    return NextResponse.json(
      {
        error: 'Erro ao buscar produtos',
        message: 'Não foi possível carregar os planos disponíveis. Tente novamente.'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
