import { NextRequest, NextResponse } from 'next/server'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { adminAuth, isFirebaseAdminInitialized } from '@/lib/firebase-admin'
import { validateToken } from '@/lib/token-cache'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

type ProfileSyncStatus = 'synced' | 'skipped' | 'failed'

interface ProfileSyncResult {
  record: any | null
  status: ProfileSyncStatus
  error?: Error
}

async function syncUserProfile(decodedToken: DecodedIdToken): Promise<ProfileSyncResult> {
  if (!process.env.DATABASE_URL) {
    return { record: null, status: 'skipped' }
  }

  const { uid, email, name, picture, email_verified: emailVerified, auth_time: authTime } = decodedToken
  const lastLoginAt = new Date()
  const verifiedAt = emailVerified
    ? new Date((authTime ?? Math.floor(Date.now() / 1000)) * 1000)
    : undefined

  try {
    const existingByUid = await prisma.user.findUnique({ where: { firebaseUid: uid } })

    if (existingByUid) {
      const updateData: Record<string, any> = {
        lastLoginAt,
      }

      if (email) updateData.email = email
      if (name) updateData.name = name
      if (picture) {
        updateData.avatarUrl = picture
        updateData.image = picture
      }
      if (verifiedAt) updateData.emailVerified = verifiedAt

      const updated = await prisma.user.update({
        where: { id: existingByUid.id },
        data: updateData,
      })

      return { record: updated, status: 'synced' }
    }

    if (email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } })

      if (existingByEmail) {
        const updateData: Record<string, any> = {
          firebaseUid: uid,
          lastLoginAt,
        }

        if (name) updateData.name = name
        if (picture) {
          updateData.avatarUrl = picture
          updateData.image = picture
        }
        if (verifiedAt) updateData.emailVerified = verifiedAt

        const updated = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: updateData,
        })

        return { record: updated, status: 'synced' }
      }

      const created = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          name: name ?? email,
          avatarUrl: picture ?? null,
          image: picture ?? null,
          lastLoginAt,
          ...(verifiedAt ? { emailVerified: verifiedAt } : {}),
        },
      })

      return { record: created, status: 'synced' }
    }

    return { record: null, status: 'skipped' }
  } catch (error) {
    return { record: null, status: 'failed', error: error as Error }
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminInitialized || !adminAuth) {
    return NextResponse.json(
      {
        error: 'FIREBASE_ADMIN_UNAVAILABLE',
        message: 'Serviço de autenticação indisponível no momento.',
      },
      { status: 503, headers: corsHeaders }
    )
  }

  try {
    let payload: any

    try {
      const rawBody = await request.text()

      if (!rawBody.trim()) {
        return NextResponse.json(
          { error: 'EMPTY_BODY', message: 'Corpo da requisição vazio.' },
          { status: 400, headers: corsHeaders }
        )
      }

      payload = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[AUTH] Invalid JSON payload for verify-firebase-token', parseError)
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Formato JSON inválido.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { token } = payload ?? {}

    if (typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Token Firebase inválido.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const validation = await validateToken(token)

    if (!validation.valid || !validation.decodedToken) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Token inválido ou expirado.',
          details: validation.error ? { reason: validation.error } : undefined,
        },
        { status: 401, headers: corsHeaders }
      )
    }

    const decodedToken = validation.decodedToken

    const profileSync = await syncUserProfile(decodedToken)

    if (profileSync.status === 'failed' && profileSync.error) {
      console.error('[AUTH] Failed to synchronize user profile', {
        uid: decodedToken.uid,
        error: profileSync.error.message,
      })
    }

    const userRecord = profileSync.record
    const responsePayload: Record<string, any> = {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: userRecord?.email ?? decodedToken.email ?? null,
        name: userRecord?.name ?? decodedToken.name ?? null,
        picture: userRecord?.avatarUrl ?? decodedToken.picture ?? null,
        role: userRecord?.role ?? null,
        emailVerified: Boolean(
          userRecord?.emailVerified || decodedToken.email_verified || false
        ),
        lastLoginAt: userRecord?.lastLoginAt
          ? new Date(userRecord.lastLoginAt).toISOString()
          : null,
        claims: {
          issuer: decodedToken.iss,
          subject: decodedToken.sub,
          issuedAt: decodedToken.iat,
          expiresAt: decodedToken.exp,
          authTime: decodedToken.auth_time,
        },
      },
      profileSync: profileSync.status,
      tokenMetadata: {
        audience: decodedToken.aud,
        firebaseSignInProvider: decodedToken.firebase?.sign_in_provider ?? null,
      },
    }

    if (profileSync.status === 'failed') {
      responsePayload.warnings = ['USER_PROFILE_SYNC_FAILED']
    }

    return NextResponse.json(responsePayload, { headers: corsHeaders })
  } catch (error) {
    console.error('[AUTH] Error verifying Firebase token', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Não foi possível validar o token. Tente novamente em instantes.',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
