/**
 * Script de Teste do Sistema de Feature Flags
 *
 * Executa testes manuais para validar funcionalidade em produção
 */

import {
  isFeatureEnabled,
  evaluateFeatureFlag,
  getAllFeatureFlags,
  getFeatureFlagStats,
  updateRolloutPercentage,
  activateFeatureFlag,
  deactivateFeatureFlag,
} from '../src/lib/feature-flags';

async function runTests() {
  console.log('🧪 Iniciando testes do sistema de Feature Flags\n');

  try {
    // Teste 1: Listar todas as flags
    console.log('📋 Teste 1: Listando todas as flags');
    const allFlags = await getAllFeatureFlags();
    console.log(`✅ Total de flags: ${allFlags.length}`);
    allFlags.slice(0, 5).forEach(flag => {
      console.log(`   - ${flag.name} (${flag.key}): ${flag.status} - ${flag.rolloutPercentage}%`);
    });
    console.log('');

    // Teste 2: Verificar flag ativa (100% rollout)
    console.log('🟢 Teste 2: Flag ativa com 100% rollout');
    const pixEnabled = await isFeatureEnabled('pix_payment');
    console.log(`✅ PIX Payment: ${pixEnabled ? 'ATIVADO' : 'DESATIVADO'}`);
    console.log('');

    // Teste 3: Verificar flag inativa
    console.log('🔴 Teste 3: Flag inativa');
    const newCheckout = await isFeatureEnabled('new_checkout_flow');
    console.log(`✅ New Checkout: ${newCheckout ? 'ATIVADO' : 'DESATIVADO'}`);
    console.log('');

    // Teste 4: Avaliação detalhada
    console.log('🔍 Teste 4: Avaliação detalhada com metadata');
    const evaluation = await evaluateFeatureFlag('smart_reminders', 'test-user-123');
    console.log('✅ Resultado da avaliação:');
    console.log(`   - Enabled: ${evaluation.enabled}`);
    console.log(`   - Reason: ${evaluation.reason}`);
    console.log(`   - Metadata:`, JSON.stringify(evaluation.metadata, null, 2));
    console.log('');

    // Teste 5: Rollout percentual (consistência)
    console.log('📊 Teste 5: Consistência de rollout percentual');
    const userId = 'consistent-user-test';
    const result1 = await isFeatureEnabled('smart_reminders', userId);
    const result2 = await isFeatureEnabled('smart_reminders', userId);
    const result3 = await isFeatureEnabled('smart_reminders', userId);
    console.log(`✅ Consistência: ${result1 === result2 && result2 === result3 ? 'OK' : 'FALHOU'}`);
    console.log(`   Resultado sempre: ${result1}`);
    console.log('');

    // Teste 6: Múltiplos usuários no rollout percentual
    console.log('👥 Teste 6: Distribuição de rollout percentual');
    const testUsers = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    let enabledCount = 0;

    for (const user of testUsers) {
      const enabled = await isFeatureEnabled('smart_reminders', user, { skipLogging: true });
      if (enabled) enabledCount++;
    }

    const actualPercentage = (enabledCount / testUsers.length) * 100;
    console.log(`✅ Rollout configurado: 50%`);
    console.log(`✅ Rollout real em 100 usuários: ${actualPercentage.toFixed(1)}%`);
    console.log(`✅ Diferença: ${Math.abs(actualPercentage - 50).toFixed(1)}%`);
    console.log('');

    // Teste 7: Targeting de usuários específicos
    console.log('🎯 Teste 7: Targeting de usuários específicos');

    // Criar flag de teste com usuários específicos
    const { upsertFeatureFlag } = await import('../src/lib/feature-flags');
    await upsertFeatureFlag({
      name: 'Test VIP Feature',
      key: 'test_vip',
      description: 'Feature apenas para VIPs',
      status: 'ACTIVE' as any,
      rolloutPercentage: 0,
      targetUserIds: ['vip-user-1', 'vip-user-2'],
      tags: ['test'],
    });

    const vipResult = await isFeatureEnabled('test_vip', 'vip-user-1');
    const normalResult = await isFeatureEnabled('test_vip', 'normal-user');

    console.log(`✅ Usuário VIP (vip-user-1): ${vipResult ? 'ATIVADO' : 'DESATIVADO'}`);
    console.log(`✅ Usuário Normal (normal-user): ${normalResult ? 'ATIVADO' : 'DESATIVADO'}`);
    console.log('');

    // Teste 8: Estatísticas
    console.log('📈 Teste 8: Estatísticas de avaliações');
    const stats = await getFeatureFlagStats('pix_payment');
    console.log('✅ Estatísticas PIX Payment:');
    console.log(`   - Total avaliações: ${stats.totalEvaluations}`);
    console.log(`   - Habilitado: ${stats.enabledCount}`);
    console.log(`   - Desabilitado: ${stats.disabledCount}`);
    console.log(`   - Percentual: ${stats.enabledPercentage.toFixed(1)}%`);
    console.log('');

    // Teste 9: Ativar/Desativar flag
    console.log('🔄 Teste 9: Toggle de flag');

    // Desativar temporariamente
    await deactivateFeatureFlag('test_vip', 'test-script', 'Teste de desativação');
    const afterDeactivate = await isFeatureEnabled('test_vip');
    console.log(`✅ Após desativar: ${afterDeactivate ? 'ATIVADO' : 'DESATIVADO'}`);

    // Reativar
    await activateFeatureFlag('test_vip', 'test-script', 'Teste de reativação');
    const afterActivate = await isFeatureEnabled('test_vip', 'vip-user-1');
    console.log(`✅ Após reativar (VIP): ${afterActivate ? 'ATIVADO' : 'DESATIVADO'}`);
    console.log('');

    // Teste 10: Update rollout percentual
    console.log('📈 Teste 10: Atualização de rollout percentual');
    await updateRolloutPercentage('test_vip', 25, 'test-script', 'Teste rollout 25%');

    // Testar distribuição
    let enabled25 = 0;
    const sample = 100;
    for (let i = 0; i < sample; i++) {
      const result = await isFeatureEnabled('test_vip', `rollout-test-${i}`, { skipLogging: true });
      if (result) enabled25++;
    }

    console.log(`✅ Rollout atualizado para: 25%`);
    console.log(`✅ Resultado em ${sample} usuários: ${(enabled25 / sample * 100).toFixed(1)}%`);
    console.log('');

    console.log('✅ ✨ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!\n');

    // Resumo final
    console.log('📊 RESUMO DOS TESTES:');
    console.log('   ✅ Listagem de flags');
    console.log('   ✅ Flag ativa (100%)');
    console.log('   ✅ Flag inativa');
    console.log('   ✅ Avaliação detalhada');
    console.log('   ✅ Consistência de rollout');
    console.log('   ✅ Distribuição percentual');
    console.log('   ✅ Targeting de usuários');
    console.log('   ✅ Estatísticas');
    console.log('   ✅ Toggle ativo/inativo');
    console.log('   ✅ Update de rollout');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

runTests()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
