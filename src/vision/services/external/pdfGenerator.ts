import type { FinalResult } from '@/vision-types'
import { PDFExport } from '@/vision/components/results/PDFExport'

export async function generateResultPDF(result: FinalResult) {
    return PDFExport(result)
}
