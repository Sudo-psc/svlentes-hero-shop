/**
 * Script para atualizar o firebaseUid do usuário de teste
 * Este UID permite o login no painel do assinante
 * Uso: npx tsx scripts/update-user-firebase-uid.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserFirebaseUid() {
  try {
    console.log('🔧 Atualizando Firebase UID do usuário de teste...\n');

    const testEmail = 'drphilipe.saraiva.oftalmo@gmail.com';

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('👤 Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Firebase UID atual: ${user.firebaseUid || 'não configurado'}`);

    // Atualizar firebaseUid com um UID de teste
    // Em produção, este UID viria do Firebase Authentication
    const testFirebaseUid = 'test_uid_' + Date.now();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: testFirebaseUid,
        emailVerified: new Date() // Confirma email como verificado
      }
    });

    console.log('\n✅ Firebase UID atualizado com sucesso!');
    console.log(`   Novo Firebase UID: ${updatedUser.firebaseUid}`);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Para acessar o painel do assinante, você precisa:');
    console.log('   1. Fazer login no Firebase com este email');
    console.log('   2. O Firebase retornará um UID real');
    console.log('   3. Atualizar o usuário com este UID real');
    console.log('\n💡 Alternativa para testes:');
    console.log('   Modificar a API para aceitar autenticação por email');
    console.log('   ou criar um usuário Firebase com este email.');

  } catch (error) {
    console.error('\n❌ Erro ao atualizar Firebase UID:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateUserFirebaseUid()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
