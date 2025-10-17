/**
 * Unit tests for Brazilian validators
 * Testing CPF, CNPJ, Phone, Email, Prescription Date, and CRM validation
 */

import {
  validateCPF,
  validateCNPJ,
  validateCPFOrCNPJ,
  validatePhone,
  validateEmail,
  validatePrescriptionDate,
  validateCRM,
  formatCPF,
  formatCNPJ,
  formatPhone,
  maskCPFOrCNPJ,
  maskPhone,
} from '../validators'

describe('Brazilian Document Validators', () => {
  describe('validateCPF', () => {
    it('validates correct CPF without formatting', () => {
      expect(validateCPF('11144477735')).toBe(true)
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('01234567890')).toBe(true)
    })

    it('validates correct CPF with formatting', () => {
      expect(validateCPF('111.444.777-35')).toBe(true)
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('012.345.678-90')).toBe(true)
    })

    it('rejects CPF with all same digits', () => {
      expect(validateCPF('11111111111')).toBe(false)
      expect(validateCPF('00000000000')).toBe(false)
      expect(validateCPF('99999999999')).toBe(false)
    })

    it('rejects CPF with invalid check digits', () => {
      expect(validateCPF('11144477736')).toBe(false) // Last digit wrong
      expect(validateCPF('11144477734')).toBe(false) // Last digit wrong
      expect(validateCPF('12345678901')).toBe(false) // Both wrong
    })

    it('rejects CPF with invalid length', () => {
      expect(validateCPF('123456789')).toBe(false) // Too short
      expect(validateCPF('123456789012')).toBe(false) // Too long
      expect(validateCPF('1234567890')).toBe(false) // 10 digits
      expect(validateCPF('')).toBe(false) // Empty
    })

    it('handles CPF with mixed formatting', () => {
      expect(validateCPF('111-444-777.35')).toBe(true)
      expect(validateCPF('111 444 777 35')).toBe(true)
    })
  })

  describe('validateCNPJ', () => {
    it('validates correct CNPJ without formatting', () => {
      expect(validateCNPJ('11222333000181')).toBe(true)
      expect(validateCNPJ('06990590000123')).toBe(true)
    })

    it('validates correct CNPJ with formatting', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true)
      expect(validateCNPJ('06.990.590/0001-23')).toBe(true)
    })

    it('rejects CNPJ with all same digits', () => {
      expect(validateCNPJ('11111111111111')).toBe(false)
      expect(validateCNPJ('00000000000000')).toBe(false)
      expect(validateCNPJ('99999999999999')).toBe(false)
    })

    it('rejects CNPJ with invalid check digits', () => {
      expect(validateCNPJ('11222333000182')).toBe(false) // Last digit wrong
      expect(validateCNPJ('11222333000180')).toBe(false) // Last digit wrong
      expect(validateCNPJ('12345678901234')).toBe(false) // Both wrong
    })

    it('rejects CNPJ with invalid length', () => {
      expect(validateCNPJ('1122233300018')).toBe(false) // Too short
      expect(validateCNPJ('112223330001811')).toBe(false) // Too long
      expect(validateCNPJ('')).toBe(false) // Empty
    })

    it('handles CNPJ with mixed formatting', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true)
      expect(validateCNPJ('11 222 333 0001 81')).toBe(true)
    })
  })

  describe('validateCPFOrCNPJ', () => {
    it('validates valid CPF', () => {
      expect(validateCPFOrCNPJ('11144477735')).toBe(true)
      expect(validateCPFOrCNPJ('111.444.777-35')).toBe(true)
    })

    it('validates valid CNPJ', () => {
      expect(validateCPFOrCNPJ('11222333000181')).toBe(true)
      expect(validateCPFOrCNPJ('11.222.333/0001-81')).toBe(true)
    })

    it('rejects invalid CPF', () => {
      expect(validateCPFOrCNPJ('11111111111')).toBe(false)
      expect(validateCPFOrCNPJ('12345678901')).toBe(false)
    })

    it('rejects invalid CNPJ', () => {
      expect(validateCPFOrCNPJ('11111111111111')).toBe(false)
      expect(validateCPFOrCNPJ('12345678901234')).toBe(false)
    })

    it('rejects documents with invalid length', () => {
      expect(validateCPFOrCNPJ('123456789')).toBe(false) // 9 digits
      expect(validateCPFOrCNPJ('1234567890')).toBe(false) // 10 digits
      expect(validateCPFOrCNPJ('123456789012')).toBe(false) // 12 digits
      expect(validateCPFOrCNPJ('12345678901234567')).toBe(false) // 17 digits
      expect(validateCPFOrCNPJ('')).toBe(false) // Empty
    })
  })
})

