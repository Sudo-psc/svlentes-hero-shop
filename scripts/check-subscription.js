const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscription() {
    const userEmail = 'drphilipe.saraiva.oftalmo@gmail.com';

    try {
        console.log('🔍 Buscando detalhes completos da assinatura...');

        // Buscar usuário com assinatura completa
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
                subscriptions: {
                    include: {
                        benefits: true,
                        orders: true,
                        payments: {
                            orderBy: { paymentDate: 'desc' },
                            take: 5
                        },
                        invoices: {
                            orderBy: { dueDate: 'desc' },
                            take: 3
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        console.log('\n👤 DADOS DO USUÁRIO');
        console.log('==================');
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Telefone: ${user.phone}`);
        console.log(`WhatsApp: ${user.whatsapp}`);
        console.log(`Role: ${user.role}`);
        console.log(`Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`Último login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleDateString('pt-BR') : 'N/A'}`);

        if (user.subscriptions.length === 0) {
            console.log('\n❌ Nenhuma assinatura encontrada');
            return;
        }

        // Mostrar todas as assinaturas
        for (const subscription of user.subscriptions) {
            console.log('\n📦 DADOS DA ASSINATURA');
            console.log('====================');
            console.log(`ID: ${subscription.id}`);
            console.log(`Plano: ${subscription.planType}`);
            console.log(`Status: ${subscription.status}`);
            console.log(`Valor mensal: R$ ${subscription.monthlyValue}`);
            console.log(`Método pagamento: ${subscription.paymentMethod} (${subscription.paymentMethodLast4})`);
            console.log(`Data início: ${subscription.startDate.toLocaleDateString('pt-BR')}`);
            console.log(`Data renovação: ${subscription.renewalDate.toLocaleDateString('pt-BR')}`);
            console.log(`Próxima cobrança: ${subscription.nextBillingDate ? subscription.nextBillingDate.toLocaleDateString('pt-BR') : 'N/A'}`);
            console.log(`Tipo lente: ${subscription.lensType}`);
            console.log(`Ambos olhos: ${subscription.bothEyes ? 'Sim' : 'Não'}`);
            console.log(`Graus diferentes: ${subscription.differentGrades ? 'Sim' : 'Não'}`);

            if (subscription.shippingAddress) {
                console.log('\n🏠 ENDEREÇO DE ENTREGA');
                console.log('======================');
                const addr = subscription.shippingAddress;
                console.log(`${addr.street}, ${addr.number} ${addr.complement || ''}`);
                console.log(`${addr.neighborhood} - ${addr.city}/${addr.state}`);
                console.log(`CEP: ${addr.zipCode}`);
            }

            if (subscription.benefits.length > 0) {
                console.log('\n🎁 BENEFÍCIOS DA ASSINATURA');
                console.log('============================');
                subscription.benefits.forEach((benefit, index) => {
                    console.log(`${index + 1}. ${benefit.benefitIcon} ${benefit.benefitName}`);
                    console.log(`   ${benefit.benefitDescription}`);
                    console.log(`   Tipo: ${benefit.benefitType}`);
                    if (benefit.quantityTotal) {
                        console.log(`   Quantidade: ${benefit.quantityUsed}/${benefit.quantityTotal} utilizados`);
                    } else {
                        console.log(`   Quantidade: Ilimitado`);
                    }
                    console.log(`   Validade: ${benefit.expirationDate ? benefit.expirationDate.toLocaleDateString('pt-BR') : 'Indeterminado'}`);
                    console.log('');
                });
            }

            if (subscription.payments.length > 0) {
                console.log('💳 HISTÓRICO DE PAGAMENTOS');
                console.log('=========================');
                subscription.payments.forEach((payment, index) => {
                    console.log(`${index + 1}. R$ ${payment.amount} - ${payment.status}`);
                    console.log(`   Data: ${payment.paymentDate ? payment.paymentDate.toLocaleDateString('pt-BR') : 'Pendente'}`);
                    console.log(`   Vencimento: ${payment.dueDate.toLocaleDateString('pt-BR')}`);
                    if (payment.description) {
                        console.log(`   Descrição: ${payment.description}`);
                    }
                    console.log('');
                });
            }

            if (subscription.orders.length > 0) {
                console.log('📦 PEDIDOS');
                console.log('===========');
                subscription.orders.forEach((order, index) => {
                    console.log(`${index + 1}. Pedido ${order.id.substring(0, 8)}...`);
                    console.log(`   Data: ${order.orderDate.toLocaleDateString('pt-BR')}`);
                    console.log(`   Status: ${order.deliveryStatus}`);
                    console.log(`   Total: R$ ${order.totalAmount}`);
                    if (order.trackingCode) {
                        console.log(`   Rastreio: ${order.trackingCode}`);
                    }
                    console.log('');
                });
            }

            if (subscription.invoices.length > 0) {
                console.log('🧾 FATURAS');
                console.log('==========');
                subscription.invoices.forEach((invoice, index) => {
                    console.log(`${index + 1}. Fatura ${invoice.id.substring(0, 8)}...`);
                    console.log(`   Valor: R$ ${invoice.amount}`);
                    console.log(`   Status: ${invoice.status}`);
                    console.log(`   Vencimento: ${invoice.dueDate.toLocaleDateString('pt-BR')}`);
                    if (invoice.paidAt) {
                        console.log(`   Pago em: ${invoice.paidAt.toLocaleDateString('pt-BR')}`);
                    }
                    console.log('');
                });
            }
        }

        console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');

    } catch (error) {
        console.error('❌ Erro ao verificar assinatura:', error);
        console.error('Detalhes:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar o script
checkSubscription();
