import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, DataRequestType, DataRequestStatus } from '@prisma/client';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';
const prisma = new PrismaClient();
// Schema de validação para solicitações de dados
const dataRequestSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    requestType: z.enum(['ACCESS', 'RECTIFICATION', 'DELETION', 'PORTABILITY', 'OPPOSITION']),
    reason: z.string().optional(),
    cpfCnpj: z.string().optional()
});
export async function POST(request: NextRequest) {
    // CSRF Protection
    const csrfResult = await csrfProtection(request);
    if (csrfResult) {
        return csrfResult;
    }
    // Rate limiting: 10 requisições em 1 hora (solicitações sensíveis de dados)
    const rateLimitResult = await rateLimit(request, {
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 10, // 10 requisições por hora
        message: 'Muitas solicitações de dados. Tente novamente mais tarde.'
    });
    if (rateLimitResult) {
        return rateLimitResult;
    }
    try {
        const body = await request.json();
        const validatedData = dataRequestSchema.parse(body);
        // Capturar informações de auditoria
        const ipAddress = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        // Criar solicitação de dados no banco de dados
        const dataRequest = await prisma.dataRequest.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                requestType: validatedData.requestType as DataRequestType,
                reason: validatedData.reason,
                ipAddress: ipAddress.substring(0, 45),
                userAgent,
                metadata: {
                    cpfCnpj: validatedData.cpfCnpj
                }
            }
        });
        // Mensagens baseadas no tipo de solicitação
        const requestTypeMessages = {
            ACCESS: {
                message: 'Solicitação de acesso aos dados recebida. Você receberá um relatório completo dos seus dados em até 15 dias úteis.',
                estimatedTime: '15 dias úteis'
            },
            DELETION: {
                message: 'Solicitação de exclusão de dados recebida. Seus dados serão removidos em até 30 dias úteis, exceto aqueles que devemos manter por obrigação legal.',
                estimatedTime: '30 dias úteis'
            },
            PORTABILITY: {
                message: 'Solicitação de portabilidade de dados recebida. Você receberá seus dados em formato estruturado em até 15 dias úteis.',
                estimatedTime: '15 dias úteis'
            },
            RECTIFICATION: {
                message: 'Solicitação de retificação de dados recebida. Entraremos em contato para confirmar as alterações necessárias.',
                estimatedTime: '10 dias úteis'
            },
            OPPOSITION: {
                message: 'Solicitação de oposição ao tratamento de dados recebida. Analisaremos sua solicitação em até 10 dias úteis.',
                estimatedTime: '10 dias úteis'
            }
        };
        const { message, estimatedTime } = requestTypeMessages[validatedData.requestType];
        return NextResponse.json({
            success: true,
            message,
            requestId: dataRequest.id,
            estimatedTime,
            nextSteps: [
                'Você receberá um email de confirmação em breve',
                'Nossa equipe analisará sua solicitação',
                'Entraremos em contato se precisarmos de informações adicionais',
                `Sua solicitação será processada em até ${estimatedTime}`
            ]
        });
    } catch (error) {
        console.error('Erro ao processar solicitação de dados:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Dados inválidos',
                errors: error.errors
            }, { status: 400 });
        }
        return NextResponse.json({
            success: false,
            message: 'Erro interno do servidor'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestId = searchParams.get('requestId');
        const email = searchParams.get('email');
        // Buscar por ID ou email
        if (!requestId && !email) {
            return NextResponse.json({
                success: false,
                message: 'ID da solicitação ou email é obrigatório'
            }, { status: 400 });
        }
        let dataRequests;
        if (requestId) {
            // Buscar solicitação específica por ID
            const dataRequest = await prisma.dataRequest.findUnique({
                where: { id: requestId }
            });
            if (!dataRequest) {
                return NextResponse.json({
                    success: false,
                    message: 'Solicitação não encontrada'
                }, { status: 404 });
            }
            return NextResponse.json({
                success: true,
                request: {
                    id: dataRequest.id,
                    email: dataRequest.email,
                    name: dataRequest.name,
                    requestType: dataRequest.requestType,
                    status: dataRequest.status,
                    requestedAt: dataRequest.requestedAt,
                    completedAt: dataRequest.completedAt,
                    reason: dataRequest.reason
                }
            });
        }
        if (email) {
            // Buscar todas as solicitações do email
            dataRequests = await prisma.dataRequest.findMany({
                where: { email },
                orderBy: { requestedAt: 'desc' },
                take: 50
            });
            return NextResponse.json({
                success: true,
                requests: dataRequests.map(req => ({
                    id: req.id,
                    requestType: req.requestType,
                    status: req.status,
                    requestedAt: req.requestedAt,
                    completedAt: req.completedAt
                })),
                total: dataRequests.length
            });
        }
    } catch (error) {
        console.error('Erro ao buscar solicitação de dados:', error);
        return NextResponse.json({
            success: false,
            message: 'Erro ao buscar solicitação'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}