const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFirebaseUID() {
    const userEmail = process.argv[2] || 'drphilipe.saraiva.oftalmo@gmail.com';
    const firebaseUID = process.argv[3];

    if (!firebaseUID || firebaseUID === 'auto') {
        console.log('⚠️  INSTRUÇÕES:');
        console.log('');
        console.log('1. Faça login no frontend com o email:', userEmail);
        console.log('2. Abra o Console do navegador (F12)');
        console.log('3. Execute:');
        console.log('   firebase.auth().currentUser.uid');
        console.log('');
        console.log('4. Copie o UID e execute:');
        console.log('   node scripts/fix-firebase-uid.js "' + userEmail + '" "<UID_COPIADO>"');
        console.log('');
        console.log('Exemplo:');
        console.log('   node scripts/fix-firebase-uid.js "' + userEmail + '" "abc123xyz456"');
        console.log('');
        process.exit(0);
    }

    try {
        console.log('\n🔍 Buscando usuário...');
        console.log('Email:', userEmail);
        console.log('');

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            select: {
                id: true,
                email: true,
                name: true,
                firebaseUid: true,
                _count: {
                    select: { subscriptions: true }
                }
            }
        });

        if (!user) {
            console.log('❌ Usuário não encontrado com email:', userEmail);
            process.exit(1);
        }

        console.log('✅ Usuário encontrado!');
        console.log('   Nome:', user.name);
        console.log('   Firebase UID atual:', user.firebaseUid || 'NÃO CONFIGURADO');
        console.log('   Assinaturas:', user._count.subscriptions);
        console.log('');

        // Atualizar Firebase UID
        console.log('🔄 Atualizando Firebase UID para:', firebaseUID);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { firebaseUid: firebaseUID }
        });

        console.log('');
        console.log('✅ FIREBASE UID ATUALIZADO COM SUCESSO!');
        console.log('==========================================');
        console.log('Email:', updatedUser.email);
        console.log('Firebase UID:', updatedUser.firebaseUid);
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('1. Faça logout do frontend');
        console.log('2. Faça login novamente');
        console.log('3. Acesse /area-assinante/dashboard');
        console.log('');
        console.log('Agora o dashboard deve carregar corretamente! 🚀');
        console.log('');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixFirebaseUID();
