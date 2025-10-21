/**
 * API para gerenciar um plano específico
 * GET: Obter plano por ID
 * PUT: Atualizar plano
 * DELETE: Excluir plano
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin/auth'
import { PlanoAssinatura } from '@/types/pricing-calculator'

// Simulação de banco de dados (em produção, usar PostgreSQL)
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(async (req, { session }) => {
    try {
      const id = params.id

      // Buscar plano
      const plano = planosDB.find(p => p.id === id)
      if (!plano) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      return NextResponse.json(plano)
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(async (req, { session }) => {
    try {
      const id = params.id
      const body = await request.json()
      const planoData: Partial<PlanoAssinatura> = body

      // Buscar plano
      const planoIndex = planosDB.findIndex(p => p.id === id)
      if (planoIndex === -1) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      // Atualizar plano
      planosDB[planoIndex] = {
        ...planosDB[planoIndex],
        ...planoData,
        id, // Garantir que o ID não mude
        updatedAt: new Date()
      }

      return NextResponse.json(planosDB[planoIndex])
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(async (req, { session }) => {
    try {
      const id = params.id

      // Buscar plano
      const planoIndex = planosDB.findIndex(p => p.id === id)
      if (planoIndex === -1) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      // Verificar se há assinaturas ativas
      // Em produção, verificar no banco de dados
      const temAssinaturasAtivas = false // Simulação

      if (temAssinaturasAtivas) {
        return NextResponse.json(
          { error: 'Não é possível excluir um plano com assinaturas ativas' },
          { status: 400 }
        )
      }

      // Remover plano
      planosDB.splice(planoIndex, 1)

      return NextResponse.json({ message: 'Plano excluído com sucesso' })
    } catch (error) {
      console.error('Erro ao excluir plano:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}