describe('Phone Validators', () => {
  describe('validatePhone', () => {
    it('validates mobile phone without formatting', () => {
      expect(validatePhone('11999999999')).toBe(true) // São Paulo mobile
      expect(validatePhone('21987654321')).toBe(true) // Rio mobile
      expect(validatePhone('85912345678')).toBe(true) // Ceará mobile
    })

    it('validates mobile phone with formatting', () => {
      expect(validatePhone('(11) 99999-9999')).toBe(true)
      expect(validatePhone('(21) 98765-4321')).toBe(true)
      expect(validatePhone('11 99999-9999')).toBe(true)
    })

    it('validates landline phone without formatting', () => {
      expect(validatePhone('1133334444')).toBe(true) // São Paulo landline
      expect(validatePhone('2133334444')).toBe(true) // Rio landline
    })

    it('validates landline phone with formatting', () => {
      expect(validatePhone('(11) 3333-4444')).toBe(true)
      expect(validatePhone('(21) 3333-4444')).toBe(true)
    })

    it('rejects phone with invalid DDD', () => {
      expect(validatePhone('00999999999')).toBe(false) // DDD < 11
      expect(validatePhone('10999999999')).toBe(false) // DDD = 10
      expect(validatePhone('01999999999')).toBe(false) // DDD < 11
    })

    it('rejects mobile phone without leading 9', () => {
      expect(validatePhone('11888888888')).toBe(false) // 11 digits but 3rd digit is not 9
      expect(validatePhone('11788888888')).toBe(false)
    })

    it('rejects phone with all same digits', () => {
      expect(validatePhone('11111111111')).toBe(false)
      expect(validatePhone('9999999999')).toBe(false)
    })

    it('rejects phone with invalid length', () => {
      expect(validatePhone('119999999')).toBe(false) // Too short
      expect(validatePhone('119999999999')).toBe(false) // Too long
      expect(validatePhone('')).toBe(false) // Empty
    })
  })
})

describe('Email Validators', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('user.name@example.com')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
      expect(validateEmail('user_name@example.co.uk')).toBe(true)
      expect(validateEmail('user123@example.com.br')).toBe(true)
    })

    it('rejects email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false)
      expect(validateEmail('user.example.com')).toBe(false)
    })

    it('rejects email without domain', () => {
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@.')).toBe(false)
      expect(validateEmail('user@com')).toBe(false)
    })

    it('rejects email without username', () => {
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('@')).toBe(false)
    })

    it('rejects email with spaces', () => {
      expect(validateEmail('user name@example.com')).toBe(false)
      expect(validateEmail('user@example .com')).toBe(false)
    })

    it('rejects empty email', () => {
      expect(validateEmail('')).toBe(false)
    })

    it('rejects email with multiple @', () => {
      expect(validateEmail('user@@example.com')).toBe(false)
      expect(validateEmail('user@domain@example.com')).toBe(false)
    })
  })
})

