/**
 * Validation Schemas Unit Tests
 *
 * Testes unitários para todos os schemas de validação Zod.
 * Objetivo: 100% de cobertura de código.
 *
 * @module validation-schemas.test
 */

import { describe, expect, it } from '@jest/globals'
import {
  brazilianCEPSchema,
  brazilianPhoneSchema,
  brazilianCPFSchema,
  brazilianStateSchema,
  brazilianCRMSchema,
  brazilianAddressSchema,
  notificationPreferencesSchema,
  prescriptionEyeSchema,
  prescriptionUploadSchema,
  prescriptionUpdateSchema,
  subscriptionAddressUpdateSchema,
  deliveryPreferencesUpdateSchema,
} from '../validation-schemas'

// ============================================================================
// BRAZILIAN CEP VALIDATION
// ============================================================================

describe('brazilianCEPSchema', () => {
  it('deve aceitar CEP válido com hífen', () => {
    const result = brazilianCEPSchema.parse('35300-001')
    expect(result).toBe('35300001') // normalizado sem hífen
  })

  it('deve aceitar CEP válido sem hífen', () => {
    const result = brazilianCEPSchema.parse('35300001')
    expect(result).toBe('35300001')
  })

  it('deve rejeitar CEP com formato inválido', () => {
    expect(() => brazilianCEPSchema.parse('123')).toThrow('CEP inválido')
    expect(() => brazilianCEPSchema.parse('1234567890')).toThrow('CEP inválido')
    expect(() => brazilianCEPSchema.parse('abcde-fgh')).toThrow('CEP inválido')
  })

  it('deve rejeitar CEP vazio', () => {
    expect(() => brazilianCEPSchema.parse('')).toThrow()
  })
})

// ============================================================================
// BRAZILIAN PHONE VALIDATION
// ============================================================================

describe('brazilianPhoneSchema', () => {
  it('deve aceitar telefone com DDD e formatação', () => {
    const result = brazilianPhoneSchema.parse('(33) 99989-8026')
    expect(result).toBe('33999898026') // normalizado
  })

  it('deve aceitar telefone sem formatação', () => {
    const result = brazilianPhoneSchema.parse('33999898026')
    expect(result).toBe('33999898026')
  })

  it('deve aceitar telefone com +55', () => {
    const result = brazilianPhoneSchema.parse('+55 33 99989-8026')
    expect(result).toBe('5533999898026')
  })

  it('deve aceitar telefone fixo', () => {
    const result = brazilianPhoneSchema.parse('(33) 3521-9999')
    expect(result).toBe('3335219999')
  })

  it('deve rejeitar telefone inválido', () => {
    expect(() => brazilianPhoneSchema.parse('123')).toThrow('Telefone inválido')
    expect(() => brazilianPhoneSchema.parse('abcdefghij')).toThrow('Telefone inválido')
  })
})

// ============================================================================
// BRAZILIAN CPF VALIDATION
// ============================================================================

describe('brazilianCPFSchema', () => {
  it('deve aceitar CPF válido com formatação', () => {
    // CPF de teste válido: 123.456.789-09
    const result = brazilianCPFSchema.parse('123.456.789-09')
    expect(result).toBe('12345678909')
  })

  it('deve aceitar CPF válido sem formatação', () => {
    const result = brazilianCPFSchema.parse('12345678909')
    expect(result).toBe('12345678909')
  })

  it('deve rejeitar CPF com todos os dígitos iguais', () => {
    expect(() => brazilianCPFSchema.parse('111.111.111-11')).toThrow('dígitos verificadores incorretos')
    expect(() => brazilianCPFSchema.parse('00000000000')).toThrow('dígitos verificadores incorretos')
  })

  it('deve rejeitar CPF com dígitos verificadores incorretos', () => {
    expect(() => brazilianCPFSchema.parse('123.456.789-00')).toThrow('dígitos verificadores incorretos')
  })

  it('deve rejeitar CPF com formato inválido', () => {
    expect(() => brazilianCPFSchema.parse('123')).toThrow('CPF inválido')
    expect(() => brazilianCPFSchema.parse('abc.def.ghi-jk')).toThrow('CPF inválido')
  })
})

// ============================================================================
// BRAZILIAN STATE (UF) VALIDATION
// ============================================================================

