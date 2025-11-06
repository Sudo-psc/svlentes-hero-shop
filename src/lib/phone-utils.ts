/**
 * Phone Number Utilities
 *
 * Centralized phone number management and formatting for SVLentes project.
 *
 * Phone Numbers:
 * - Chatbot (WhatsApp): +55 33 99989-8026 (5533999898026)
 * - Direct Support: +55 33 98606-1427 (5533986061427)
 */

/**
 * Phone number constants from environment variables
 */
export const PHONE_NUMBERS = {
  /**
   * WhatsApp chatbot number for automated customer support
   * Format: 5533999898026 (no spaces, dashes, or country code +)
   */
  chatbot: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5533999898026',

  /**
   * Direct support line for human assistance
   * Format: 5533986061427 (no spaces, dashes, or country code +)
   */
  support: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '5533986061427',
} as const

/**
 * Format phone number for display in Brazilian format
 *
 * @param phone - Phone number in format: 5533999898026
 * @returns Formatted string: (33) 99989-8026
 *
 * @example
 * formatPhoneDisplay('5533999898026') // Returns: '(33) 99989-8026'
 * formatPhoneDisplay('5533986061427') // Returns: '(33) 98606-1427'
 */
export function formatPhoneDisplay(phone: string): string {
  // Guard: return empty string if phone is undefined/null
  if (!phone) return ''

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Match Brazilian mobile phone pattern: 55 (country) + 33 (area) + 99989-8026
  const match = cleaned.match(/^55(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  // Try without country code: 3399989-8026
  const matchWithoutCountry = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (matchWithoutCountry) {
    return `(${matchWithoutCountry[1]}) ${matchWithoutCountry[2]}-${matchWithoutCountry[3]}`
  }

  // Return original if format doesn't match
  return phone
}

/**
 * Format phone number for WhatsApp URL
 *
 * @param phone - Phone number in any format
 * @returns Clean number without formatting: 5533999898026
 *
 * @example
 * formatPhoneWhatsApp('(33) 99989-8026') // Returns: '5533999898026'
 * formatPhoneWhatsApp('+55 33 99989-8026') // Returns: '5533999898026'
 */
export function formatPhoneWhatsApp(phone: string): string {
  // Guard: return fallback if phone is undefined/null
  if (!phone) return PHONE_NUMBERS.chatbot

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Ensure it has country code (55)
  if (cleaned.startsWith('55')) {
    return cleaned
  }

  // Add country code if missing
  return `55${cleaned}`
}

/**
 * Format phone number for tel: protocol
 *
 * @param phone - Phone number in any format
 * @returns Phone with + prefix: +5533999898026
 *
 * @example
 * formatPhoneTel('5533999898026') // Returns: '+5533999898026'
 * formatPhoneTel('(33) 99989-8026') // Returns: '+5533999898026'
 */
export function formatPhoneTel(phone: string): string {
  const cleaned = formatPhoneWhatsApp(phone)
  return `+${cleaned}`
}

/**
 * Create WhatsApp URL with optional message
 *
 * @param phone - Phone number (defaults to chatbot)
 * @param message - Optional pre-filled message
 * @returns Complete WhatsApp URL
 *
 * @example
 * createWhatsAppUrl() // Returns: 'https://wa.me/5533999898026'
 * createWhatsAppUrl(PHONE_NUMBERS.support, 'Olá!') // Returns: 'https://wa.me/5533986061427?text=Ol%C3%A1!'
 */
export function createWhatsAppUrl(
  phone: string = PHONE_NUMBERS.chatbot,
  message?: string
): string {
  const cleanNumber = formatPhoneWhatsApp(phone)
  const baseUrl = `https://wa.me/${cleanNumber}`

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`
  }

  return baseUrl
}

/**
 * Create tel: URL for phone calls
 *
 * @param phone - Phone number (defaults to support)
 * @returns Complete tel: URL
 *
 * @example
 * createTelUrl() // Returns: 'tel:+5533986061427'
 * createTelUrl(PHONE_NUMBERS.chatbot) // Returns: 'tel:+5533999898026'
 */
export function createTelUrl(phone: string = PHONE_NUMBERS.support): string {
  return `tel:${formatPhoneTel(phone)}`
}

/**
 * Validate if phone number is in correct format
 *
 * @param phone - Phone number to validate
 * @returns true if valid Brazilian mobile number
 *
 * @example
 * isValidPhone('5533999898026') // Returns: true
 * isValidPhone('123456') // Returns: false
 */
export function isValidPhone(phone: string): boolean {
  // Guard: return false if phone is undefined/null
  if (!phone) return false

  const cleaned = phone.replace(/\D/g, '')

  // Brazilian mobile: 55 (country) + 2 digits (area) + 9 digits (mobile)
  const brazilianMobile = /^55\d{2}9\d{8}$/

  // Without country code: 2 digits (area) + 9 digits (mobile)
  const withoutCountry = /^\d{2}9\d{8}$/

  return brazilianMobile.test(cleaned) || withoutCountry.test(cleaned)
}

/**
 * Get phone context information
 *
 * @param phone - Phone number
 * @returns Contextual information about the phone number
 */
export function getPhoneContext(phone: string): {
  type: 'chatbot' | 'support' | 'unknown'
  description: string
  recommended: boolean
} {
  // Guard: return unknown if phone is undefined/null
  if (!phone) {
    return {
      type: 'unknown',
      description: 'Número não especificado',
      recommended: false
    }
  }

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.includes('99989') || cleaned === PHONE_NUMBERS.chatbot) {
    return {
      type: 'chatbot',
      description: 'WhatsApp Chatbot - Atendimento automatizado 24/7',
      recommended: true
    }
  }

  if (cleaned.includes('98606') || cleaned === PHONE_NUMBERS.support) {
    return {
      type: 'support',
      description: 'Suporte Direto - Atendimento humano durante horário comercial',
      recommended: false
    }
  }

  return {
    type: 'unknown',
    description: 'Número desconhecido',
    recommended: false
  }
}

/**
 * Type definitions for phone number usage
 */
export type PhoneType = 'chatbot' | 'support'

export interface PhoneConfig {
  number: string
  display: string
  whatsappUrl: string
  telUrl: string
  type: PhoneType
  description: string
}

/**
 * Get complete phone configuration object
 *
 * @param type - Type of phone number
 * @returns Complete phone configuration
 *
 * @example
 * const config = getPhoneConfig('chatbot')
 * // {
 * //   number: '5533999898026',
 * //   display: '(33) 99989-8026',
 * //   whatsappUrl: 'https://wa.me/5533999898026',
 * //   telUrl: 'tel:+5533999898026',
 * //   type: 'chatbot',
 * //   description: 'WhatsApp Chatbot'
 * // }
 */
export function getPhoneConfig(type: PhoneType = 'chatbot'): PhoneConfig {
  const number = PHONE_NUMBERS[type]

  return {
    number,
    display: formatPhoneDisplay(number),
    whatsappUrl: createWhatsAppUrl(number),
    telUrl: createTelUrl(number),
    type,
    description: type === 'chatbot'
      ? 'WhatsApp Chatbot - Atendimento automatizado'
      : 'Suporte Direto - Equipe SaraivaVision'
  }
}
