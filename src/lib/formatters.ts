/**
 * Formatadores comuns para a aplicação
 * Centralizados para evitar duplicação de código
 */

/**
 * Formata uma data no padrão brasileiro (dd/MM/yyyy)
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata uma data com mês por extenso
 */
export function formatDateLong(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Formata um valor monetário em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formata um número de telefone brasileiro
 */
export function formatPhone(phone: string): string {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')

  // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Formata um CEP brasileiro
 */
export function formatZipCode(zipCode: string): string {
  const cleaned = zipCode.replace(/\D/g, '')

  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  }

  return zipCode
}
