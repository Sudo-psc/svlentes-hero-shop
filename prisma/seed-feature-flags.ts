import { PrismaClient, FeatureFlagStatus, FeatureFlagEnvironment } from '@prisma/client';

const prisma = new PrismaClient();

const ESSENTIAL_FLAGS = [
  {
    name: 'WhatsApp Support AI',
    key: 'whatsapp_ai_support',
    description:
      'Habilita respostas automáticas via IA para conversas do WhatsApp. Quando desativada, todas as mensagens exigem atendimento manual.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Customer Support Team',
    tags: ['whatsapp', 'ai', 'support', 'automation'],
  },
  {
    name: 'New Checkout Flow',
    key: 'new_checkout_flow',
    description:
      'Novo fluxo de checkout com etapas otimizadas e integração aprimorada com Asaas. Inclui validação de CPF em tempo real e seleção de método de pagamento melhorada.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.DEVELOPMENT],
    owner: 'Engineering Team',
    tags: ['checkout', 'payment', 'experimental'],
  },
  {
    name: 'PIX Payment Option',
    key: 'pix_payment',
    description:
      'Habilita PIX como método de pagamento nas assinaturas. Quando ativa, usuários podem escolher PIX como forma de pagamento recorrente.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Payment Team',
    tags: ['payment', 'pix', 'brazil'],
  },
  {
    name: 'Subscription Pause Feature',
    key: 'subscription_pause',
    description:
      'Permite que assinantes pausem suas assinaturas temporariamente (até 3 meses). Durante a pausa, não há cobranças mas também não há entregas.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.DEVELOPMENT],
    owner: 'Product Team',
    tags: ['subscription', 'flexibility', 'retention'],
  },
  {
    name: 'Smart Reminder System',
    key: 'smart_reminders',
    description:
      'Sistema inteligente de lembretes com ML que escolhe o melhor canal e horário para notificar usuários sobre renovações e entregas.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 50,
    targetEnvironments: [FeatureFlagEnvironment.PRODUCTION],
    owner: 'Data Science Team',
    tags: ['ml', 'notifications', 'engagement'],
  },
  {
    name: 'Enhanced Analytics Dashboard',
    key: 'enhanced_analytics',
    description:
      'Dashboard administrativo com métricas avançadas de assinaturas, churn prediction, e análise de comportamento de usuários.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.DEVELOPMENT],
    owner: 'Analytics Team',
    tags: ['analytics', 'dashboard', 'admin'],
  },
  {
    name: 'Referral Program',
    key: 'referral_program',
    description:
      'Programa de indicação onde assinantes ganham descontos ao convidar amigos. Ambos recebem benefícios quando a nova assinatura é ativada.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.STAGING],
    owner: 'Growth Team',
    tags: ['growth', 'referral', 'marketing'],
  },
  {
    name: 'Prescription Upload',
    key: 'prescription_upload',
    description:
      'Permite que usuários façam upload de suas receitas oftalmológicas diretamente no site. Validação automática com OCR e confirmação médica.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Medical Compliance Team',
    tags: ['prescription', 'compliance', 'medical'],
  },
  {
    name: 'Emergency Contact Feature',
    key: 'emergency_contact',
    description:
      'Botão de emergência visível em todas as páginas para casos de problemas com lentes. Conecta diretamente com plantão médico.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Medical Compliance Team',
    tags: ['emergency', 'medical', 'compliance', 'critical'],
  },
  {
    name: 'Multi-Brand Lens Support',
    key: 'multi_brand_lenses',
    description:
      'Suporte a múltiplas marcas de lentes além da marca principal. Permite usuários escolherem entre diferentes fabricantes.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.DEVELOPMENT],
    owner: 'Product Team',
    tags: ['product', 'catalog', 'expansion'],
  },
  {
    name: 'Delivery Tracking',
    key: 'delivery_tracking',
    description:
      'Rastreamento em tempo real de entregas com integração aos Correios. Notificações automáticas sobre status da entrega.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Operations Team',
    tags: ['delivery', 'logistics', 'tracking'],
  },
  {
    name: 'LGPD Compliance Dashboard',
    key: 'lgpd_compliance',
    description:
      'Dashboard administrativo para gerenciar requisições LGPD (acesso, retificação, exclusão de dados). Inclui logs de auditoria.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 100,
    targetEnvironments: [FeatureFlagEnvironment.ALL],
    owner: 'Legal & Compliance',
    tags: ['lgpd', 'compliance', 'privacy', 'legal'],
  },
  {
    name: 'A/B Test Calculator',
    key: 'ab_test_calculator',
    description:
      'Teste A/B da calculadora de economia com diferentes layouts e mensagens para otimizar conversão.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.PRODUCTION],
    owner: 'Growth Team',
    tags: ['ab-test', 'optimization', 'conversion'],
  },
  {
    name: 'Beta Features Access',
    key: 'beta_features',
    description:
      'Acesso antecipado a features em beta para usuários selecionados. Permite testar novas funcionalidades antes do lançamento geral.',
    status: FeatureFlagStatus.ACTIVE,
    rolloutPercentage: 5,
    targetEnvironments: [FeatureFlagEnvironment.PRODUCTION],
    owner: 'Engineering Team',
    tags: ['beta', 'early-access', 'testing'],
  },
  {
    name: 'Dynamic Pricing',
    key: 'dynamic_pricing',
    description:
      'Preços dinâmicos baseados em demanda, sazonalidade e perfil do usuário. Otimiza receita enquanto mantém competitividade.',
    status: FeatureFlagStatus.INACTIVE,
    rolloutPercentage: 0,
    targetEnvironments: [FeatureFlagEnvironment.STAGING],
    owner: 'Pricing Team',
    tags: ['pricing', 'revenue', 'experimental'],
  },
];

async function main() {
  console.log('🌱 Seeding feature flags...');

  for (const flagData of ESSENTIAL_FLAGS) {
    const flag = await prisma.featureFlag.upsert({
      where: { key: flagData.key },
      create: {
        ...flagData,
        metadata: {
          seeded: true,
          seedDate: new Date().toISOString(),
        },
      },
      update: {
        description: flagData.description,
        tags: flagData.tags,
      },
    });

    console.log(`✅ ${flag.status === 'ACTIVE' ? '🟢' : '🔴'} ${flag.name} (${flag.key})`);
  }

  console.log(`\n✨ Seeded ${ESSENTIAL_FLAGS.length} feature flags successfully!`);

  // Summary statistics
  const totalFlags = await prisma.featureFlag.count();
  const activeFlags = await prisma.featureFlag.count({
    where: { status: FeatureFlagStatus.ACTIVE },
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total Flags: ${totalFlags}`);
  console.log(`   Active Flags: ${activeFlags}`);
  console.log(`   Inactive Flags: ${totalFlags - activeFlags}`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding feature flags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
