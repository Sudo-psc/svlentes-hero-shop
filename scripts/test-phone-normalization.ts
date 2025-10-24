function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned.substring(2)
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    return cleaned.substring(2)
  }
  
  if (cleaned.length === 10 || cleaned.length === 11) {
    return cleaned
  }
  
  return cleaned
}

function isValidBrazilianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  return normalized.length === 10 || normalized.length === 11
}

console.log('📱 Teste de Normalização de Telefone\n');

const testCases = [
  '5533998980026',     // SendPulse format (13 dígitos)
  '33998980026',       // DDD + número (11 dígitos)
  '(33) 99898-0026',   // Formato formatado
  '+55 33 99898-0026', // Formato internacional
  '553398980026',      // Sem o 9 (12 dígitos)
  '3398980026',        // DDD + número sem 9 (10 dígitos)
];

testCases.forEach(phone => {
  const normalized = normalizePhoneNumber(phone);
  const isValid = isValidBrazilianPhone(phone);
  console.log(`Original:    ${phone}`);
  console.log(`Normalizado: ${normalized} (${normalized.length} dígitos)`);
  console.log(`Válido:      ${isValid ? '✅' : '❌'}`);
  console.log('---');
});
