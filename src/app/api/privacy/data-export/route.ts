import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { decryptPrescription } from '@/lib/encryption';

const prisma = new PrismaClient();

// Schema de validação para exportação de dados
const dataExportSchema = z.object({
    email: z.string().email('Email inválido'),
    includePersonalData: z.boolean().optional().default(true),
    includeSubscriptions: z.boolean().optional().default(true),
    includeOrders: z.boolean().optional().default(true),
    includeConsents: z.boolean().optional().default(true),
    includeMedicalData: z.boolean().optional().default(true)
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = dataExportSchema.parse(body);

        // Buscar usuário pelo email
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            include: {
                subscriptions: validatedData.includeSubscriptions ? {
                    include: {
                        benefits: true,
                        orders: true,
                        invoices: true
                    }
                } : false,
                consentLogs: validatedData.includeConsents
            }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Usuário não encontrado'
            }, { status: 404 });
        }

        // Construir objeto de exportação conforme LGPD
        const exportData: any = {
            exportedAt: new Date().toISOString(),
            email: user.email
        };

        // Dados pessoais
        if (validatedData.includePersonalData) {
            exportData.personalData = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                whatsapp: user.whatsapp,
                avatarUrl: user.avatarUrl,
                role: user.role,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                preferences: user.preferences
            };
        }

        // Assinaturas
        if (validatedData.includeSubscriptions && user.subscriptions) {
            exportData.subscriptions = user.subscriptions.map(sub => ({
                id: sub.id,
                planType: sub.planType,
                status: sub.status,
                monthlyValue: sub.monthlyValue.toString(),
                startDate: sub.startDate,
                renewalDate: sub.renewalDate,
                paymentMethod: sub.paymentMethod,
                shippingAddress: sub.shippingAddress,
                lensType: sub.lensType,
                benefits: sub.benefits?.map(benefit => ({
                    name: benefit.benefitName,
                    description: benefit.benefitDescription,
                    type: benefit.benefitType,
                    quantityTotal: benefit.quantityTotal,
                    quantityUsed: benefit.quantityUsed,
                    expirationDate: benefit.expirationDate
                }))
            }));
        }

        // Pedidos
        if (validatedData.includeOrders && user.subscriptions) {
            const allOrders = user.subscriptions.flatMap(sub => sub.orders || []);
            exportData.orders = allOrders.map(order => ({
                id: order.id,
                orderDate: order.orderDate,
                deliveryStatus: order.deliveryStatus,
                trackingCode: order.trackingCode,
                deliveryAddress: order.deliveryAddress,
                products: order.products,
                totalAmount: order.totalAmount.toString(),
                paymentStatus: order.paymentStatus,
                estimatedDelivery: order.estimatedDelivery,
                deliveredAt: order.deliveredAt
            }));
        }

        // Logs de consentimento
        if (validatedData.includeConsents && user.consentLogs) {
            exportData.consents = user.consentLogs.map(consent => ({
                id: consent.id,
                consentType: consent.consentType,
                status: consent.status,
                timestamp: consent.timestamp,
                expiresAt: consent.expiresAt,
                metadata: consent.metadata
            }));
        }

        // Dados médicos (prescrições) - armazenados em metadata criptografados
        if (validatedData.includeMedicalData && user.subscriptions) {
            const medicalData: any[] = [];

            user.subscriptions.forEach(sub => {
                if (sub.metadata && typeof sub.metadata === 'object') {
                    const metadata = sub.metadata as any;
                    if (metadata.lensData) {
                        try {
                            let lensData;

                            // Tentar descriptografar primeiro (dados novos)
                            if (typeof metadata.lensData === 'string') {
                                try {
                                    // Verificar se parece ser dados criptografados (começa com "U2FsdGVk")
                                    if (metadata.lensData.startsWith('U2FsdGVk')) {
                                        lensData = decryptPrescription(metadata.lensData);
                                    } else {
                                        // Fallback: dados não criptografados (legado)
                                        lensData = JSON.parse(metadata.lensData);
                                    }
                                } catch (decryptError) {
                                    // Se falhar descriptografia, tentar JSON parse direto (legado)
                                    try {
                                        lensData = JSON.parse(metadata.lensData);
                                    } catch (parseError) {
                                        console.error('Erro ao processar dados de lente:', decryptError);
                                        return; // Pular este registro
                                    }
                                }
                            } else {
                                // Dados já em objeto (não criptografados - legado)
                                lensData = metadata.lensData;
                            }

                            medicalData.push({
                                subscriptionId: sub.id,
                                lensType: lensData.type,
                                rightEye: lensData.rightEye,
                                leftEye: lensData.leftEye,
                                prescriptionDate: lensData.prescriptionDate,
                                doctorCRM: lensData.doctorCRM,
                                doctorName: lensData.doctorName
                            });
                        } catch (e) {
                            console.error('Erro ao processar dados médicos:', e);
                        }
                    }
                }
            });

            if (medicalData.length > 0) {
                exportData.medicalData = {
                    prescriptions: medicalData
                };
            }
        }

        // Registrar a exportação de dados como um log de consentimento
        await prisma.consentLog.create({
            data: {
                userId: user.id,
                email: user.email,
                consentType: 'DATA_PROCESSING',
                status: 'GRANTED',
                ipAddress: (request.headers.get('x-forwarded-for') ||
                           request.headers.get('x-real-ip') ||
                           'unknown').substring(0, 45),
                userAgent: request.headers.get('user-agent') || 'unknown',
                metadata: {
                    action: 'data_export',
                    exportedSections: Object.keys(exportData).filter(k => k !== 'exportedAt' && k !== 'email')
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Dados exportados com sucesso',
            data: exportData
        });

    } catch (error) {
        console.error('Erro ao exportar dados:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Dados inválidos',
                errors: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            message: 'Erro ao exportar dados'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email é obrigatório'
            }, { status: 400 });
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Usuário não encontrado'
            }, { status: 404 });
        }

        // Retornar informações básicas para confirmação antes da exportação
        return NextResponse.json({
            success: true,
            message: 'Usuário encontrado. Use POST para exportar os dados.',
            user: {
                email: user.email,
                name: user.name,
                registeredSince: user.createdAt
            }
        });

    } catch (error) {
        console.error('Erro ao verificar usuário:', error);

        return NextResponse.json({
            success: false,
            message: 'Erro ao verificar usuário'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
