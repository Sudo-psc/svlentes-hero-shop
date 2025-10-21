/**
 * API para gerenciar planos de assinatura
 * GET: Listar todos os planos
 * POST: Criar novo plano
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin/auth'
import { withCache, cacheUtils } from '@/lib/api-cache'
import { PlanoAssinatura } from '@/types/pricing-calculator'

// Simulação de banco de dados
const planosDB: PlanoAssinatura[] = [
  {
    id: '1',
    nome: 'Plano Básico Mensal',
    categoria: 'basico',
    ciclo: 'mensal',
    precoBase: 99.90,
    custos: {
      id: 'default',
      nome: 'Configuração Padrão',
      taxaProcessamento: 2.99,
      custoParcelamento: 1.5,
      embalagens: 8.50,
      exames: 50,
      administrativo: 150,
      insumos: 35,
      operacional: 80,
      beneficios: []
    },
    beneficios: [
      {
        id: 'b1',
        descricao: 'Lentes mensais',
        custo: 30,
        frequencia: 'mensal',
        incluido: true,
        quantidade: 1
      }
    ],
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    nome: 'Plano Padrão Mensal',
    categoria: 'padrao',
    ciclo: 'mensal',
    precoBase: 149.90,
    custos: {
      id: 'default',
      nome: 'Configuração Padrão',
      taxaProcessamento: 2.99,
      custoParcelamento: 1.5,
      embalagens: 8.50,
      exames: 50,
      administrativo: 150,
      insumos: 35,
      operacional: 80,
      beneficios: []
    },
    beneficios: [
      {
        id: 'b2',
        descricao: 'Lentes mensais premium',
        custo: 50,
        frequencia: 'mensal',
        incluido: true,
        quantidade: 1
      },
      {
        id: 'b3',
        descricao: 'Consulta trimestral',
        custo: 100,
        frequencia: 'trimestral',
        incluido: true,
        quantidade: 1
      }
    ],
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    nome: 'Plano Premium Anual',
    categoria: 'premium',
    ciclo: 'anual',
    precoBase: 299.90,
    descontoAnual: 20,
    custos: {
      id: 'default',
      nome: 'Configuração Padrão',
      taxaProcessamento: 2.99,
      custoParcelamento: 1.5,
      embalagens: 8.50,
      exames: 50,
      administrativo: 150,
      insumos: 35,
      operacional: 80,
      beneficios: []
    },
    beneficios: [
      {
        id: 'b4',
        descricao: 'Lentes diárias premium',
        custo: 80,
        frequencia: 'mensal',
        incluido: true,
        quantidade: 1
      },
      {
        id: 'b5',
        descricao: 'Consulta mensal',
        custo: 150,
        frequencia: 'mensal',
        incluido: true,
        quantidade: 1
      },
      {
        id: 'b6',
        descricao: 'Exame de topografia',
        custo: 200,
        frequencia: 'anual',
        incluido: true,
        quantidade: 1
      }
    ],
    ativo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export function GET(request: NextRequest) {
  return withAdminAuth(async (req, { session }) => {
    return withCache(async (req) => {
      try {
        // Retornar planos
        return NextResponse.json({
          planos: planosDB,
          total: planosDB.length,
          ativos: planosDB.filter(p => p.ativo).length
        })
      } catch (error) {
        console.error('Erro ao buscar planos:', error)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }
    }, {
      maxAge: 300, // 5 minutes cache
      sMaxAge: 1800, // 30 minutes CDN cache
      tags: ['pricing-plans', 'admin'],
      deduplicate: true
    })(request)
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (req, { session }) => {
    try {
      // Obter dados do corpo
      const body = await request.json()
      const planoData: PlanoAssinatura = body

      // Validações básicas
      if (!planoData.nome || !planoData.precoBase || planoData.precoBase <= 0) {
        return NextResponse.json(
          { error: 'Dados inválidos' },
          { status: 400 }
        )
      }

      // Criar novo plano
      const novoPlano: PlanoAssinatura = {
        ...planoData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Adicionar ao "banco"
      planosDB.push(novoPlano)

      // Invalidar cache relacionado aos planos
      cacheUtils.invalidateByTag('pricing-plans')

      return NextResponse.json(novoPlano, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}