import {
    leadFormSchema,
    calculatorSchema,
    validateCPF,
    validateCEP,
    formatPhone,
    formatCPF,
    formatCEP,
    type LeadFormData
} from '../validations'

describe('Lead Form Validation', () => {
    describe('leadFormSchema', () => {
        it('validates correct lead form data', () => {
            const validData: LeadFormData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('rejects empty name', () => {
            const invalidData = {
                nome: '',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Nome deve ter pelo menos 2 caracteres')
            }
        })

        it('rejects short name', () => {
            const invalidData = {
                nome: 'J',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Nome deve ter pelo menos 2 caracteres')
            }
        })

        it('rejects very long name', () => {
            const invalidData = {
                nome: 'A'.repeat(101),
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Nome deve ter no máximo 100 caracteres')
            }
        })

        it('rejects invalid email format', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'invalid-email',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Email inválido')
            }
        })

        it('rejects short WhatsApp number', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '123',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('WhatsApp deve ter pelo menos 10 dígitos')
            }
        })

        it('rejects WhatsApp with invalid characters', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '11999999999abc',
                email: 'joao@email.com',
                lgpdConsent: true
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('WhatsApp deve conter apenas números e símbolos válidos')
            }
        })

        it('rejects when LGPD consent is false', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: false
            }

            const result = leadFormSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Você deve aceitar os termos de privacidade')
            }
        })

        it('accepts various WhatsApp formats', () => {
            const validFormats = [
                '(11) 99999-9999',
                '11 99999-9999',
                '11999999999'
            ]

            validFormats.forEach(whatsapp => {
                const data = {
                    nome: 'João Silva',
                    whatsapp,
                    email: 'joao@email.com',
                    lgpdConsent: true
                }

                const result = leadFormSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })
    })

    describe('calculatorSchema', () => {
        it('validates calculator data with lead info', () => {
            const validData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true,
                currentSpending: 150,
                lensType: 'daily' as const,
                usage: 'regular' as const
            }

            const result = calculatorSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('rejects negative spending', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true,
                currentSpending: -50,
                lensType: 'daily' as const,
                usage: 'regular' as const
            }

            const result = calculatorSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Gasto atual deve ser positivo')
            }
        })

        it('rejects invalid lens type', () => {
            const invalidData = {
                nome: 'João Silva',
                whatsapp: '(11) 99999-9999',
                email: 'joao@email.com',
                lgpdConsent: true,
                currentSpending: 150,
                lensType: 'invalid' as any,
                usage: 'regular' as const
            }

            const result = calculatorSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Tipo de lente inválido')
            }
        })
    })
})

describe('Validation Utilities', () => {
    describe('validateCPF', () => {
        it('validates correct CPF', () => {
            expect(validateCPF('11144477735')).toBe(true)
            expect(validateCPF('111.444.777-35')).toBe(true)
        })

        it('rejects invalid CPF', () => {
            expect(validateCPF('11111111111')).toBe(false) // All same digits
            expect(validateCPF('12345678901')).toBe(false) // Invalid check digits
            expect(validateCPF('123456789')).toBe(false) // Too short
            expect(validateCPF('123456789012')).toBe(false) // Too long
        })

        it('handles CPF with formatting', () => {
            expect(validateCPF('111.444.777-35')).toBe(true)
            expect(validateCPF('111-444-777.35')).toBe(true)
        })
    })

    describe('validateCEP', () => {
        it('validates correct CEP', () => {
            expect(validateCEP('01234567')).toBe(true)
            expect(validateCEP('01234-567')).toBe(true)
        })

        it('rejects invalid CEP', () => {
            expect(validateCEP('1234567')).toBe(false) // Too short
            expect(validateCEP('123456789')).toBe(false) // Too long
            expect(validateCEP('abcd1234')).toBe(false) // Contains letters
        })
    })

    describe('formatPhone', () => {
        it('formats 11-digit phone number', () => {
            expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
        })

        it('formats 10-digit phone number', () => {
            expect(formatPhone('1199999999')).toBe('(11) 9999-9999')
        })

        it('returns original for invalid length', () => {
            expect(formatPhone('123')).toBe('123')
            expect(formatPhone('123456789012')).toBe('123456789012')
        })

        it('handles already formatted numbers', () => {
            expect(formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999')
        })
    })

    describe('formatCPF', () => {
        it('formats CPF correctly', () => {
            expect(formatCPF('11144477735')).toBe('111.444.777-35')
        })

        it('handles CPF with existing formatting', () => {
            expect(formatCPF('111.444.777-35')).toBe('111.444.777-35')
        })
    })

    describe('formatCEP', () => {
        it('formats CEP correctly', () => {
            expect(formatCEP('01234567')).toBe('01234-567')
        })

        it('handles CEP with existing formatting', () => {
            expect(formatCEP('01234-567')).toBe('01234-567')
        })
    })
})