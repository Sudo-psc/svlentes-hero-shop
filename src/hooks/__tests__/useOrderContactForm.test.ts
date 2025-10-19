import { validateContactField } from '../useOrderContactForm'

describe('validateContactField', () => {
    it('validates name length', () => {
        expect(validateContactField('name', '')).toBe('Nome deve ter pelo menos 3 caracteres')
        expect(validateContactField('name', 'Jo')).toBe('Nome deve ter pelo menos 3 caracteres')
        expect(validateContactField('name', 'João')).toBe('')
    })

    it('validates email format', () => {
        expect(validateContactField('email', 'invalid-email')).toBe('Email inválido')
        expect(validateContactField('email', 'user@example.com')).toBe('')
    })

    it('validates brazilian phone numbers', () => {
        expect(validateContactField('phone', '')).toBe('Telefone inválido (formato: (XX) 9XXXX-XXXX)')
        expect(validateContactField('phone', '(11) 99999-9999')).toBe('')
    })

    it('validates CPF/CNPJ when present', () => {
        expect(validateContactField('cpfCnpj', '')).toBe('')
        expect(validateContactField('cpfCnpj', '111.444.777-35')).toBe('')
        expect(validateContactField('cpfCnpj', '123')).toBe('CPF/CNPJ inválido')
    })

    it('requires consent toggles', () => {
        expect(validateContactField('acceptsTerms', false)).toBe('Você deve aceitar os termos de uso')
        expect(validateContactField('acceptsTerms', true)).toBe('')

        expect(validateContactField('acceptsDataProcessing', false)).toBe('Você deve autorizar o processamento de dados')
        expect(validateContactField('acceptsDataProcessing', true)).toBe('')
    })

    it('ignores other fields by default', () => {
        expect(validateContactField('billingType', 'PIX')).toBe('')
    })
})
