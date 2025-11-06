/**
 * Simple Configuration API (Fallback)
 *
 * This is a simplified version to avoid ReadableStream issues
 * while we debug the main config endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'

// Simple static config to avoid stream issues
const STATIC_CONFIG = {
  site: {
    name: 'SV Lentes',
    url: 'https://svlentes.com.br',
    description: 'Assinatura de lentes de contato com acompanhamento médico'
  },
  content: {
    hero: {
      title: {
        line1: 'Assinatura com acompanhamento médico especializado.',
        line2: 'Nunca mais fique sem lentes',
        line3: 'Receba no conforto da sua casa'
      },
      subtitle: 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
      cta: {
        primary: 'Agendar consulta com oftalmologista',
        secondary: 'Calculadora de Economia'
      }
    }
  },
  contact: {
    phone: '(33) 99989-8026',
    email: 'saraivavision@gmail.com',
    whatsapp: 'https://wa.me/5533999898026'
  },
  i18n: {
    translations: {
      'footer.about': 'Sobre',
      'footer.contact': 'Contato',
      'footer.legal': 'Legal',
      'footer.privacy': 'Política de Privacidade',
      'footer.terms': 'Termos de Uso',
      'footer.rights': 'Todos os direitos reservados',
      'loading': 'Carregando...',
      'error.required': 'Este campo é obrigatório',
      'error.email': 'Email inválido',
      'error.phone': 'Telefone inválido (formato: (XX) 9XXXX-XXXX)',
      'success.message': 'Mensagem enviada com sucesso!',
      'button.send': 'Enviar',
      'button.cancel': 'Cancelar',
      'hero.title.line1': 'Assinatura com acompanhamento médico especializado.',
      'hero.title.line2': 'Nunca mais fique sem lentes',
      'hero.title.line3': 'Receba no conforto da sua casa',
      'hero.subtitle': 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
      'hero.cta.primary': 'Agendar consulta com oftalmologista',
      'hero.cta.secondary': 'Calculadora de Economia'
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const locale = searchParams.get('locale') || 'pt-BR'

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=600', // 10 minutes
    }

    let responseData = STATIC_CONFIG

    if (section === 'i18n') {
      responseData = { i18n: STATIC_CONFIG.i18n }
    } else if (section && STATIC_CONFIG[section as keyof typeof STATIC_CONFIG]) {
      responseData = { [section]: STATIC_CONFIG[section as keyof typeof STATIC_CONFIG] }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('[CONFIG_SIMPLE_ERROR]', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Configuration loading failed',
        message: 'Unable to load configuration data',
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}