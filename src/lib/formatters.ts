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
/**
 * Formata o tempo relativo (ex: "há 2 dias", "em 3 horas")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMs < 0) {
    // Passado
    if (diffDays < -1) return `há ${Math.abs(diffDays)} dias`
    if (diffDays === -1) return 'ontem'
    if (diffHours < -1) return `há ${Math.abs(diffHours)} horas`
    if (diffHours === -1) return 'há 1 hora'
    if (diffMinutes < -1) return `há ${Math.abs(diffMinutes)} minutos`
    return 'agora'
  } else {
    // Futuro
    if (diffDays > 1) return `em ${diffDays} dias`
    if (diffDays === 1) return 'amanhã'
    if (diffHours > 1) return `em ${diffHours} horas`
    if (diffHours === 1) return 'em 1 hora'
    if (diffMinutes > 1) return `em ${diffMinutes} minutos`
    return 'em instantes'
  }
}
/**
 * Formata um CPF brasileiro (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return cpf
}
/**
 * Formata um CNPJ brasileiro (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
  }
  return cnpj
}
/**
 * Formata um cartão de crédito (**** **** **** XXXX)
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return `**** **** **** ${cleaned.slice(-4)}`
  }
  return cardNumber
}
/**
 * Formata porcentagem com casas decimais
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
/**
 * Formata um número com separadores de milhar
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}
/**
 * Trunca um texto com elipse
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
/**
 * Capitaliza a primeira letra de cada palavra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
/**
 * Formata o nome completo (primeiro nome + último sobrenome)
 */
export function formatShortName(fullName: string): string {
  const names = fullName.trim().split(' ')
  if (names.length <= 2) return fullName
  return `${names[0]} ${names[names.length - 1]}`
}