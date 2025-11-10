/**
 * Interval Manager Utility
 *
 * Manages setInterval calls with proper cleanup and naming
 * Prevents memory leaks from orphaned intervals
 *
 * @author Dr. Philipe Saraiva Cruz
 */

// Store active intervals with names for easy cleanup
const activeIntervals = new Map<string, NodeJS.Timeout>()

/**
 * Create a managed interval that can be cleared by name
 *
 * @param callback - Function to execute repeatedly
 * @param delay - Delay in milliseconds between executions
 * @param name - Unique name for this interval
 * @returns Interval ID
 */
export function setManagedInterval(
  callback: () => void,
  delay: number,
  name: string
): NodeJS.Timeout {
  // Clear existing interval with same name if it exists
  clearManagedByName(name)

  // Create new interval
  const intervalId = setInterval(callback, delay)

  // Store in map
  activeIntervals.set(name, intervalId)

  return intervalId
}

/**
 * Clear a managed interval by its name
 *
 * @param name - Name of the interval to clear
 */
export function clearManagedByName(name: string): void {
  const intervalId = activeIntervals.get(name)

  if (intervalId) {
    clearInterval(intervalId)
    activeIntervals.delete(name)
  }
}

/**
 * Clear all managed intervals
 */
export function clearAllManagedIntervals(): void {
  activeIntervals.forEach((intervalId) => {
    clearInterval(intervalId)
  })
  activeIntervals.clear()
}

/**
 * Get list of active interval names
 *
 * @returns Array of active interval names
 */
export function getActiveIntervalNames(): string[] {
  return Array.from(activeIntervals.keys())
}

/**
 * Check if an interval with given name is active
 *
 * @param name - Name to check
 * @returns True if interval is active
 */
export function hasActiveInterval(name: string): boolean {
  return activeIntervals.has(name)
}
