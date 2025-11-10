import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Stripe Health Check
 *
 * Validates Stripe configuration without exposing sensitive keys.
 * Returns only safe metadata about key prefixes and configuration status.
 *
 * @route GET /api/health/stripe
 * @access Public (no sensitive data exposed)
 *
 * @returns {object} Health status with safe metadata
 *
 * @security
 * - NEVER returns full secret keys
 * - Only shows prefixes and key lengths
 * - Validates environment configuration
 *
 * @author Dr. Philipe Saraiva Cruz
 */

export async function GET(request: NextRequest) {
    try {
        // Get environment variables
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        const secretKey = process.env.STRIPE_SECRET_KEY
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID

        // Validate publishable key (client-side)
        const publishableKeyStatus = {
            exists: !!publishableKey,
            prefix: publishableKey ? publishableKey.substring(0, 8) : 'NOT_SET',
            length: publishableKey ? publishableKey.length : 0,
            environment: publishableKey?.startsWith('pk_live_') ? 'PRODUCTION' :
                publishableKey?.startsWith('pk_test_') ? 'TEST' : 'INVALID',
            isValid: publishableKey?.startsWith('pk_live_') || publishableKey?.startsWith('pk_test_')
        }

        // Validate secret key (server-side) - DO NOT EXPOSE FULL KEY
        const secretKeyStatus = {
            exists: !!secretKey,
            prefix: secretKey ? secretKey.substring(0, 8) : 'NOT_SET',
            length: secretKey ? secretKey.length : 0,
            environment: secretKey?.startsWith('sk_live_') ? 'PRODUCTION' :
                secretKey?.startsWith('sk_test_') ? 'TEST' : 'INVALID',
            isValid: secretKey?.startsWith('sk_live_') || secretKey?.startsWith('sk_test_')
        }

        // Validate webhook secret
        const webhookSecretStatus = {
            exists: !!webhookSecret,
            prefix: webhookSecret ? webhookSecret.substring(0, 8) : 'NOT_SET',
            length: webhookSecret ? webhookSecret.length : 0,
            isValid: webhookSecret?.startsWith('whsec_')
        }

        // Validate pricing table ID
        const pricingTableStatus = {
            exists: !!pricingTableId,
            prefix: pricingTableId ? pricingTableId.substring(0, 10) : 'NOT_SET',
            length: pricingTableId ? pricingTableId.length : 0,
            isValid: pricingTableId?.startsWith('prctbl_')
        }

        // Check if keys are from the same environment
        const environmentMatch = publishableKeyStatus.environment === secretKeyStatus.environment

        // Overall health status
        const isHealthy =
            publishableKeyStatus.isValid &&
            secretKeyStatus.isValid &&
            webhookSecretStatus.isValid &&
            pricingTableStatus.isValid &&
            environmentMatch

        const health = {
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            environment: publishableKeyStatus.environment,
            configuration: {
                publishableKey: publishableKeyStatus,
                secretKey: {
                    exists: secretKeyStatus.exists,
                    prefix: secretKeyStatus.prefix,
                    length: secretKeyStatus.length,
                    environment: secretKeyStatus.environment,
                    isValid: secretKeyStatus.isValid
                },
                webhookSecret: webhookSecretStatus,
                pricingTable: pricingTableStatus
            },
            validation: {
                environmentMatch,
                allKeysConfigured: publishableKeyStatus.exists && secretKeyStatus.exists && webhookSecretStatus.exists,
                allKeysValid: publishableKeyStatus.isValid && secretKeyStatus.isValid && webhookSecretStatus.isValid,
                pricingTableConfigured: pricingTableStatus.exists && pricingTableStatus.isValid
            },
            warnings: []
        }

        // Add warnings for misconfigurations
        if (!environmentMatch) {
            health.warnings.push('⚠️ Keys are from different environments (publishable vs secret)')
        }
        if (!publishableKeyStatus.exists) {
            health.warnings.push('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set')
        }
        if (!secretKeyStatus.exists) {
            health.warnings.push('❌ STRIPE_SECRET_KEY not set')
        }
        if (!webhookSecretStatus.exists) {
            health.warnings.push('⚠️ STRIPE_WEBHOOK_SECRET not set')
        }
        if (!pricingTableStatus.exists || !pricingTableStatus.isValid) {
            health.warnings.push('⚠️ NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID not configured or invalid')
        }
        if (publishableKeyStatus.environment === 'TEST') {
            health.warnings.push('ℹ️ Using TEST mode keys (not production)')
        }

        return NextResponse.json(health, {
            status: isHealthy ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Content-Type': 'application/json'
            }
        })

    } catch (error: any) {
        console.error('[STRIPE_HEALTH_CHECK_ERROR]', error)

        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Failed to check Stripe health',
            error: error.message
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Content-Type': 'application/json'
            }
        })
    }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    })
}