describe('brazilianStateSchema', () => {
  it('deve aceitar UF válida', () => {
    expect(brazilianStateSchema.parse('MG')).toBe('MG')
    expect(brazilianStateSchema.parse('SP')).toBe('SP')
    expect(brazilianStateSchema.parse('RJ')).toBe('RJ')
  })

  it('deve rejeitar UF inválida', () => {
    expect(() => brazilianStateSchema.parse('XX')).toThrow('UF inválida')
    expect(() => brazilianStateSchema.parse('ZZ')).toThrow('UF inválida')
  })

  it('deve rejeitar UF em minúsculas', () => {
    expect(() => brazilianStateSchema.parse('mg')).toThrow('Estado deve ser em letras maiúsculas')
  })

  it('deve rejeitar UF com tamanho incorreto', () => {
    expect(() => brazilianStateSchema.parse('M')).toThrow('Estado deve ter 2 caracteres')
    expect(() => brazilianStateSchema.parse('MGX')).toThrow('Estado deve ter 2 caracteres')
  })
})

// ============================================================================
// BRAZILIAN CRM VALIDATION
// ============================================================================

describe('brazilianCRMSchema', () => {
  it('deve aceitar CRM válido', () => {
    expect(brazilianCRMSchema.parse('CRM-MG 69870')).toBe('CRM-MG 69870')
    expect(brazilianCRMSchema.parse('CRM-SP 123456')).toBe('CRM-SP 123456')
  })

  it('deve rejeitar CRM sem espaço', () => {
    expect(() => brazilianCRMSchema.parse('CRM-MG69870')).toThrow('CRM inválido')
  })

  it('deve rejeitar CRM sem UF', () => {
    expect(() => brazilianCRMSchema.parse('CRM 69870')).toThrow('CRM inválido')
  })

  it('deve rejeitar CRM com formato inválido', () => {
    expect(() => brazilianCRMSchema.parse('69870')).toThrow('CRM inválido')
  })
})

// ============================================================================
// BRAZILIAN ADDRESS VALIDATION
// ============================================================================

describe('brazilianAddressSchema', () => {
  const validAddress = {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apt 45',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-001',
    country: 'Brasil',
  }

  it('deve aceitar endereço completo válido', () => {
    const result = brazilianAddressSchema.parse(validAddress)
    expect(result.street).toBe('Rua das Flores')
    expect(result.zipCode).toBe('35300001') // normalizado
    expect(result.state).toBe('MG')
  })

  it('deve aceitar endereço sem complemento', () => {
    const { complement, ...addressWithoutComplement } = validAddress
    const result = brazilianAddressSchema.parse(addressWithoutComplement)
    expect(result.complement).toBeUndefined()
  })

  it('deve usar "Brasil" como país padrão', () => {
    const { country, ...addressWithoutCountry } = validAddress
    const result = brazilianAddressSchema.parse(addressWithoutCountry)
    expect(result.country).toBe('Brasil')
  })

  it('deve rejeitar rua muito curta', () => {
    expect(() =>
      brazilianAddressSchema.parse({ ...validAddress, street: 'Ab' })
    ).toThrow('Rua/Avenida deve ter pelo menos 3 caracteres')
  })

  it('deve rejeitar sem número', () => {
    expect(() =>
      brazilianAddressSchema.parse({ ...validAddress, number: '' })
    ).toThrow('Número é obrigatório')
  })

  it('deve rejeitar CEP inválido', () => {
    expect(() =>
      brazilianAddressSchema.parse({ ...validAddress, zipCode: '123' })
    ).toThrow('CEP inválido')
  })

  it('deve rejeitar UF inválida', () => {
    expect(() =>
      brazilianAddressSchema.parse({ ...validAddress, state: 'XX' })
    ).toThrow('UF inválida')
  })
})

// ============================================================================
// NOTIFICATION PREFERENCES VALIDATION
// ============================================================================

describe('notificationPreferencesSchema', () => {
  it('deve aceitar preferências válidas', () => {
    const result = notificationPreferencesSchema.parse({
      email: true,
      whatsapp: true,
      sms: false,
    })
    expect(result.email).toBe(true)
    expect(result.whatsapp).toBe(true)
    expect(result.sms).toBe(false)
  })

  it('deve usar valores padrão', () => {
    const result = notificationPreferencesSchema.parse({})
    expect(result.email).toBe(true) // default
    expect(result.whatsapp).toBe(false) // default
    expect(result.sms).toBe(false) // default
  })

  it('deve rejeitar valores não booleanos', () => {
    expect(() =>
      notificationPreferencesSchema.parse({ email: 'true' })
    ).toThrow()
  })
})

// ============================================================================
// PRESCRIPTION EYE DATA VALIDATION
// ============================================================================

