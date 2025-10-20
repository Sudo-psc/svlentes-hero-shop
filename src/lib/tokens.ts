import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
/**
 * Gera um token criptograficamente seguro
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
/**
 * Cria token de verificação de email
 * Expira em 24 horas
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateSecureToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
  // Deletar tokens antigos do mesmo email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })
  // Criar novo token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })
  return token
}
/**
 * Cria token de recuperação de senha
 * Expira em 1 hora
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateSecureToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
  // Deletar tokens antigos do mesmo email
  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  })
  // Criar novo token com prefixo 'reset:' no identifier
  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token,
      expires,
    },
  })
  return token
}
/**
 * Valida e consome token de verificação de email
 * Retorna o email se válido, null se inválido/expirado
 */
export async function validateVerificationToken(
  token: string
): Promise<string | null> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })
  if (!verificationToken) {
    return null
  }
  // Verificar se o token expirou
  if (verificationToken.expires < new Date()) {
    // Deletar token expirado
    await prisma.verificationToken.delete({
      where: { token },
    })
    return null
  }
  // Token válido - deletar para evitar reuso
  await prisma.verificationToken.delete({
    where: { token },
  })
  return verificationToken.identifier
}
/**
 * Valida token de recuperação de senha
 * Retorna o email se válido, null se inválido/expirado
 */
export async function validatePasswordResetToken(
  token: string
): Promise<string | null> {
  const resetToken = await prisma.verificationToken.findUnique({
    where: { token },
  })
  if (!resetToken) {
    return null
  }
  // Verificar se o token expirou
  if (resetToken.expires < new Date()) {
    // Deletar token expirado
    await prisma.verificationToken.delete({
      where: { token },
    })
    return null
  }
  // Extrair email do identifier (remover prefixo 'reset:')
  const email = resetToken.identifier.replace('reset:', '')
  return email
}
/**
 * Consome (deleta) token de recuperação de senha
 */
export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({
    where: { token },
  })
}