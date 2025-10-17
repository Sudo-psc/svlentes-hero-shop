/**
 * Validações para formulários brasileiros
 * Conformidade com padrões LGPD e validação de dados
 */

/**
 * Remove caracteres não numéricos de uma string
 */
function cleanNumericString(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Valida CPF brasileiro
 * @param cpf - CPF com ou sem formatação
 * @returns true se CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanNumericString(cpf)

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) return false

  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false

  return true
}

/**
 * Valida CNPJ brasileiro
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se CNPJ é válido
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanNumericString(cnpj)

  // CNPJ deve ter 14 dígitos
  if (cleaned.length !== 14) return false

  // Verifica se todos os dígitos são iguais (CNPJs inválidos conhecidos)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(12))) return false

  // Validação do segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(13))) return false

  return true
}

/**
 * Valida CPF ou CNPJ brasileiro
 * @param document - CPF ou CNPJ com ou sem formatação
 * @returns true se documento é válido
 */
export function validateCPFOrCNPJ(document: string): boolean {
  const cleaned = cleanNumericString(document)

  if (cleaned.length === 11) {
    return validateCPF(document)
  } else if (cleaned.length === 14) {
    return validateCNPJ(document)
  }

  return false
}

/**
 * Valida telefone brasileiro (celular ou fixo)
 * Formatos aceitos:
 * - Celular: (XX) 9XXXX-XXXX ou (XX) 9XXXXXXXX
 * - Fixo: (XX) XXXX-XXXX ou (XX) XXXXXXXX
 * @param phone - Telefone com ou sem formatação
 * @returns true se telefone é válido
 */
export function validatePhone(phone: string): boolean {
  const cleaned = cleanNumericString(phone)

  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) return false

  // DDD válido (11 a 99)
  const ddd = parseInt(cleaned.substring(0, 2))
  if (ddd < 11 || ddd > 99) return false

  // Se for celular (11 dígitos), o terceiro dígito deve ser 9
  if (cleaned.length === 11) {
    if (cleaned.charAt(2) !== '9') return false
  }

  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false

  return true
}

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns true se email é válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Formata CPF para exibição
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanNumericString(cpf)
  if (cleaned.length !== 11) return cpf

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ para exibição
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanNumericString(cnpj)
  if (cleaned.length !== 14) return cnpj

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata telefone para exibição
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanNumericString(phone)

  if (cleaned.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return phone
}

/**
 * Aplica máscara de CPF/CNPJ conforme o usuário digita
 * @param value - Valor atual do input
 * @returns Valor com máscara aplicada
 */
export function maskCPFOrCNPJ(value: string): string {
  const cleaned = cleanNumericString(value)

  if (cleaned.length <= 11) {
    // Máscara de CPF
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    // Máscara de CNPJ
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
}

/**
 * Aplica máscara de telefone conforme o usuário digita
 * @param value - Valor atual do input
 * @returns Valor com máscara aplicada
 */
export function maskPhone(value: string): string {
  const cleaned = cleanNumericString(value)

  if (cleaned.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  } else {
    // Celular: (XX) 9XXXX-XXXX
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
}

/**
 * Valida data de prescrição médica
 * Prescrições de lentes de contato são válidas por até 1 ano
 * @param prescriptionDate - Data da prescrição (string ISO ou Date)
 * @returns true se prescrição está válida (menos de 1 ano)
 */
export function validatePrescriptionDate(prescriptionDate: string | Date): boolean {
  const date = typeof prescriptionDate === 'string'
    ? new Date(prescriptionDate)
    : prescriptionDate

  const now = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  // Prescrição deve ser menor que 1 ano
  return date >= oneYearAgo && date <= now
}

/**
 * Valida CRM médico brasileiro
 * @param crm - CRM no formato XXXXXX-UF
 * @returns true se formato é válido
 */
export function validateCRM(crm: string): boolean {
  // Formato: 6 dígitos seguidos de hífen e sigla do estado (2 letras)
  const crmRegex = /^\d{6}-[A-Z]{2}$/
  return crmRegex.test(crm)
}
