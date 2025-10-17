import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, ConsentType, ConsentStatus } from '@prisma/client';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';

const prisma = new PrismaClient();

// Schema de validação para logging de consentimento
const consentLogSchema = z.object({
    email: z.string().email('Email inválido'),
    consentType: z.enum(['TERMS', 'DATA_PROCESSING', 'MARKETING', 'MEDICAL_DATA']),
    status: z.enum(['GRANTED', 'REVOKED', 'EXPIRED']).optional().default('GRANTED'),
    userId: z.string().optional(),
    metadata: z.object({
        source: z.string().optional(),
        planId: z.string().optional(),
        version: z.string().optional()
    }).optional()
});

export async function POST(request: NextRequest) {
    // CSRF Protection
    const csrfResult = await csrfProtection(request);
    if (csrfResult) {
        return csrfResult;
    }

    // Rate limiting: 50 requisições em 15 minutos (logs de consent)
    const rateLimitResult = await rateLimit(request, rateLimitConfigs.write);
    if (rateLimitResult) {
        return rateLimitResult;
    }

    try {
        const body = await request.json();
        const validatedData = consentLogSchema.parse(body);

        // Capturar informações de auditoria
        const ipAddress = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Criar registro de consentimento no banco de dados
        const consentLog = await prisma.consentLog.create({
            data: {
                email: validatedData.email,
                consentType: validatedData.consentType as ConsentType,
                status: validatedData.status as ConsentStatus,
                userId: validatedData.userId,
                ipAddress: ipAddress.substring(0, 45), // Limitar tamanho
                userAgent,
                metadata: validatedData.metadata || {}
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Consentimento registrado com sucesso',
            logId: consentLog.id
        });

    } catch (error) {
        console.error('Erro ao registrar consentimento:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Dados de log inválidos',
                errors: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            message: 'Erro ao registrar consentimento'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request: NextRequest) {
    // Rate limiting: 200 requisições em 15 minutos (leitura de logs)
    const rateLimitResult = await rateLimit(request, rateLimitConfigs.read);
    if (rateLimitResult) {
        return rateLimitResult;
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const consentType = searchParams.get('consentType');

        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email é obrigatório para consultar logs'
            }, { status: 400 });
        }

        // Construir filtros de busca
        const where: any = { email };

        if (consentType) {
            where.consentType = consentType as ConsentType;
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }

        // Buscar logs de consentimento
        const logs = await prisma.consentLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 100 // Limitar a 100 registros mais recentes
        });

        return NextResponse.json({
            success: true,
            logs: logs.map(log => ({
                id: log.id,
                consentType: log.consentType,
                status: log.status,
                timestamp: log.timestamp,
                metadata: log.metadata,
                ipAddress: log.ipAddress.substring(0, 15) + '...' // Parcialmente ocultado por privacidade
            })),
            total: logs.length
        });

    } catch (error) {
        console.error('Erro ao buscar logs de consentimento:', error);

        return NextResponse.json({
            success: false,
            message: 'Erro ao buscar logs de consentimento'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}