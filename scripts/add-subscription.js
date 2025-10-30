const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSubscription() {
    // Read email and name from CLI arguments
    const userEmail = process.argv[2];
    const userName = process.argv[3] || 'Default User';

    // Validate required arguments
    if (!userEmail) {
        console.error('❌ Error: Email is required');
        console.error('');
        console.error('Usage: node scripts/add-subscription.js <email> [name]');
        console.error('');
        console.error('Examples:');
        console.error('  node scripts/add-subscription.js "user@example.com" "John Doe"');
        console.error('  node scripts/add-subscription.js "user@example.com"');
        console.error('');
        process.exit(1);
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        console.error('❌ Error: Invalid email format');
        console.error(`Provided: "${userEmail}"`);
        console.error('');
        console.error('Please provide a valid email address.');
        process.exit(1);
    }

    try {
        console.log('🔍 Buscando usuário existente...');

        // Verificar se usuário já existe
        let user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { subscriptions: true }
        });

        if (!user) {
            console.log('👤 Criando novo usuário...');

            // Load default phone from environment
            const DEFAULT_PHONE = process.env.DEFAULT_PHONE || '(00) 00000-0000';

            // Criar usuário
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: userName,
                    role: 'subscriber',
                    phone: DEFAULT_PHONE,
                    whatsapp: DEFAULT_PHONE,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            console.log('✅ Usuário criado:', user.id);
        } else {
            console.log('👤 Usuário encontrado:', user.id);

            // Verificar se já tem assinatura ativa
            const activeSubscription = user.subscriptions.find(sub => sub.status === 'ACTIVE');
            if (activeSubscription) {
                console.log('⚠️  Usuário já possui assinatura ativa:', activeSubscription.id);
                console.log('📋 Detalhes da assinatura:');
                console.log(`   - Plano: ${activeSubscription.planType}`);
                console.log(`   - Valor: R$ ${activeSubscription.monthlyValue}`);
                console.log(`   - Status: ${activeSubscription.status}`);
                console.log(`   - Início: ${activeSubscription.startDate}`);
                console.log(`   - Renovação: ${activeSubscription.renewalDate}`);
                return;
            }
        }

        console.log('📦 Criando assinatura...');

        // Load configuration from environment variables
        const DEFAULT_PLAN_TYPE = process.env.DEFAULT_PLAN_TYPE || 'PREMIUM';
        const DEFAULT_MONTHLY_VALUE = parseFloat(process.env.DEFAULT_MONTHLY_VALUE || '149.90');
        const PAYMENT_LAST4 = process.env.PAYMENT_LAST4 || '0000';
        const DEFAULT_STREET = process.env.DEFAULT_STREET || 'Rua Exemplo';
        const DEFAULT_NUMBER = process.env.DEFAULT_NUMBER || '000';
        const DEFAULT_NEIGHBORHOOD = process.env.DEFAULT_NEIGHBORHOOD || 'Centro';
        const DEFAULT_CITY = process.env.DEFAULT_CITY || 'São Paulo';
        const DEFAULT_STATE = process.env.DEFAULT_STATE || 'SP';
        const DEFAULT_ZIPCODE = process.env.DEFAULT_ZIPCODE || '00000-000';

        // Validate environment in production
        if (process.env.NODE_ENV === 'production') {
            const requiredEnvVars = [
                'DEFAULT_PLAN_TYPE',
                'DEFAULT_MONTHLY_VALUE',
                'PAYMENT_LAST4'
            ];

            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

            if (missingVars.length > 0) {
                console.error('❌ Error: Missing required environment variables in production:');
                missingVars.forEach(varName => console.error(`   - ${varName}`));
                console.error('');
                console.error('Please set these environment variables before running this script in production.');
                process.exit(1);
            }
        }

        // Prevent running in production without explicit force flag
        if (process.env.NODE_ENV === 'production' && !process.env.FORCE_PRODUCTION_SCRIPT) {
            console.error('❌ Error: This script is disabled in production for safety.');
            console.error('');
            console.error('To run in production, set FORCE_PRODUCTION_SCRIPT=true');
            console.error('Example: FORCE_PRODUCTION_SCRIPT=true node scripts/add-subscription.js "email@example.com" "Name"');
            console.error('');
            console.error('⚠️  WARNING: Only use this for legitimate user account creation.');
            console.error('⚠️  Never use real payment details or production customer data.');
            process.exit(1);
        }

        // Validate ZIP code format (Brazilian CEP: 00000-000)
        const zipRegex = /^\d{5}-\d{3}$/;
        if (!zipRegex.test(DEFAULT_ZIPCODE)) {
            console.error(`❌ Error: Invalid ZIP code format: "${DEFAULT_ZIPCODE}"`);
            console.error('Expected format: 00000-000 (Brazilian CEP)');
            process.exit(1);
        }

        // Criar assinatura
        const subscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                planType: DEFAULT_PLAN_TYPE,
                status: 'ACTIVE',
                monthlyValue: DEFAULT_MONTHLY_VALUE,
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
                startDate: new Date(),
                paymentMethod: 'CREDIT_CARD',
                paymentMethodLast4: PAYMENT_LAST4,
                lensType: 'MONTHLY',
                bothEyes: true,
                differentGrades: false,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                shippingAddress: {
                    street: DEFAULT_STREET,
                    number: DEFAULT_NUMBER,
                    complement: '',
                    neighborhood: DEFAULT_NEIGHBORHOOD,
                    city: DEFAULT_CITY,
                    state: DEFAULT_STATE,
                    zipCode: DEFAULT_ZIPCODE
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log('✅ Assinatura criada:', subscription.id);

        // Criar benefícios padrão
        console.log('🎁 Adicionando benefícios...');

        const benefits = [
            {
                subscriptionId: subscription.id,
                benefitName: 'Lentes Mensais',
                benefitDescription: 'Par de lentes de contato mensais',
                benefitIcon: '👁️',
                benefitType: 'UNLIMITED',
                quantityTotal: 12,
                quantityUsed: 0,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
            },
            {
                subscriptionId: subscription.id,
                benefitName: 'Consulta Oftalmológica',
                benefitDescription: 'Consulta gratuita por semestre',
                benefitIcon: '👨‍⚕️',
                benefitType: 'LIMITED',
                quantityTotal: 2,
                quantityUsed: 0,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
            },
            {
                subscriptionId: subscription.id,
                benefitName: 'Frete Grátis',
                benefitDescription: 'Frete gratuito em todos os pedidos',
                benefitIcon: '📦',
                benefitType: 'UNLIMITED',
                quantityTotal: null,
                quantityUsed: 0,
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
            }
        ];

        for (const benefit of benefits) {
            await prisma.subscriptionBenefit.create({
                data: {
                    ...benefit,
                    createdAt: new Date()
                }
            });
        }

        console.log('✅ Benefícios criados com sucesso!');

        // Criar histórico da assinatura
        console.log('📝 Criando histórico...');

        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                userId: user.id,
                changeType: 'SUBSCRIPTION_CREATED',
                description: 'Assinatura criada manualmente via script',
                newValue: {
                    planType: subscription.planType,
                    status: subscription.status,
                    monthlyValue: Number(subscription.monthlyValue)
                },
                createdAt: new Date()
            }
        });

        console.log('✅ Histórico criado com sucesso!');

        // Resumo final
        console.log('\n🎉 ASSINATURA CRIADA COM SUCESSO!');
        console.log('=====================================');
        console.log(`👤 Usuário: ${user.name} (${user.email})`);
        console.log(`📦 Assinatura ID: ${subscription.id}`);
        console.log(`💳 Plano: ${subscription.planType}`);
        console.log(`💰 Valor: R$ ${subscription.monthlyValue}`);
        console.log(`📅 Início: ${subscription.startDate.toLocaleDateString('pt-BR')}`);
        console.log(`🔄 Renovação: ${subscription.renewalDate.toLocaleDateString('pt-BR')}`);
        console.log(`💳 Pagamento: ${subscription.paymentMethod} ending in ${subscription.paymentMethodLast4}`);
        console.log(`🎁 Benefícios: ${benefits.length} criados`);
        console.log('=====================================');

    } catch (error) {
        console.error('❌ Erro ao criar assinatura:', error);
        console.error('Detalhes:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar o script
addSubscription();
