'use client'

import type { FinalResult } from '@/vision-types'

export async function PDFExport(result: FinalResult) {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const doc = new jsPDF()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text('Relatório de recomendação personalizada', 14, 20)
    doc.setFontSize(10)
    doc.text(`Sessão: ${result.summary.sessionId}`, 14, 28)
    doc.text(`Data: ${new Date(result.summary.timestamp).toLocaleDateString('pt-BR')}`, 14, 34)

    doc.setFontSize(12)
    doc.text('Resumo', 14, 44)
    doc.setFontSize(10)
    doc.text(`Opção principal: ${result.summary.recommendation.primary.option}`, 14, 50)
    doc.text(`Confiança: ${result.summary.confidence.overallConfidence}`, 14, 56)

    const steps = result.actionPlan.immediate.concat(result.actionPlan.shortTerm).concat(result.actionPlan.longTerm)

    ;(doc as any).autoTable({
        head: [['Próximos passos']],
        body: steps.map(item => [item]),
        startY: 64
    })

    const finalY = (doc as any).lastAutoTable.finalY ?? 80
    doc.text('Aviso: este relatório é informativo e não substitui avaliação médica.', 14, finalY + 10)
    doc.save('recomendacao-svlentes.pdf')
}