describe('prescriptionEyeSchema', () => {
  it('deve aceitar dados oftalmológicos válidos', () => {
    const result = prescriptionEyeSchema.parse({
      sphere: -2.5,
      cylinder: -0.75,
      axis: 180,
      addition: 1.5,
    })
    expect(result.sphere).toBe(-2.5)
    expect(result.cylinder).toBe(-0.75)
    expect(result.axis).toBe(180)
    expect(result.addition).toBe(1.5)
  })

  it('deve aceitar dados sem campos opcionais', () => {
    const result = prescriptionEyeSchema.parse({
      sphere: -3.0,
    })
    expect(result.sphere).toBe(-3.0)
    expect(result.cylinder).toBeUndefined()
  })

  it('deve rejeitar esfera fora do range', () => {
    expect(() =>
      prescriptionEyeSchema.parse({ sphere: -25 })
    ).toThrow('Esfera deve estar entre -20 e +20')
    expect(() =>
      prescriptionEyeSchema.parse({ sphere: 25 })
    ).toThrow('Esfera deve estar entre -20 e +20')
  })

  it('deve rejeitar cilindro fora do range', () => {
    expect(() =>
      prescriptionEyeSchema.parse({ sphere: -2, cylinder: -10 })
    ).toThrow('Cilindro deve estar entre -6 e +6')
  })

  it('deve rejeitar eixo fora do range', () => {
    expect(() =>
      prescriptionEyeSchema.parse({ sphere: -2, axis: 200 })
    ).toThrow('Eixo deve estar entre 0 e 180')
  })

  it('deve rejeitar adição fora do range', () => {
    expect(() =>
      prescriptionEyeSchema.parse({ sphere: -2, addition: 5 })
    ).toThrow('Adição deve estar entre 0 e 4')
  })
})

// ============================================================================
// PRESCRIPTION UPLOAD VALIDATION
// ============================================================================

describe('prescriptionUploadSchema', () => {
  const validUpload = {
    file: 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2U=', // base64 válido
    fileName: 'prescricao_dr_philipe.pdf',
    fileSize: 2048576, // 2MB
    mimeType: 'application/pdf' as const,
    leftEye: {
      sphere: -2.5,
      cylinder: -0.75,
      axis: 180,
    },
    rightEye: {
      sphere: -3.0,
      cylinder: -1.0,
      axis: 175,
    },
    doctorName: 'Dr. Philipe Saraiva Cruz',
    doctorCRM: 'CRM-MG 69870',
    prescriptionDate: '2024-10-15T00:00:00.000Z',
  }

  it('deve aceitar upload de prescrição válido', () => {
    const result = prescriptionUploadSchema.parse(validUpload)
    expect(result.fileName).toBe('prescricao_dr_philipe.pdf')
    expect(result.mimeType).toBe('application/pdf')
    expect(result.doctorCRM).toBe('CRM-MG 69870')
  })

  it('deve aceitar MIME type JPG', () => {
    const result = prescriptionUploadSchema.parse({
      ...validUpload,
      fileName: 'prescricao.jpg',
      mimeType: 'image/jpeg',
    })
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('deve aceitar MIME type PNG', () => {
    const result = prescriptionUploadSchema.parse({
      ...validUpload,
      fileName: 'prescricao.png',
      mimeType: 'image/png',
    })
    expect(result.mimeType).toBe('image/png')
  })

  it('deve rejeitar arquivo maior que 5MB', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        fileSize: 6 * 1024 * 1024, // 6MB
      })
    ).toThrow('Arquivo deve ter no máximo 5MB')
  })

  it('deve rejeitar MIME type inválido', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        // @ts-expect-error - testando tipo inválido
        mimeType: 'text/plain',
      })
    ).toThrow('Formato inválido')
  })

  it('deve rejeitar nome de arquivo sem extensão válida', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        fileName: 'prescricao.txt',
      })
    ).toThrow('Nome do arquivo deve terminar com .pdf, .jpg, .jpeg ou .png')
  })

  it('deve rejeitar arquivo base64 inválido', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        file: 'invalid!!!base64@@@',
      })
    ).toThrow('Arquivo deve estar em formato base64 válido')
  })

  it('deve rejeitar sem nome do médico', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        doctorName: '',
      })
    ).toThrow('Nome do médico é obrigatório')
  })

  it('deve rejeitar CRM inválido', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        doctorCRM: '69870',
      })
    ).toThrow('CRM inválido')
  })

  it('deve rejeitar data inválida', () => {
    expect(() =>
      prescriptionUploadSchema.parse({
        ...validUpload,
        prescriptionDate: 'not-a-date',
      })
    ).toThrow('Data da prescrição deve ser uma data válida')
  })
})

// ============================================================================
// PRESCRIPTION UPDATE VALIDATION
// ============================================================================

