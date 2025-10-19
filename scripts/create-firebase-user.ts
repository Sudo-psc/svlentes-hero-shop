/**
 * Script para criar usuário no Firebase Authentication
 * Uso: npx tsx scripts/create-firebase-user.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function createFirebaseUser() {
  try {
    console.log('🔥 Criando usuário no Firebase Authentication...\n');

    const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com';
    const testPassword = 'Teste123!'; // Senha de teste
    const testName = 'Dr. Philipe Saraiva Cruz';

    // 1. Inicializar Firebase Admin
    console.log('🔧 1. Inicializando Firebase Admin...');
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY não encontrado no .env.local');
      console.log('\n💡 Verifique se a variável está configurada corretamente:');
      console.log('   FIREBASE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      console.log('✅ Firebase Admin inicializado');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
      return;
    }

    // 2. Verificar se usuário já existe no Firebase
    console.log('\n👤 2. Verificando se usuário já existe no Firebase...');
    let firebaseUser;

    try {
      firebaseUser = await admin.auth().getUserByEmail(testEmail);
      console.log('✅ Usuário já existe no Firebase:');
      console.log(`   UID: ${firebaseUser.uid}`);
      console.log(`   Email: ${firebaseUser.email}`);
      console.log(`   Email verificado: ${firebaseUser.emailVerified ? 'Sim' : 'Não'}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('ℹ️  Usuário não encontrado. Criando novo usuário...');

        // Criar novo usuário
        try {
          firebaseUser = await admin.auth().createUser({
            email: testEmail,
            emailVerified: true,
            password: testPassword,
            displayName: testName,
          });

          console.log('✅ Usuário criado com sucesso no Firebase!');
          console.log(`   UID: ${firebaseUser.uid}`);
          console.log(`   Email: ${firebaseUser.email}`);
          console.log(`   Senha: ${testPassword}`);
        } catch (createError: any) {
          console.error('❌ Erro ao criar usuário no Firebase:', createError.message);
          return;
        }
      } else {
        console.error('❌ Erro ao verificar usuário:', error.message);
        return;
      }
    }

    // 3. Atualizar usuário no banco de dados com Firebase UID
    console.log('\n💾 3. Atualizando usuário no banco de dados...');

    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!dbUser) {
      console.error('❌ Usuário não encontrado no banco de dados');
      console.log('Execute primeiro: npx tsx scripts/create-test-subscription.ts');
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        firebaseUid: firebaseUser.uid,
        emailVerified: new Date()
      }
    });

    console.log('✅ Usuário atualizado no banco de dados:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Firebase UID: ${updatedUser.firebaseUid}`);

    // 4. Resumo e instruções
    console.log('\n' + '='.repeat(70));
    console.log('✨ USUÁRIO CRIADO COM SUCESSO!');
    console.log('='.repeat(70));
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
    console.log(`   Firebase UID: ${firebaseUser.uid}`);

    console.log('\n🔗 Como testar o painel:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse: http://localhost:3000/area-assinante/login');
    console.log(`   3. Faça login com o email: ${testEmail}`);
    console.log(`   4. Use a senha: ${testPassword}`);
    console.log('   5. Você será redirecionado para o dashboard');
    console.log('   6. Verifique os dados da assinatura');

    console.log('\n📊 Dados disponíveis no painel:');
    console.log('   - Informações da assinatura');
    console.log('   - Status do plano (ACTIVE)');
    console.log('   - Benefícios (3 itens)');
    console.log('   - Histórico de pedidos (1 pedido)');
    console.log('   - Histórico de pagamentos (1 pagamento)');
    console.log('   - Endereço de entrega');
    console.log('   - Forma de pagamento');

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário Firebase:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

createFirebaseUser()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
