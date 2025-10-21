/**
 * Configuration API
 * Serves centralized configuration data to client components
 */
import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/config/loader'
import { DEFAULT_CLIENT_CONFIG } from '@/lib/use-server-config'
import { withCache } from '@/lib/api-cache'
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section') // 'site', 'content', 'contact', etc.
  const locale = searchParams.get('locale') || 'pt-BR'

  return withCache(async (request) => {
    // Only allow certain sections to be accessed via API
    const allowedSections = ['site', 'content', 'contact', 'i18n']
    if (section && !allowedSections.includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section requested' },
        { status: 400 }
      )
    }
    try {
      const configData = config.get()
      let responseData
      if (section) {
        if (section === 'i18n') {
          responseData = {
            i18n: {
              ...configData.i18n,
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
                'hero.title.line1': configData.content?.hero?.title?.line1 || 'Assinatura com acompanhamento médico especializado.',
                'hero.title.line2': configData.content?.hero?.title?.line2 || 'Nunca mais fique sem lentes',
                'hero.title.line3': configData.content?.hero?.title?.line3 || 'Receba no conforto da sua casa',
                'hero.subtitle': configData.content?.hero?.subtitle || 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
                'hero.cta.primary': configData.content?.hero?.cta?.primary || 'Agendar consulta com oftalmologista',
                'hero.cta.secondary': configData.content?.hero?.cta?.secondary || 'Calculadora de Economia'
              }
            }
          }
        } else {
          responseData = {
            [section]: configData[section] || DEFAULT_CLIENT_CONFIG[section]
          }
        }
      } else {
        // Return all safe configuration data
        responseData = {
          site: configData.site,
          i18n: {
            ...configData.i18n,
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
              'hero.title.line1': configData.content?.hero?.title?.line1 || 'Assinatura com acompanhamento médico especializado.',
              'hero.title.line2': configData.content?.hero?.title?.line2 || 'Nunca mais fique sem lentes',
              'hero.title.line3': configData.content?.hero?.title?.line3 || 'Receba no conforto da sua casa',
              'hero.subtitle': configData.content?.hero?.subtitle || 'Lentes de contato de qualidade com entrega mensal e suporte dedicado.',
              'hero.cta.primary': configData.content?.hero?.cta?.primary || 'Agendar consulta com oftalmologista',
              'hero.cta.secondary': configData.content?.hero?.cta?.secondary || 'Calculadora de Economia'
            }
          },
          content: configData.content || DEFAULT_CLIENT_CONFIG.content,
          contact: configData.contact || DEFAULT_CLIENT_CONFIG.contact
        }
      }
      return NextResponse.json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      })
    } catch (configError) {
      // If config fails to load, return default config
      console.warn('Configuration loading failed, using defaults:', configError)
      const responseData = section
        ? { [section]: DEFAULT_CLIENT_CONFIG[section] }
        : DEFAULT_CLIENT_CONFIG
      return NextResponse.json({
        success: true,
        data: responseData,
        fallback: true,
        timestamp: new Date().toISOString()
      })
    }
  }, {
    maxAge: 600, // 10 minutes cache for config data
    sMaxAge: 3600, // 1 hour CDN cache
    tags: ['config', section ? `config-${section}` : 'config-full'],
    deduplicate: true,
    staleWhileRevalidate: true
  })(request)
}