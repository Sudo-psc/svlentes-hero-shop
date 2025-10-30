const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSubscription() {
    const userEmail = 'drphilipe.saraiva.oftalmo@gmail.com';
    const userName = 'Dr. Philipe Saraiva';

    try {
        console.log('🔍 Buscando usuário existente...');

        // Verificar se usuário já existe
        let user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { subscriptions: true }
        });

        if (!user) {
            console.log('👤 Criando novo usuário...');

            // Criar usuário
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: userName,
                    role: 'subscriber',
                    phone: '(11) 99999-9999', // Telefone padrão
                    whatsapp: '(11) 99999-9999',
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

        // Criar assinatura
        const subscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                planType: 'PREMIUM', // Plano padrão
                status: 'ACTIVE',
                monthlyValue: 149.90, // Valor padrão
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
                startDate: new Date(),
                paymentMethod: 'CREDIT_CARD',
                paymentMethodLast4: '1234',
                lensType: 'MONTHLY',
                bothEyes: true,
                differentGrades: false,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                shippingAddress: {
                    street: 'Rua Exemplo',
                    number: '123',
                    complement: 'Apto 45',
                    neighborhood: 'Bairro Exemplo',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01234-567'
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
