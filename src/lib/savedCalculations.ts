import { type SavedCalculation, type CalculatorInput, type CalculatorResult } from '@/types/calculator'

const STORAGE_KEY = 'svlentes_saved_calculations'

export function getSavedCalculations(): SavedCalculation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCalculation(
  input: CalculatorInput, 
  result: CalculatorResult, 
  name?: string
): SavedCalculation {
  const calculation: SavedCalculation = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    input,
    result,
    name
  }
  
  const saved = getSavedCalculations()
  const updated = [calculation, ...saved].slice(0, 10)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save calculation:', error)
  }
  
  return calculation
}

export function deleteCalculation(id: string): void {
  const saved = getSavedCalculations()
  const updated = saved.filter(calc => calc.id !== id)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to delete calculation:', error)
  }
}

export function clearAllCalculations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear calculations:', error)
  }
}