describe('prescriptionUpdateSchema', () => {
  it('deve aceitar atualização com prescriptionId', () => {
    const result = prescriptionUpdateSchema.parse({
      prescriptionId: 'clxyz1234567890abcdef',
      doctorName: 'Dr. Philipe Saraiva Cruz',
    })
    expect(result.prescriptionId).toBe('clxyz1234567890abcdef')
    expect(result.doctorName).toBe('Dr. Philipe Saraiva Cruz')
  })

  it('deve aceitar atualização parcial', () => {
    const result = prescriptionUpdateSchema.parse({
      prescriptionId: 'clxyz1234567890abcdef',
      fileName: 'nova_prescricao.pdf',
    })
    expect(result.fileName).toBe('nova_prescricao.pdf')
    expect(result.doctorName).toBeUndefined()
  })

  it('deve rejeitar sem prescriptionId', () => {
    expect(() =>
      prescriptionUpdateSchema.parse({
        doctorName: 'Dr. Philipe',
      })
    ).toThrow()
  })

  it('deve rejeitar prescriptionId inválido', () => {
    expect(() =>
      prescriptionUpdateSchema.parse({
        prescriptionId: 'invalid-id',
      })
    ).toThrow('ID da prescrição inválido')
  })
})

// ============================================================================
// SUBSCRIPTION ADDRESS UPDATE VALIDATION
// ============================================================================

describe('subscriptionAddressUpdateSchema', () => {
  const validUpdate = {
    shippingAddress: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-001',
    },
  }

  it('deve aceitar atualização de endereço válida', () => {
    const result = subscriptionAddressUpdateSchema.parse(validUpdate)
    expect(result.shippingAddress.street).toBe('Rua das Flores')
    expect(result.shippingAddress.zipCode).toBe('35300001') // normalizado
  })

  it('deve rejeitar sem shippingAddress', () => {
    expect(() => subscriptionAddressUpdateSchema.parse({})).toThrow()
  })

  it('deve rejeitar endereço inválido', () => {
    expect(() =>
      subscriptionAddressUpdateSchema.parse({
        shippingAddress: {
          street: 'Ab', // muito curto
          number: '123',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-001',
        },
      })
    ).toThrow()
  })
})

// ============================================================================
// DELIVERY PREFERENCES UPDATE VALIDATION
// ============================================================================

describe('deliveryPreferencesUpdateSchema', () => {
  const validPreferences = {
    deliveryAddress: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-001',
    },
    deliveryInstructions: 'Deixar com o porteiro',
    preferredDeliveryTime: 'MORNING' as const,
    deliveryFrequency: 'MONTHLY' as const,
    contactPhone: '(33) 99989-8026',
    alternativePhone: '(33) 3521-9999',
    notificationPreferences: {
      email: true,
      whatsapp: true,
      sms: false,
    },
  }

  it('deve aceitar preferências de entrega válidas', () => {
    const result = deliveryPreferencesUpdateSchema.parse(validPreferences)
    expect(result.deliveryAddress.street).toBe('Rua das Flores')
    expect(result.contactPhone).toBe('33999898026') // normalizado
    expect(result.preferredDeliveryTime).toBe('MORNING')
  })

  it('deve aceitar sem campos opcionais', () => {
    const { deliveryInstructions, alternativePhone, preferredDeliveryTime, deliveryFrequency, ...minimal } =
      validPreferences
    const result = deliveryPreferencesUpdateSchema.parse(minimal)
    expect(result.deliveryInstructions).toBeUndefined()
    expect(result.alternativePhone).toBeUndefined()
  })

  it('deve rejeitar instruções muito longas', () => {
    expect(() =>
      deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        deliveryInstructions: 'A'.repeat(501),
      })
    ).toThrow('Instruções devem ter no máximo 500 caracteres')
  })

  it('deve rejeitar horário de entrega inválido', () => {
    expect(() =>
      deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        // @ts-expect-error - testando valor inválido
        preferredDeliveryTime: 'MIDNIGHT',
      })
    ).toThrow('Horário de entrega inválido')
  })

  it('deve rejeitar frequência inválida', () => {
    expect(() =>
      deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        // @ts-expect-error - testando valor inválido
        deliveryFrequency: 'YEARLY',
      })
    ).toThrow('Frequência de entrega inválida')
  })

  it('deve rejeitar telefone inválido', () => {
    expect(() =>
      deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        contactPhone: '123',
      })
    ).toThrow('Telefone inválido')
  })

  it('deve aceitar todos os horários de entrega válidos', () => {
    const times = ['MORNING', 'AFTERNOON', 'EVENING', 'ANY'] as const
    times.forEach((time) => {
      const result = deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        preferredDeliveryTime: time,
      })
      expect(result.preferredDeliveryTime).toBe(time)
    })
  })

  it('deve aceitar todas as frequências válidas', () => {
    const frequencies = ['MONTHLY', 'BIMONTHLY', 'QUARTERLY'] as const
    frequencies.forEach((freq) => {
      const result = deliveryPreferencesUpdateSchema.parse({
        ...validPreferences,
        deliveryFrequency: freq,
      })
      expect(result.deliveryFrequency).toBe(freq)
    })
  })
})
