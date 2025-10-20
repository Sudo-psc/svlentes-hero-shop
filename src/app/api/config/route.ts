/**
 * Configuration API
 * Serves centralized configuration data to client components
 */
import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/config/loader'
import { DEFAULT_CLIENT_CONFIG } from '@/lib/use-server-config'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') // 'site', 'content', 'contact', etc.
    const locale = searchParams.get('locale') || 'pt-BR'
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
        responseData = {
          [section]: configData[section] || DEFAULT_CLIENT_CONFIG[section]
        }
      } else {
        // Return all safe configuration data
        responseData = {
          site: configData.site,
          i18n: configData.i18n,
          content: configData.content || DEFAULT_CLIENT_CONFIG.content,
          contact: configData.contact || DEFAULT_CLIENT_CONFIG.contact
        }
      }
      // Add caching headers for better performance
      const response = NextResponse.json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      })
      // Cache for 5 minutes (300 seconds)
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
      response.headers.set('CDN-Cache-Control', 'public, max-age=300')
      return response
    } catch (configError) {
      // If config fails to load, return default config
      console.warn('Configuration loading failed, using defaults:', configError)
      const responseData = section
        ? { [section]: DEFAULT_CLIENT_CONFIG[section] }
        : DEFAULT_CLIENT_CONFIG
      const response = NextResponse.json({
        success: true,
        data: responseData,
        fallback: true,
        timestamp: new Date().toISOString()
      })
      response.headers.set('Cache-Control', 'public, max-age=60')
      return response
    }
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: DEFAULT_CLIENT_CONFIG
      },
      { status: 500 }
    )
  }
}