describe('Medical Prescription Validators', () => {
  describe('validatePrescriptionDate', () => {
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)

    it('validates prescription from today', () => {
      const today = new Date()
      expect(validatePrescriptionDate(today)).toBe(true)
      expect(validatePrescriptionDate(today.toISOString())).toBe(true)
    })

    it('validates prescription from 6 months ago', () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      expect(validatePrescriptionDate(sixMonthsAgo)).toBe(true)
      expect(validatePrescriptionDate(sixMonthsAgo.toISOString())).toBe(true)
    })

    it('validates prescription from 11 months ago', () => {
      const elevenMonthsAgo = new Date()
      elevenMonthsAgo.setMonth(now.getMonth() - 11)
      expect(validatePrescriptionDate(elevenMonthsAgo)).toBe(true)
    })

    it('validates prescription from exactly 1 year ago', () => {
      const oneYearAgoDate = new Date()
      oneYearAgoDate.setFullYear(now.getFullYear() - 1)
      oneYearAgoDate.setDate(now.getDate())
      // Should be valid (within 365 days)
      expect(validatePrescriptionDate(oneYearAgoDate)).toBe(true)
    })

    it('rejects prescription older than 1 year', () => {
      const thirteenMonthsAgo = new Date()
      thirteenMonthsAgo.setMonth(now.getMonth() - 13)
      expect(validatePrescriptionDate(thirteenMonthsAgo)).toBe(false)
      expect(validatePrescriptionDate(thirteenMonthsAgo.toISOString())).toBe(false)
    })

    it('rejects prescription from 2 years ago', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(now.getFullYear() - 2)
      expect(validatePrescriptionDate(twoYearsAgo)).toBe(false)
    })

    it('rejects future prescription dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(now.getDate() + 1)
      expect(validatePrescriptionDate(tomorrow)).toBe(false)

      const nextMonth = new Date()
      nextMonth.setMonth(now.getMonth() + 1)
      expect(validatePrescriptionDate(nextMonth)).toBe(false)
    })

    it('accepts prescription date as ISO string', () => {
      const validDate = new Date()
      validDate.setMonth(now.getMonth() - 3)
      expect(validatePrescriptionDate(validDate.toISOString())).toBe(true)
    })

    it('accepts prescription date as Date object', () => {
      const validDate = new Date()
      validDate.setMonth(now.getMonth() - 3)
      expect(validatePrescriptionDate(validDate)).toBe(true)
    })
  })

  describe('validateCRM', () => {
    it('validates correct CRM format', () => {
      expect(validateCRM('123456-SP')).toBe(true)
      expect(validateCRM('069870-MG')).toBe(true) // Dr. Philipe Saraiva Cruz
      expect(validateCRM('000001-RJ')).toBe(true)
      expect(validateCRM('999999-BA')).toBe(true)
    })

    it('validates CRM for all Brazilian states', () => {
      const states = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]

      states.forEach(state => {
        expect(validateCRM(`123456-${state}`)).toBe(true)
      })
    })

    it('rejects CRM without hyphen', () => {
      expect(validateCRM('123456SP')).toBe(false)
      expect(validateCRM('123456 SP')).toBe(false)
    })

    it('rejects CRM with wrong number of digits', () => {
      expect(validateCRM('12345-SP')).toBe(false) // Only 5 digits
      expect(validateCRM('1234567-SP')).toBe(false) // 7 digits
      expect(validateCRM('123-SP')).toBe(false) // Only 3 digits
    })

    it('rejects CRM with invalid format', () => {
      // Note: validator checks FORMAT (6 digits-2 uppercase), not actual state validity
      // XX and ZZ are valid formats (even if not real states)
      expect(validateCRM('123456-S')).toBe(false) // Only 1 letter
      expect(validateCRM('123456-SPP')).toBe(false) // 3 letters
      expect(validateCRM('123456-123')).toBe(false) // Numbers instead of letters
    })

    it('rejects CRM with lowercase state', () => {
      expect(validateCRM('123456-sp')).toBe(false)
      expect(validateCRM('123456-Sp')).toBe(false)
      expect(validateCRM('123456-sP')).toBe(false)
    })

    it('rejects CRM with letters in number', () => {
      expect(validateCRM('12345A-SP')).toBe(false)
      expect(validateCRM('ABC123-SP')).toBe(false)
    })

    it('rejects empty or invalid CRM', () => {
      expect(validateCRM('')).toBe(false)
      expect(validateCRM('123456')).toBe(false)
      expect(validateCRM('-SP')).toBe(false)
    })
  })
})

describe('Formatting Functions', () => {
  describe('formatCPF', () => {
    it('formats unformatted CPF', () => {
      expect(formatCPF('11144477735')).toBe('111.444.777-35')
      expect(formatCPF('52998224725')).toBe('529.982.247-25')
    })

    it('preserves already formatted CPF', () => {
      expect(formatCPF('111.444.777-35')).toBe('111.444.777-35')
    })

    it('returns original for invalid length', () => {
      expect(formatCPF('123456789')).toBe('123456789')
      expect(formatCPF('123456789012')).toBe('123456789012')
    })

    it('handles CPF with mixed formatting', () => {
      expect(formatCPF('111-444-777-35')).toBe('111.444.777-35')
      expect(formatCPF('111 444 777 35')).toBe('111.444.777-35')
    })
  })

  describe('formatCNPJ', () => {
    it('formats unformatted CNPJ', () => {
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81')
      expect(formatCNPJ('06990590000123')).toBe('06.990.590/0001-23')
    })

    it('preserves already formatted CNPJ', () => {
      expect(formatCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81')
    })

    it('returns original for invalid length', () => {
      expect(formatCNPJ('1122233300018')).toBe('1122233300018')
      expect(formatCNPJ('112223330001811')).toBe('112223330001811')
    })

    it('handles CNPJ with mixed formatting', () => {
      expect(formatCNPJ('11-222-333-0001-81')).toBe('11.222.333/0001-81')
      expect(formatCNPJ('11 222 333 0001 81')).toBe('11.222.333/0001-81')
    })
  })

  describe('formatPhone', () => {
    it('formats 11-digit mobile phone', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
      expect(formatPhone('21987654321')).toBe('(21) 98765-4321')
    })

    it('formats 10-digit landline phone', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
      expect(formatPhone('2133334444')).toBe('(21) 3333-4444')
    })

    it('preserves already formatted phone', () => {
      expect(formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999')
      expect(formatPhone('(11) 3333-4444')).toBe('(11) 3333-4444')
    })

    it('returns original for invalid length', () => {
      expect(formatPhone('123')).toBe('123')
      expect(formatPhone('123456789012')).toBe('123456789012')
    })
  })
})

