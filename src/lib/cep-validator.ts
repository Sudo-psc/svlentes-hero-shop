/**
 * CEP Validator and Fetcher
 * Brazilian postal code validation with ViaCEP API integration
 *
 * Features:
 * - CEP format validation
 * - ViaCEP API integration with fallback
 * - Network error handling
 * - Manual address entry fallback
 * - LGPD-compliant logging
 */

import {
  CEPValidationError,
  createCEPValidationError,
  Phase3ErrorContext,
} from './phase3-error-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const VIACEP_API_URL = 'https://viacep.com.br/ws'
const VIACEP_TIMEOUT = 5000 // 5 seconds
const CEP_REGEX = /^(\d{5})-?(\d{3})$/

// Brazilian states (UF)
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type BrazilianState = typeof BRAZILIAN_STATES[number]

// ============================================================================
// TYPES
// ============================================================================

export interface CEPData {
  cep: string
  street: string        // logradouro
  complement: string    // complemento
  neighborhood: string  // bairro
  city: string         // localidade
  state: BrazilianState // uf
  ibge: string         // código IBGE
  gia: string          // código GIA (SP)
  ddd: string          // DDD telefônico
  siafi: string        // código SIAFI
}

export interface CEPValidationResult {
  valid: boolean
  formatted?: string
  cleaned?: string
  error?: CEPValidationError
}

export interface CEPFetchResult {
  success: boolean
  data?: CEPData
  error?: CEPValidationError
  requiresManualEntry?: boolean
}

// ============================================================================
// CEP VALIDATOR CLASS
// ============================================================================

export class CEPValidator {
  private context: Phase3ErrorContext

  constructor(userId?: string) {
    this.context = {
      feature: 'delivery-preferences',
      operation: 'cep_validation',
      userId,
      timestamp: new Date(),
    }
  }

  /**
   * Validate CEP format
   */
  validate(cep: string): CEPValidationResult {
    // Remove whitespace
    const trimmed = cep.trim()

    // Remove formatting (keep only digits)
    const cleaned = trimmed.replace(/\D/g, '')

    // Check if has exactly 8 digits
    if (cleaned.length !== 8) {
      return {
        valid: false,
        error: createCEPValidationError(
          'CEP_INVALID_FORMAT',
          {
            ...this.context,
            metadata: { cepLength: cleaned.length },
          }
        ),
      }
    }

    // Check if matches expected pattern
    if (!CEP_REGEX.test(trimmed)) {
      // Try with cleaned version
      const formatted = this.formatCEP(cleaned)
      if (!CEP_REGEX.test(formatted)) {
        return {
          valid: false,
          error: createCEPValidationError(
            'CEP_INVALID_FORMAT',
            {
              ...this.context,
              metadata: { pattern: 'Invalid pattern' },
            }
          ),
        }
      }
    }

    // Valid CEP
    return {
      valid: true,
      formatted: this.formatCEP(cleaned),
      cleaned,
    }
  }

  /**
   * Fetch CEP data from ViaCEP API
   */
  async fetchCEP(cep: string): Promise<CEPFetchResult> {
    // First validate format
    const validation = this.validate(cep)

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const cleanCEP = validation.cleaned!

    try {
      // Fetch from ViaCEP with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), VIACEP_TIMEOUT)

      const response = await fetch(
        `${VIACEP_API_URL}/${cleanCEP}/json/`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Check if CEP was not found
      if (data.erro === true || data.erro === 'true') {
        return {
          success: false,
          error: createCEPValidationError(
            'CEP_NOT_FOUND',
            {
              ...this.context,
              operation: 'cep_fetch',
            }
          ),
          requiresManualEntry: true,
        }
      }

      // Parse and validate response
      const cepData = this.parseCEPResponse(data)

      return {
        success: true,
        data: cepData,
      }
    } catch (error) {
      console.error('[CEPValidator] Fetch error:', error)

      // Network error - allow manual entry
      return {
        success: false,
        error: createCEPValidationError(
          'CEP_API_ERROR',
          {
            ...this.context,
            operation: 'cep_fetch',
          },
          error as Error
        ),
        requiresManualEntry: true,
      }
    }
  }

  /**
   * Fetch CEP with retry
   */
  async fetchCEPWithRetry(
    cep: string,
    retries = 2
  ): Promise<CEPFetchResult> {
    let lastError: CEPValidationError | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await this.fetchCEP(cep)

      if (result.success) {
        return result
      }

      lastError = result.error

      // Don't retry if CEP not found or invalid format
      if (
        lastError?.code === 'CEP_NOT_FOUND' ||
        lastError?.code === 'CEP_INVALID_FORMAT'
      ) {
        break
      }

      // Wait before retry (1s, 2s)
      if (attempt < retries) {
        await this.delay((attempt + 1) * 1000)
      }
    }

    return {
      success: false,
      error: lastError,
      requiresManualEntry: true,
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return cep
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  }

  private parseCEPResponse(data: unknown): CEPData {
    const raw = data as Record<string, string>

    return {
      cep: this.formatCEP(raw.cep || ''),
      street: raw.logradouro || '',
      complement: raw.complemento || '',
      neighborhood: raw.bairro || '',
      city: raw.localidade || '',
      state: (raw.uf || '') as BrazilianState,
      ibge: raw.ibge || '',
      gia: raw.gia || '',
      ddd: raw.ddd || '',
      siafi: raw.siafi || '',
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick CEP validation
 */
export function validateCEP(cep: string, userId?: string): CEPValidationResult {
  const validator = new CEPValidator(userId)
  return validator.validate(cep)
}

/**
 * Quick CEP fetch
 */
export async function fetchCEP(
  cep: string,
  userId?: string
): Promise<CEPFetchResult> {
  const validator = new CEPValidator(userId)
  return validator.fetchCEPWithRetry(cep)
}

/**
 * Format CEP for display
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return cep
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
}

/**
 * Clean CEP (remove formatting)
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Check if CEP is valid format
 */
export function isValidCEPFormat(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
}

/**
 * Get state name from UF code
 */
export function getStateName(uf: BrazilianState): string {
  const stateNames: Record<BrazilianState, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
  }

  return stateNames[uf] || uf
}

/**
 * Validate Brazilian state code
 */
export function isValidState(uf: string): uf is BrazilianState {
  return BRAZILIAN_STATES.includes(uf as BrazilianState)
}

/**
 * Create empty CEP data for manual entry
 */
export function createEmptyCEPData(cep?: string): Partial<CEPData> {
  return {
    cep: cep ? formatCEP(cep) : '',
    street: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: undefined,
  }
}
