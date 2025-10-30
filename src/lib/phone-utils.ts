/**
 * Phone number utilities for consistent formatting and handling
 * across the application.
 */

/**
 * Format a phone number from raw digits to Brazilian format
 * @param phone - Phone number in format: 5533999898026, +5533999898026, or 33999898026
 * @returns Formatted phone: (33) 99989-8026
 * 
 * @example
 * formatPhoneNumber('5533999898026') // Returns: (33) 99989-8026
 * formatPhoneNumber('+5533999898026') // Returns: (33) 99989-8026
 * formatPhoneNumber('33999898026') // Returns: (33) 99989-8026
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  let areaCode: string
  let number: string
  
  if (cleaned.startsWith('55')) {
    areaCode = cleaned.slice(2, 4)
    number = cleaned.slice(4)
  } else {
    areaCode = cleaned.slice(0, 2)
    number = cleaned.slice(2)
  }
  
  if (number.length === 9) {
    return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`
  } else if (number.length === 8) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`
  }
  
  return phone
}

/**
 * Get WhatsApp link with formatted phone number
 * @param phone - Phone number (will be cleaned automatically)
 * @param message - Optional pre-filled message
 * @returns WhatsApp URL
 * 
 * @example
 * getWhatsAppLink('5533999898026', 'Olá!') // Returns: https://wa.me/5533999898026?text=Olá!
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const baseUrl = `https://wa.me/${cleanPhone}`
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`
  }
  
  return baseUrl
}

/**
 * Get phone numbers from environment variables
 */
export function getPhoneNumbers() {
  return {
    chatbot: process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT || '5533999898026',
    support: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '5533986061427',
  }
}

/**
 * Get formatted phone numbers ready for display
 */
export function getFormattedPhoneNumbers() {
  const phones = getPhoneNumbers()
  return {
    chatbot: formatPhoneNumber(phones.chatbot),
    support: formatPhoneNumber(phones.support),
    chatbotRaw: phones.chatbot,
    supportRaw: phones.support,
  }
}
