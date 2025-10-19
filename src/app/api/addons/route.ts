/**
 * GET /api/addons
 * POST /api/addons
 * API endpoints for managing add-ons
 */

import { NextRequest, NextResponse } from 'next/server'
import { addOnsData, addOnBundles } from '@/data/add-ons'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeBundles = searchParams.get('includeBundles') === 'true'

    let addons = addOnsData

    // Filter by category if specified
    if (category) {
      addons = addons.filter(addon => addon.type === category)
    }

    const response: any = {
      success: true,
      data: {
        addons,
        categories: {
          medical: {
            name: 'Serviços Médicos',
            description: 'Consultas e acompanhamento especializado',
            types: ['consulta', 'teleorientacao']
          },
          protection: {
            name: 'Proteção e Seguro',
            description: 'Segurança para suas lentes e investimento',
            types: ['seguro']
          },
          premium: {
            name: 'Experiência Premium',
            description: 'Atendimento diferenciado e exclusivo',
            types: ['vip']
          }
        }
      }
    }

    // Include bundles if requested
    if (includeBundles) {
      response.data.bundles = addOnBundles
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('AddOns API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addonIds } = body

    if (!addonIds || !Array.isArray(addonIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'addonIds array is required'
        },
        { status: 400 }
      )
    }

    // Validate addon IDs
    const validAddOnIds = addOnsData.map(addon => addon.id)
    const invalidIds = addonIds.filter(id => !validAddOnIds.includes(id))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ADDONS',
          message: 'Invalid addon IDs',
          invalidIds
        },
        { status: 400 }
      )
    }

    // Calculate total and get selected addons
    const selectedAddOns = addOnsData.filter(addon => addonIds.includes(addon.id))
    const total = selectedAddOns.reduce((sum, addon) => sum + (addon.price || 0), 0)

    // Check for bundle discounts
    let discount = 0
    let appliedBundle = null

    for (const bundle of addOnBundles) {
      if (bundle.addOns.every(id => addonIds.includes(id))) {
        const bundleSavings = bundle.originalPrice - bundle.bundlePrice
        if (bundleSavings > discount) {
          discount = bundleSavings
          appliedBundle = bundle
        }
      }
    }

    const finalTotal = total - discount

    return NextResponse.json({
      success: true,
      data: {
        selectedAddOns,
        total,
        discount,
        appliedBundle,
        finalTotal,
        savings: discount > 0 ? `Economia de ${formatCurrency(discount)}` : null
      }
    })
  } catch (error) {
    console.error('AddOns calculation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}