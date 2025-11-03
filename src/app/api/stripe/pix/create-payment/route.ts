import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe with the latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Validation schema for Pix payment request
const pixPaymentSchema = z.object({
  amount: z.number().min(100, 'Valor mínimo de R$ 1,00'), // Amount in cents (minimum R$ 1.00)
  description: z.string().min(1, 'Descrição é obrigatória'),
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().min(1, 'Nome é obrigatório'),
  metadata: z.record(z.string()).optional(), // Additional metadata
});

type PixPaymentRequest = z.infer<typeof pixPaymentSchema>;

/**
 * POST /api/stripe/pix/create-payment
 *
 * Creates a Stripe PaymentIntent configured for Pix payments (Brazil)
 *
 * Request body:
 * {
 *   amount: number;        // Amount in cents (e.g., 1000 = R$ 10.00)
 *   description: string;   // Payment description
 *   customerEmail: string; // Customer email
 *   customerName: string;  // Customer full name
 *   metadata?: object;     // Optional metadata
 * }
 *
 * Response:
 * {
 *   success: true,
 *   paymentIntentId: string;
 *   clientSecret: string;
 *   qrCode: string;        // Pix QR Code data URL
 *   qrCodeText: string;    // Pix copy-paste code
 *   expiresAt: number;     // Unix timestamp
 *   status: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = pixPaymentSchema.parse(body);

    const { amount, description, customerEmail, customerName, metadata = {} } = validatedData;

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          source: 'svlentes_pix',
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Create PaymentIntent with Pix as payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'brl', // Brazilian Real
      payment_method_types: ['pix'], // Pix only
      customer: customer.id,
      description,
      metadata: {
        customerEmail,
        customerName,
        paymentMethod: 'pix',
        source: 'svlentes_web',
        ...metadata,
      },
      // Pix payments expire after 24 hours by default
      // You can customize this with payment_method_options if needed
      payment_method_options: {
        pix: {
          expires_after_seconds: 86400, // 24 hours
        },
      },
    });

    // Confirm the PaymentIntent to generate Pix QR Code
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method_data: {
          type: 'pix',
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/pix/status?payment_intent=${paymentIntent.id}`,
      }
    );

    // Extract Pix-specific data from next_action
    const pixData = confirmedPaymentIntent.next_action?.pix_display_qr_code;

    if (!pixData) {
      throw new Error('Failed to generate Pix QR Code');
    }

    // Return payment details with Pix QR Code
    return NextResponse.json({
      success: true,
      paymentIntentId: confirmedPaymentIntent.id,
      clientSecret: confirmedPaymentIntent.client_secret,
      qrCode: pixData.data, // Base64 image data URL for QR Code
      qrCodeText: pixData.hosted_instructions_url || '', // Pix copy-paste code (if available)
      expiresAt: pixData.expires_at || Date.now() + 86400000, // Expiration timestamp
      status: confirmedPaymentIntent.status,
      amount: confirmedPaymentIntent.amount,
      currency: confirmedPaymentIntent.currency,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Pix payment creation error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao processar pagamento',
        message: error.message,
        code: error.code,
      }, { status: 500 });
    }

    // Generic error
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/stripe/pix/create-payment?payment_intent_id=pi_xxx
 *
 * Check the status of a Pix payment
 *
 * Query parameters:
 * - payment_intent_id: string (required)
 *
 * Response:
 * {
 *   success: true,
 *   status: string;
 *   paid: boolean;
 *   amount: number;
 *   metadata: object;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment Intent ID é obrigatório',
      }, { status: 400 });
    }

    // Retrieve PaymentIntent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
      paid: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
      charges: paymentIntent.charges.data.length,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Pix payment status check error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar status',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
    }, { status: 500 });
  }
}
