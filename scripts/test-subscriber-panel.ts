/**
 * Script para testar o painel do assinante
 * Uso: npx tsx scripts/test-subscriber-panel.ts
 */

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';

const prisma = new PrismaClient();

async function testSubscriberPanel() {
  try {
    console.log('🧪 Testando acesso ao painel do assinante\n');

    const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com';

    // 1. Verificar usuário no banco
    console.log('📊 1. Verificando usuário no banco de dados...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: {
            benefits: true,
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado no banco de dados');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Firebase UID: ${user.firebaseUid || 'NÃO CONFIGURADO'}`);

    // 2. Verificar assinatura
    console.log('\n📋 2. Verificando assinatura...');
    if (user.subscriptions.length === 0) {
      console.log('❌ Usuário não possui assinatura ativa');
      return;
    }

    const subscription = user.subscriptions[0];
    console.log('✅ Assinatura ativa encontrada:');
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Plano: ${subscription.planType}`);
    console.log(`   Valor: R$ ${subscription.monthlyValue}`);
    console.log(`   Benefícios: ${subscription.benefits.length}`);
    console.log(`   Pedidos: ${subscription.orders.length}`);
    console.log(`   Pagamentos: ${subscription.payments.length}`);

    // 3. Verificar Firebase Authentication
    console.log('\n🔐 3. Verificando configuração do Firebase...');

    let firebaseConfigured = false;
    try {
      // Tentar inicializar Firebase Admin
      if (!admin.apps.length) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountKey) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          firebaseConfigured = true;
          console.log('✅ Firebase Admin configurado');
        } else {
          console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY não encontrado no .env.local');
        }
      } else {
        firebaseConfigured = true;
        console.log('✅ Firebase Admin já inicializado');
      }

      // Se configurado, verificar se usuário existe no Firebase
      if (firebaseConfigured) {
        console.log('\n👤 4. Verificando usuário no Firebase Authentication...');
        try {
          const firebaseUser = await admin.auth().getUserByEmail(testEmail);
          console.log('✅ Usuário encontrado no Firebase:');
          console.log(`   UID: ${firebaseUser.uid}`);
          console.log(`   Email verificado: ${firebaseUser.emailVerified ? 'Sim' : 'Não'}`);

          // Verificar se o UID no banco corresponde ao UID do Firebase
          if (user.firebaseUid !== firebaseUser.uid) {
            console.log('\n⚠️  ATENÇÃO: UID do Firebase diferente do UID no banco!');
            console.log(`   Banco: ${user.firebaseUid}`);
            console.log(`   Firebase: ${firebaseUser.uid}`);
            console.log('\n🔧 Atualizando UID no banco...');

            await prisma.user.update({
              where: { id: user.id },
              data: { firebaseUid: firebaseUser.uid }
            });

            console.log('✅ UID atualizado com sucesso!');
          } else {
            console.log('✅ UID no banco corresponde ao Firebase');
          }
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log('❌ Usuário NÃO encontrado no Firebase Authentication');
            console.log('\n📝 COMO CRIAR O USUÁRIO NO FIREBASE:');
            console.log('   Opção 1 - Via Firebase Console:');
            console.log('   1. Acesse https://console.firebase.google.com');
            console.log('   2. Selecione o projeto "svlentes"');
            console.log('   3. Vá em Authentication > Users');
            console.log('   4. Clique em "Add user"');
            console.log(`   5. Email: ${testEmail}`);
            console.log('   6. Senha: [escolha uma senha]');
            console.log('   7. Copie o UID gerado');
            console.log('   8. Execute o script update-user-firebase-uid.ts com o UID real');
            console.log('\n   Opção 2 - Via API:');
            console.log('   Execute: npx tsx scripts/create-firebase-user.ts');
          } else {
            console.error('❌ Erro ao verificar usuário no Firebase:', error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao configurar Firebase:', error.message);
    }

    // 4. Testar resposta da API
    console.log('\n🌐 5. Estrutura de resposta esperada da API:');
    const mockApiResponse = {
      subscription: {
        id: subscription.id,
        status: subscription.status.toLowerCase(),
        plan: {
          name: subscription.planType,
          price: Number(subscription.monthlyValue),
          billingCycle: 'monthly'
        },
        currentPeriodStart: subscription.startDate.toISOString(),
        currentPeriodEnd: subscription.renewalDate.toISOString(),
        nextBillingDate: subscription.renewalDate.toISOString(),
        benefits: subscription.benefits.map(b => ({
          id: b.id,
          name: b.benefitName,
          description: b.benefitDescription,
          icon: b.benefitIcon,
          type: b.benefitType,
          quantityTotal: b.quantityTotal,
          quantityUsed: b.quantityUsed
        })),
        shippingAddress: subscription.shippingAddress,
        paymentMethod: subscription.paymentMethod,
        paymentMethodLast4: subscription.paymentMethodLast4
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || user.image
      }
    };

    console.log(JSON.stringify(mockApiResponse, null, 2));

    // 5. Instruções finais
    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMO DO TESTE');
    console.log('='.repeat(70));
    console.log('\n✅ Dados no banco: OK');
    console.log(`${firebaseConfigured ? '✅' : '❌'} Firebase configurado: ${firebaseConfigured ? 'OK' : 'FALHA'}`);

    if (firebaseConfigured) {
      console.log('\n🔗 COMO TESTAR O PAINEL:');
      console.log('   1. Certifique-se de que o usuário existe no Firebase (ver acima)');
      console.log('   2. Inicie o servidor: npm run dev');
      console.log('   3. Acesse: http://localhost:3000/area-assinante/login');
      console.log(`   4. Faça login com: ${testEmail}`);
      console.log('   5. Você será redirecionado para /area-assinante/dashboard');
      console.log('   6. Verifique se os dados da assinatura são exibidos corretamente');
    } else {
      console.log('\n⚠️  FIREBASE NÃO CONFIGURADO');
      console.log('   Configure FIREBASE_SERVICE_ACCOUNT_KEY no .env.local');
      console.log('   Ou use o Firebase emulator para testes locais');
    }

    console.log('\n📝 URLs importantes:');
    console.log(`   Login: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/area-assinante/login`);
    console.log(`   Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/area-assinante/dashboard`);
    console.log(`   API: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/assinante/subscription`);

  } catch (error) {
    console.error('\n❌ Erro ao testar painel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

testSubscriberPanel()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
