#!/usr/bin/env node

// Script de teste para a calculadora de economia
// Este script testa todos os cenários possíveis

const usagePatterns = [
  {
    id: 'occasional',
    name: 'Uso Ocasional',
    daysPerMonth: 10,
    description: 'Fins de semana e eventos especiais'
  },
  {
    id: 'regular',
    name: 'Uso Regular',
    daysPerMonth: 20,
    description: 'Trabalho e atividades sociais'
  },
  {
    id: 'daily',
    name: 'Uso Diário',
    daysPerMonth: 30,
    description: 'Todos os dias da semana'
  }
];

const lensTypes = [
  {
    id: 'daily',
    name: 'Lentes Diárias',
    avulsoPrice: 4.50,
    subscriptionPrice: 2.70
  },
  {
    id: 'weekly',
    name: 'Lentes Semanais',
    avulsoPrice: 12.00,
    subscriptionPrice: 7.20
  },
  {
    id: 'monthly',
    name: 'Lentes Mensais',
    avulsoPrice: 25.00,
    subscriptionPrice: 15.00
  }
];

function calculateEconomy(lensTypeId, usagePatternId) {
  const usagePattern = usagePatterns.find(p => p.id === usagePatternId);
  const lensType = lensTypes.find(l => l.id === lensTypeId);

  if (!usagePattern || !lensType) {
    throw new Error('Padrão de uso ou tipo de lente inválido');
  }

  // Cálculo baseado no uso mensal (2 lentes por dia de uso)
  const lensesPerMonth = usagePattern.daysPerMonth * 2;

  // Custos mensais
  const monthlyAvulso = lensesPerMonth * lensType.avulsoPrice;
  const monthlySubscription = lensesPerMonth * lensType.subscriptionPrice;
  const monthlySavings = monthlyAvulso - monthlySubscription;

  // Custos anuais
  const yearlyAvulso = monthlyAvulso * 12;
  const yearlySubscription = monthlySubscription * 12;
  const yearlySavings = yearlyAvulso - yearlySubscription;

  // Percentual de economia
  const savingsPercentage = (monthlySavings / monthlyAvulso) * 100;

  return {
    lensType: lensType.name,
    usagePattern: usagePattern.name,
    daysPerMonth: usagePattern.daysPerMonth,
    lensesPerMonth,
    pricePerLens: {
      avulso: lensType.avulsoPrice,
      subscription: lensType.subscriptionPrice
    },
    monthlyAvulso,
    monthlySubscription,
    monthlySavings,
    yearlyAvulso,
    yearlySubscription,
    yearlySavings,
    savingsPercentage
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function printResult(result) {
  console.log('\n' + '='.repeat(70));
  console.log(`📊 ${result.lensType} - ${result.usagePattern}`);
  console.log('='.repeat(70));
  console.log(`Dias de uso por mês: ${result.daysPerMonth}`);
  console.log(`Lentes necessárias por mês: ${result.lensesPerMonth} lentes (2 por dia)`);
  console.log(`\nPreço por lente:`);
  console.log(`  • Avulso: ${formatCurrency(result.pricePerLens.avulso)}`);
  console.log(`  • Assinatura: ${formatCurrency(result.pricePerLens.subscription)}`);

  console.log(`\n💰 CUSTOS MENSAIS:`);
  console.log(`  • Compra Avulsa: ${formatCurrency(result.monthlyAvulso)}`);
  console.log(`  • Assinatura SVlentes: ${formatCurrency(result.monthlySubscription)}`);
  console.log(`  • 💚 Economia Mensal: ${formatCurrency(result.monthlySavings)} (${result.savingsPercentage.toFixed(1)}%)`);

  console.log(`\n📅 CUSTOS ANUAIS:`);
  console.log(`  • Compra Avulsa: ${formatCurrency(result.yearlyAvulso)}`);
  console.log(`  • Assinatura SVlentes: ${formatCurrency(result.yearlySubscription)}`);
  console.log(`  • 💚 Economia Anual: ${formatCurrency(result.yearlySavings)}`);
}

// Teste todos os cenários
console.log('\n🔬 TESTE COMPLETO DA CALCULADORA DE ECONOMIA\n');
console.log('Testando todos os cenários possíveis...\n');

let totalTests = 0;
let passedTests = 0;

lensTypes.forEach(lensType => {
  usagePatterns.forEach(usagePattern => {
    totalTests++;
    try {
      const result = calculateEconomy(lensType.id, usagePattern.id);

      // Validações
      if (result.monthlySavings < 0) {
        console.error(`❌ ERRO: Economia negativa detectada!`);
      } else if (result.savingsPercentage < 0 || result.savingsPercentage > 100) {
        console.error(`❌ ERRO: Percentual de economia inválido: ${result.savingsPercentage}%`);
      } else if (result.monthlySubscription >= result.monthlyAvulso) {
        console.error(`❌ ERRO: Assinatura mais cara que avulso!`);
      } else {
        passedTests++;
        printResult(result);
      }
    } catch (error) {
      console.error(`❌ ERRO no teste: ${error.message}`);
    }
  });
});

console.log('\n' + '='.repeat(70));
console.log(`\n✅ RESUMO DOS TESTES:`);
console.log(`Total de testes: ${totalTests}`);
console.log(`Testes bem-sucedidos: ${passedTests}`);
console.log(`Testes falhados: ${totalTests - passedTests}`);
console.log(`Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

// Teste de casos extremos
console.log('\n🧪 TESTES DE CASOS EXTREMOS:\n');

console.log('1. Teste com entrada inválida (tipo de lente inexistente):');
try {
  calculateEconomy('invalid', 'regular');
  console.log('❌ Deveria ter lançado erro!');
} catch (error) {
  console.log('✅ Erro capturado corretamente:', error.message);
}

console.log('\n2. Teste com entrada inválida (padrão de uso inexistente):');
try {
  calculateEconomy('daily', 'invalid');
  console.log('❌ Deveria ter lançado erro!');
} catch (error) {
  console.log('✅ Erro capturado corretamente:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n✨ TESTE CONCLUÍDO!\n');
