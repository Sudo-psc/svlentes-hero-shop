const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// LGPD-compliant data redaction
// Read REDACT_SENSITIVE environment variable (default: true for privacy)
const REDACT_SENSITIVE = process.env.REDACT_SENSITIVE !== 'false';

// Helper function to mask phone numbers (show only last 2-4 digits)
function maskPhone(phone) {
    if (!REDACT_SENSITIVE || !phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '[REDACTED]';
    return `****-${digits.slice(-4)}`;
}

// Helper function to mask email (show only domain)
function maskEmail(email) {
    if (!REDACT_SENSITIVE || !email) return email;
    const [, domain] = email.split('@');
    return `****@${domain || '[REDACTED]'}`;
}

// Helper function to redact address (show only city/state)
function maskAddress(address) {
    if (!REDACT_SENSITIVE || !address) return address;
    return {
        street: '[REDACTED]',
        number: '[REDACTED]',
        complement: '[REDACTED]',
        neighborhood: '[REDACTED]',
        city: address.city || '[REDACTED]',
        state: address.state || '[REDACTED]',
        zipCode: '[REDACTED]'
    };
}

// Helper function to mask payment details
function maskPaymentLast4(last4) {
    if (!REDACT_SENSITIVE || !last4) return last4;
    return '****';
}

// Helper function to mask monetary amounts (show range or redact)
function maskAmount(amount) {
    if (!REDACT_SENSITIVE || !amount) return amount;
    return '[REDACTED]';
}

// Helper function to mask IDs (show only prefix)
function maskId(id) {
    if (!REDACT_SENSITIVE || !id || typeof id !== 'string') return id;
    return id.substring(0, 8) + '...[REDACTED]';
}

async function checkSubscription() {
    // Read email from CLI argument or environment variable
    const userEmail = process.argv[2] || process.env.CHECK_USER_EMAIL;

    // Validate required argument
    if (!userEmail) {
        console.error('❌ Error: Email is required');
        console.error('');
        console.error('Usage: node scripts/check-subscription.js <email>');
        console.error('');
        console.error('Example:');
        console.error('  node scripts/check-subscription.js "user@example.com"');
        console.error('');
        console.error('Or set environment variable:');
        console.error('  CHECK_USER_EMAIL="user@example.com" node scripts/check-subscription.js');
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
        console.log(`ID: ${maskId(user.id)}`);
        console.log(`Nome: ${REDACT_SENSITIVE ? '[REDACTED]' : user.name}`);
        console.log(`Email: ${maskEmail(user.email)}`);
        console.log(`Telefone: ${maskPhone(user.phone)}`);
        console.log(`WhatsApp: ${maskPhone(user.whatsapp)}`);
        console.log(`Role: ${user.role}`);
        console.log(`Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`Último login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleDateString('pt-BR') : 'N/A'}`);

        if (REDACT_SENSITIVE) {
            console.log('\n⚠️  Dados sensíveis redatados (LGPD compliance)');
            console.log('Para ver dados completos: REDACT_SENSITIVE=false node scripts/check-subscription.js <email>');
        }

        if (user.subscriptions.length === 0) {
            console.log('\n❌ Nenhuma assinatura encontrada');
            return;
        }

        // Mostrar todas as assinaturas
        for (const subscription of user.subscriptions) {
            console.log('\n📦 DADOS DA ASSINATURA');
            console.log('====================');
            console.log(`ID: ${maskId(subscription.id)}`);
            console.log(`Plano: ${subscription.planType}`);
            console.log(`Status: ${subscription.status}`);
            console.log(`Valor mensal: R$ ${maskAmount(subscription.monthlyValue)}`);
            console.log(`Método pagamento: ${subscription.paymentMethod} (${maskPaymentLast4(subscription.paymentMethodLast4)})`);
            console.log(`Data início: ${subscription.startDate.toLocaleDateString('pt-BR')}`);
            console.log(`Data renovação: ${subscription.renewalDate.toLocaleDateString('pt-BR')}`);
            console.log(`Próxima cobrança: ${subscription.nextBillingDate ? subscription.nextBillingDate.toLocaleDateString('pt-BR') : 'N/A'}`);
            console.log(`Tipo lente: ${subscription.lensType}`);
            console.log(`Ambos olhos: ${subscription.bothEyes ? 'Sim' : 'Não'}`);
            console.log(`Graus diferentes: ${subscription.differentGrades ? 'Sim' : 'Não'}`);

            if (subscription.shippingAddress) {
                console.log('\n🏠 ENDEREÇO DE ENTREGA');
                console.log('======================');
                const addr = REDACT_SENSITIVE ? maskAddress(subscription.shippingAddress) : subscription.shippingAddress;

                if (REDACT_SENSITIVE) {
                    console.log(`${addr.city}/${addr.state}`);
                    console.log(`Endereço completo: [REDACTED para privacidade LGPD]`);
                } else {
                    console.log(`${addr.street}, ${addr.number} ${addr.complement || ''}`);
                    console.log(`${addr.neighborhood} - ${addr.city}/${addr.state}`);
                    console.log(`CEP: ${addr.zipCode}`);
                }
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
                    console.log(`${index + 1}. R$ ${maskAmount(payment.amount)} - ${payment.status}`);
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
                    console.log(`${index + 1}. Pedido ${maskId(order.id)}`);
                    console.log(`   Data: ${order.orderDate.toLocaleDateString('pt-BR')}`);
                    console.log(`   Status: ${order.deliveryStatus}`);
                    console.log(`   Total: R$ ${maskAmount(order.totalAmount)}`);
                    if (order.trackingCode) {
                        console.log(`   Rastreio: ${REDACT_SENSITIVE ? '[REDACTED]' : order.trackingCode}`);
                    }
                    console.log('');
                });
            }

            if (subscription.invoices.length > 0) {
                console.log('🧾 FATURAS');
                console.log('==========');
                subscription.invoices.forEach((invoice, index) => {
                    console.log(`${index + 1}. Fatura ${maskId(invoice.id)}`);
                    console.log(`   Valor: R$ ${maskAmount(invoice.amount)}`);
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
