import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatPhone,
  formatZipCode,
} from '../formatters'

describe('formatters', () => {
  it('formats short and long dates in pt-BR locale', () => {
    const date = new Date('2024-05-20T12:00:00Z')

    expect(formatDate(date)).toBe('20/05/2024')
    expect(formatDate('2024-05-20T12:00:00Z')).toBe('20/05/2024')
    expect(formatDateLong(date)).toBe('20 de maio de 2024')
  })

  it('formats currency respecting locale rules', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
    expect(formatCurrency(199.9)).toBe('R$\u00a0199,90')
  })

  it('formats Brazilian phone numbers when possible', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('(21)33334444')).toBe('(21) 3333-4444')
    expect(formatPhone('123')).toBe('123')
  })

  it('formats CEP codes', () => {
    expect(formatZipCode('12345678')).toBe('12345-678')
    expect(formatZipCode('12345-678')).toBe('12345-678')
    expect(formatZipCode('1234')).toBe('1234')
  })
})
