/**
 * API para gerenciar configuração de custos
 * GET: Obter configuração atual
 * POST: Salvar nova configuração
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/admin/auth'
import { ConfigPainelCustos, getCustosPadrao, getDescontosPadrao } from '@/types/pricing-calculator'

// Simulação de banco de dados
let configDB: ConfigPainelCustos = {
  custos: getCustosPadrao(),
  descontos: getDescontosPadrao(),
  historico: [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      usuario: 'admin',
      campo: 'config_inicial',
      valorAnterior: '{}',
      valorNovo: JSON.stringify(getCustosPadrao()),
      motivo: 'Configuração inicial'
    }
  ],
  ultimoAtualizacao: new Date('2024-01-15T10:30:00'),
  usuarioAtualizacao: 'admin'
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Retornar configuração
    return NextResponse.json(configDB)
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter dados do corpo
    const body = await request.json()
    const novaConfig: ConfigPainelCustos = body

    // Validações básicas
    if (!novaConfig.custos || !novaConfig.descontos) {
      return NextResponse.json(
        { error: 'Configuração inválida' },
        { status: 400 }
      )
    }

    // Validar limites
    if (
      novaConfig.custos.taxaProcessamento < 0 || novaConfig.custos.taxaProcessamento > 10 ||
      novaConfig.custos.custoParcelamento < 0 || novaConfig.custos.custoParcelamento > 15 ||
      novaConfig.custos.embalagens < 0 || novaConfig.custos.embalagens > 50 ||
      novaConfig.custos.exames < 0 || novaConfig.custos.exames > 500 ||
      novaConfig.custos.administrativo < 0 || novaConfig.custos.administrativo > 1000 ||
      novaConfig.custos.insumos < 0 || novaConfig.custos.insumos > 200 ||
      novaConfig.custos.operacional < 0 || novaConfig.custos.operacional > 500
    ) {
      return NextResponse.json(
        { error: 'Valores fora dos limites permitidos' },
        { status: 400 }
      )
    }

    // Validar descontos
    if (
      novaConfig.descontos.basicoAnual < 0 || novaConfig.descontos.basicoAnual > 30 ||
      novaConfig.descontos.padraoAnual < 0 || novaConfig.descontos.padraoAnual > 30 ||
      novaConfig.descontos.premiumAnual < 0 || novaConfig.descontos.premiumAnual > 30
    ) {
      return NextResponse.json(
        { error: 'Descontos devem estar entre 0% e 30%' },
        { status: 400 }
      )
    }

    // Criar entrada no histórico
    const historicoEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      usuario: session.user?.email || 'admin',
      campo: 'config_geral',
      valorAnterior: JSON.stringify(configDB),
      valorNovo: JSON.stringify(novaConfig),
      motivo: 'Atualização via painel administrativo'
    }

    // Adicionar ao histórico (manter apenas últimas 10)
    configDB.historico = [historicoEntry, ...configDB.historico.slice(0, 9)]

    // Atualizar configuração
    configDB = {
      ...novaConfig,
      historico: configDB.historico,
      ultimoAtualizacao: new Date(),
      usuarioAtualizacao: session.user?.email || 'admin'
    }

    // Log para auditoria
    console.log('Configuração de custos atualizada:', {
      usuario: session.user?.email,
      timestamp: new Date(),
      mudancas: Object.keys(novaConfig.custos).length + Object.keys(novaConfig.descontos).length
    })

    return NextResponse.json(configDB)
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}