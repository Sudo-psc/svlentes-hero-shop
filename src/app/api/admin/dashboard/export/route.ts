/**
 * GET /api/admin/dashboard/export
 * Exportação de dados do dashboard administrativo
 *
 * Permite exportar métricas e dados em diferentes formatos (CSV, Excel, PDF)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
/**
 * @swagger
 * /api/admin/dashboard/export:
 *   get:
 *     summary: Exportar dados do dashboard
 *     description: Exporta métricas e dados do dashboard em diferentes formatos
 *     tags:
 *       - Dashboard Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *           required: true
 *         description: Formato de exportação
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *           enum: [metrics, revenue, customers, all]
 *           default: all
 *         description: Tipo de dados a exportar
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período dos dados
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (opcional, substitui period)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (opcional, substitui period)
 *     responses:
 *       200:
 *         description: Dados exportados com sucesso
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('dashboard:export')(request)
    if (error) {
      return error
    }
    // Obter parâmetros
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') as 'csv' | 'excel' | 'pdf'
    const dataType = searchParams.get('dataType') || 'all'
    const period = searchParams.get('period') || '30d'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    // Validar formato
    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        {
          error: 'INVALID_FORMAT',
          message: 'Formato inválido. Use: csv, excel ou pdf'
        },
        { status: 400 }
      )
    }
    // Gerar dados baseado no tipo solicitado
    const data = await generateExportData(dataType, { period, startDate, endDate })
    // Exportar no formato solicitado
    switch (format) {
      case 'csv':
        return exportAsCSV(data, dataType)
      case 'excel':
        return exportAsExcel(data, dataType)
      case 'pdf':
        return exportAsPDF(data, dataType)
      default:
        throw new Error('Formato não suportado')
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      {
        error: 'EXPORT_ERROR',
        message: 'Erro ao exportar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
// Tipos para dados de exportação
interface ExportData {
  metrics?: any
  revenue?: any[]
  customers?: any[]
  activity?: any[]
}
// Gerar dados para exportação
async function generateExportData(
  dataType: string,
  filters: { period: string; startDate?: string; endDate?: string }
): Promise<ExportData> {
  // Mock de dados - em produção, buscar das APIs reais
  const mockData: ExportData = {}
  if (dataType === 'all' || dataType === 'metrics') {
    mockData.metrics = {
      totalCustomers: 1247,
      activeSubscriptions: 892,
      monthlyRevenue: 45680.50,
      monthlyGrowth: 12.5,
      churnRate: 2.3,
      averageOrderValue: 125.50,
      generatedAt: new Date().toISOString(),
      period: filters.period
    }
  }
  if (dataType === 'all' || dataType === 'revenue') {
    mockData.revenue = [
      { date: '2024-10-01', revenue: 45680.50, subscriptions: 892, orders: 165 },
      { date: '2024-10-02', revenue: 2340.00, subscriptions: 3, orders: 8 },
      { date: '2024-10-03', revenue: 3450.00, subscriptions: 5, orders: 12 },
      // ... mais dados
    ]
  }
  if (dataType === 'all' || dataType === 'customers') {
    mockData.customers = [
      { date: '2024-10-01', newCustomers: 15, totalCustomers: 1247, churnedCustomers: 3 },
      { date: '2024-10-02', newCustomers: 8, totalCustomers: 1255, churnedCustomers: 2 },
      { date: '2024-10-03', newCustomers: 12, totalCustomers: 1267, churnedCustomers: 1 },
      // ... mais dados
    ]
  }
  if (dataType === 'all') {
    mockData.activity = [
      {
        timestamp: '2024-10-19T10:30:00Z',
        type: 'order',
        title: 'Novo pedido recebido',
        description: 'Pedido #12345 - João Silva',
        status: 'success'
      },
      {
        timestamp: '2024-10-19T09:15:00Z',
        type: 'subscription',
        title: 'Nova assinatura ativada',
        description: 'Maria Santos - Plano Mensal',
        status: 'success'
      }
      // ... mais atividades
    ]
  }
  return mockData
}
// Exportar como CSV
function exportAsCSV(data: ExportData, dataType: string): NextResponse {
  let csvContent = ''
  const timestamp = new Date().toISOString().split('T')[0]
  if (data.metrics) {
    csvContent += 'MÉTRICAS DO DASHBOARD\n'
    csvContent += `Data de Geração,${new Date().toLocaleString('pt-BR')}\n`
    csvContent += `Período,${data.metrics.period}\n\n`
    csvContent += 'Métrica,Valor\n'
    csvContent += `Total de Clientes,${data.metrics.totalCustomers}\n`
    csvContent += `Assinaturas Ativas,${data.metrics.activeSubscriptions}\n`
    csvContent += `Receita Mensal,R$ ${data.metrics.monthlyRevenue.toFixed(2)}\n`
    csvContent += `Crescimento Mensal,${data.metrics.monthlyGrowth}%\n`
    csvContent += `Taxa de Churn,${data.metrics.churnRate}%\n`
    csvContent += `Ticket Médio,R$ ${data.metrics.averageOrderValue.toFixed(2)}\n\n`
  }
  if (data.revenue && data.revenue.length > 0) {
    csvContent += 'DADOS DE RECEITA\n'
    csvContent += 'Data,Receita,Assinaturas,Pedidos\n'
    data.revenue.forEach(item => {
      csvContent += `${item.date},R$ ${item.revenue.toFixed(2)},${item.subscriptions},${item.orders}\n`
    })
    csvContent += '\n'
  }
  if (data.customers && data.customers.length > 0) {
    csvContent += 'DADOS DE CLIENTES\n'
    csvContent += 'Data,Novos Clientes,Total de Clientes,Clientes Cancelados\n'
    data.customers.forEach(item => {
      csvContent += `${item.date},${item.newCustomers},${item.totalCustomers},${item.churnedCustomers}\n`
    })
    csvContent += '\n'
  }
  if (data.activity && data.activity.length > 0) {
    csvContent += 'ATIVIDADES RECENTES\n'
    csvContent += 'Data,Tipo,Título,Descrição,Status\n'
    data.activity.forEach(item => {
      csvContent += `${item.timestamp},${item.type},"${item.title}","${item.description}",${item.status}\n`
    })
  }
  const filename = `svlentes-dashboard-${dataType}-${timestamp}.csv`
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
// Exportar como Excel (simplificado - na verdade gera CSV com extensão .xlsx)
function exportAsExcel(data: ExportData, dataType: string): NextResponse {
  // Para uma implementação real, usar bibliotecas como xlsx ou exceljs
  // Por ora, retornamos CSV com extensão .xlsx
  const csvResponse = exportAsCSV(data, dataType)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `svlentes-dashboard-${dataType}-${timestamp}.xlsx`
  // Modificar headers para Excel
  const headers = new Headers(csvResponse.headers)
  headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  headers.set('Content-Disposition', `attachment; filename="${filename}"`)
  return new NextResponse(csvResponse.body, {
    status: csvResponse.status,
    headers
  })
}
// Exportar como PDF
function exportAsPDF(data: ExportData, dataType: string): NextResponse {
  const doc = new jsPDF()
  const timestamp = new Date().toISOString().split('T')[0]
  let yPosition = 20
  // Cabeçalho
  doc.setFontSize(20)
  doc.text('SVLentes Dashboard', 20, yPosition)
  yPosition += 15
  doc.setFontSize(12)
  doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition)
  yPosition += 10
  if (data.metrics) {
    doc.setFontSize(16)
    doc.text('Métricas Principais', 20, yPosition)
    yPosition += 10
    doc.setFontSize(11)
    const metrics = [
      `Total de Clientes: ${data.metrics.totalCustomers}`,
      `Assinaturas Ativas: ${data.metrics.activeSubscriptions}`,
      `Receita Mensal: R$ ${data.metrics.monthlyRevenue.toFixed(2)}`,
      `Crescimento Mensal: ${data.metrics.monthlyGrowth}%`,
      `Taxa de Churn: ${data.metrics.churnRate}%`,
      `Ticket Médio: R$ ${data.metrics.averageOrderValue.toFixed(2)}`
    ]
    metrics.forEach(metric => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(metric, 20, yPosition)
      yPosition += 7
    })
    yPosition += 10
  }
  if (data.revenue && data.revenue.length > 0) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }
    doc.setFontSize(16)
    doc.text('Dados de Receita', 20, yPosition)
    yPosition += 10
    // Tabela de receita
    const tableData = data.revenue.map(item => [
      item.date,
      `R$ ${item.revenue.toFixed(2)}`,
      item.subscriptions.toString(),
      item.orders.toString()
    ])
    autoTable(doc, {
      head: [['Data', 'Receita', 'Assinaturas', 'Pedidos']],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 }
    })
  }
  if (data.customers && data.customers.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 20
    if (finalY > 200) {
      doc.addPage()
      yPosition = 20
    } else {
      yPosition = finalY + 10
    }
    doc.setFontSize(16)
    doc.text('Dados de Clientes', 20, yPosition)
    yPosition += 10
    // Tabela de clientes
    const customerData = data.customers.map(item => [
      item.date,
      item.newCustomers.toString(),
      item.totalCustomers.toString(),
      item.churnedCustomers.toString()
    ])
    autoTable(doc, {
      head: [['Data', 'Novos', 'Total', 'Cancelados']],
      body: customerData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 }
    })
  }
  const filename = `svlentes-dashboard-${dataType}-${timestamp}.pdf`
  return new NextResponse(doc.output('arraybuffer'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}