describe('Mask Functions', () => {
  describe('maskCPFOrCNPJ', () => {
    it('applies CPF mask for up to 11 digits', () => {
      expect(maskCPFOrCNPJ('111')).toBe('111')
      expect(maskCPFOrCNPJ('111444')).toBe('111.444')
      expect(maskCPFOrCNPJ('111444777')).toBe('111.444.777')
      expect(maskCPFOrCNPJ('11144477735')).toBe('111.444.777-35')
    })

    it('applies CNPJ mask for more than 11 digits', () => {
      expect(maskCPFOrCNPJ('112223330001')).toBe('11.222.333/0001')
      expect(maskCPFOrCNPJ('11222333000181')).toBe('11.222.333/0001-81')
    })

    it('removes non-numeric characters before masking', () => {
      expect(maskCPFOrCNPJ('111.444.777-35')).toBe('111.444.777-35')
      expect(maskCPFOrCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81')
    })

    it('handles empty string', () => {
      expect(maskCPFOrCNPJ('')).toBe('')
    })

    it('handles partial input during typing', () => {
      expect(maskCPFOrCNPJ('1')).toBe('1')
      expect(maskCPFOrCNPJ('11')).toBe('11')
      expect(maskCPFOrCNPJ('111')).toBe('111')
      expect(maskCPFOrCNPJ('1114')).toBe('111.4')
      expect(maskCPFOrCNPJ('111444')).toBe('111.444')
      expect(maskCPFOrCNPJ('1114447')).toBe('111.444.7')
    })
  })

  describe('maskPhone', () => {
    it('applies landline mask for up to 10 digits', () => {
      expect(maskPhone('11')).toBe('11')
      expect(maskPhone('113')).toBe('(11) 3')
      expect(maskPhone('1133334')).toBe('(11) 3333-4')
      expect(maskPhone('1133334444')).toBe('(11) 3333-4444')
    })

    it('applies mobile mask for 11 digits', () => {
      expect(maskPhone('119')).toBe('(11) 9')
      expect(maskPhone('11999')).toBe('(11) 999')
      expect(maskPhone('119999')).toBe('(11) 9999')
      expect(maskPhone('1199999')).toBe('(11) 9999-9') // Applies landline mask until 11 digits
      expect(maskPhone('11999999')).toBe('(11) 9999-99') // Still landline mask
      expect(maskPhone('119999999')).toBe('(11) 9999-999') // Still landline mask
      expect(maskPhone('1199999999')).toBe('(11) 9999-9999') // Landline complete
      expect(maskPhone('11999999999')).toBe('(11) 99999-9999') // Mobile mask kicks in at 11 digits
    })

    it('removes non-numeric characters before masking', () => {
      expect(maskPhone('(11) 99999-9999')).toBe('(11) 99999-9999')
      expect(maskPhone('11 99999-9999')).toBe('(11) 99999-9999')
    })

    it('handles empty string', () => {
      expect(maskPhone('')).toBe('')
    })

    it('handles partial input during typing', () => {
      expect(maskPhone('1')).toBe('1')
      expect(maskPhone('11')).toBe('11')
      expect(maskPhone('119')).toBe('(11) 9')
      expect(maskPhone('1199')).toBe('(11) 99')
      expect(maskPhone('11999')).toBe('(11) 999')
      expect(maskPhone('119999')).toBe('(11) 9999')
      expect(maskPhone('1199999')).toBe('(11) 9999-9')
    })
  })
})
