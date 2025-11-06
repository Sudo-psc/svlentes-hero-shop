/**
 * API Endpoint for Configuration
 * Provides configuration data for client-side components
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_CLIENT_CONFIG, type ServerConfigData } from '@/lib/use-server-config'

export const runtime = 'edge'
export const preferredRegion = ['gru1', 'iad1']

interface ConfigResponse {
  success: boolean
  data: ServerConfigData
  error?: string
  fallback?: boolean
}

export async function GET(request: NextRequest): Promise<NextResponse<ConfigResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const locale = searchParams.get('locale') || 'pt-BR'

    // Log para debugging
    console.log(`[CONFIG] Request received - section: ${section}, locale: ${locale}`)

    // Retorna configuração padrão (pode ser expandido para buscar do banco/env)
    let configData = { ...DEFAULT_CLIENT_CONFIG }

    // Se uma seção específica foi solicitada, retorna apenas essa seção
    if (section) {
      const sectionData = configData[section as keyof ServerConfigData]
      if (!sectionData) {
        return NextResponse.json({
          success: false,
          error: `Configuration section '${section}' not found`,
          data: DEFAULT_CLIENT_CONFIG,
          fallback: true
        }, { status: 404 })
      }

      configData = {
        ...DEFAULT_CLIENT_CONFIG,
        [section]: sectionData
      } as ServerConfigData
    }

    // Adiciona informações de locale se necessário
    const response: ConfigResponse = {
      success: true,
      data: configData
    }

    // Cache headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    })

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('[CONFIG] Error:', error)

    // Retorna fallback em caso de erro
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: DEFAULT_CLIENT_CONFIG,
      fallback: true
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// Suporte para CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
