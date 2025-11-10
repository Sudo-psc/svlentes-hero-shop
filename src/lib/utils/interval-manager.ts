/**
 * 🛠️ Quick Win: Centralized Interval Management
 * Prevents setTimeout/setInterval conflicts and memory leaks
 */

export interface IntervalInfo {
  id: number;
  type: 'timeout' | 'interval';
  name: string;
  callback: () => void;
  createdAt: number;
  lastExecuted?: number;
  executionCount?: number;
  persistent?: boolean; // Survives page navigation
}

export class IntervalManager {
  private static instance: IntervalManager;
  private intervals: Map<number, IntervalInfo> = new Map();
  private maxIntervals = 50; // Prevent interval explosion
  private cleanupInterval: number | null = null;
  private isDestroyed = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.startCleanupTimer();
    }
  }

  static getInstance(): IntervalManager {
    if (!IntervalManager.instance || IntervalManager.instance.isDestroyed) {
      IntervalManager.instance = new IntervalManager();
    }
    return IntervalManager.instance;
  }

  /**
   * 🚨 Create managed interval with automatic cleanup
   */
  setInterval(
    name: string,
    callback: () => void,
    delay: number,
    persistent = false
  ): number {
    if (this.isDestroyed) {
      console.warn('[IntervalManager] Cannot create interval - manager destroyed');
      return -1;
    }

    // Prevent interval explosion
    if (this.intervals.size >= this.maxIntervals) {
      this.cleanupOldIntervals();

      if (this.intervals.size >= this.maxIntervals) {
        console.error('[IntervalManager] Maximum intervals reached - cannot create new interval');
        return -1;
      }
    }

    // Check for duplicate names
    const existingInterval = Array.from(this.intervals.values())
      .find(interval => interval.name === name && !interval.persistent);

    if (existingInterval) {
      console.warn(`[IntervalManager] Interval '${name}' already exists - replacing it`);
      this.clearInterval(existingInterval.id);
    }

    const id = window.setInterval(() => {
      const interval = this.intervals.get(id);
      if (interval) {
        interval.lastExecuted = Date.now();
        interval.executionCount = (interval.executionCount || 0) + 1;

        try {
          callback();
        } catch (error) {
          console.error(`[IntervalManager] Error in interval '${name}':`, error);
        }
      }
    }, delay);

    this.intervals.set(id, {
      id,
      type: 'interval',
      name,
      callback,
      createdAt: Date.now(),
      persistent,
      executionCount: 0
    });

    console.log(`[IntervalManager] Created interval: ${name} (${delay}ms)`);
    return id;
  }

  /**
   * 🚨 Create managed timeout with automatic cleanup
   */
  setTimeout(name: string, callback: () => void, delay: number): number {
    if (this.isDestroyed) {
      console.warn('[IntervalManager] Cannot create timeout - manager destroyed');
      return -1;
    }

    const id = window.setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(`[IntervalManager] Error in timeout '${name}':`, error);
      } finally {
        this.intervals.delete(id);
      }
    }, delay);

    this.intervals.set(id, {
      id,
      type: 'timeout',
      name,
      callback,
      createdAt: Date.now()
    });

    console.log(`[IntervalManager] Created timeout: ${name} (${delay}ms)`);
    return id;
  }

  /**
   * 🚨 Safe interval clearing
   */
  clearInterval(id: number): void {
    const interval = this.intervals.get(id);
    if (interval) {
      window.clearInterval(id);
      this.intervals.delete(id);
      console.log(`[IntervalManager] Cleared interval: ${interval.name}`);
    }
  }

  /**
   * 🚨 Safe timeout clearing
   */
  clearTimeout(id: number): void {
    const timeout = this.intervals.get(id);
    if (timeout) {
      window.clearTimeout(id);
      this.intervals.delete(id);
      console.log(`[IntervalManager] Cleared timeout: ${timeout.name}`);
    }
  }

  /**
   * 🚨 Clear intervals by name
   */
  clearByName(name: string): void {
    const toClear = Array.from(this.intervals.values())
      .filter(interval => interval.name === name);

    toClear.forEach(interval => {
      if (interval.type === 'interval') {
        this.clearInterval(interval.id);
      } else {
        this.clearTimeout(interval.id);
      }
    });
  }

  /**
   * 🚨 Clear all non-persistent intervals
   */
  clearAll(): void {
    const toClear = Array.from(this.intervals.entries())
      .filter(([_, interval]) => !interval.persistent);

    toClear.forEach(([id, interval]) => {
      if (interval.type === 'interval') {
        window.clearInterval(id);
      } else {
        window.clearTimeout(id);
      }
      this.intervals.delete(id);
    });

    console.log(`[IntervalManager] Cleared ${toClear.length} non-persistent intervals`);
  }

  /**
   * 🚨 Get interval statistics
   */
  getStats(): { total: number; intervals: number; timeouts: number; persistent: number } {
    const intervals = Array.from(this.intervals.values());

    return {
      total: intervals.length,
      intervals: intervals.filter(i => i.type === 'interval').length,
      timeouts: intervals.filter(i => i.type === 'timeout').length,
      persistent: intervals.filter(i => i.persistent).length
    };
  }

  /**
   * 🚨 List active intervals for debugging
   */
  listActive(): void {
    const intervals = Array.from(this.intervals.values());

    if (intervals.length === 0) {
      console.log('[IntervalManager] No active intervals');
      return;
    }

    console.group(`[IntervalManager] Active Intervals (${intervals.length}):`);
    intervals.forEach(interval => {
      const lastRun = interval.lastExecuted
        ? `${Math.floor((Date.now() - interval.lastExecuted) / 1000)}s ago`
        : 'never';

      console.log(`${interval.name}: ${interval.type} (${interval.executionCount || 0} executions, last: ${lastRun})`);
    });
    console.groupEnd();
  }

  /**
   * 🚨 Cleanup old intervals to prevent memory leaks
   */
  private cleanupOldIntervals(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const toRemove = Array.from(this.intervals.entries())
      .filter(([_, interval]) =>
        !interval.persistent &&
        interval.type === 'timeout' &&
        interval.createdAt < oneHourAgo
      );

    toRemove.forEach(([id]) => {
      this.intervals.delete(id);
    });

    if (toRemove.length > 0) {
      console.log(`[IntervalManager] Cleaned up ${toRemove.length} old intervals`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupOldIntervals();
   }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * 🚨 Destroy interval manager - complete cleanup
   */
  destroy(): void {
    if (this.isDestroyed) return;

    // Clear all intervals
    this.intervals.forEach((interval, id) => {
      if (interval.type === 'interval') {
        window.clearInterval(id);
      } else {
        window.clearTimeout(id);
      }
    });

    // Clear cleanup timer
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear all data
    this.intervals.clear();
    this.isDestroyed = true;

    console.log('[IntervalManager] Destroyed - all intervals cleared');
  }
}

// Global convenience functions
export const intervalManager = IntervalManager.getInstance();

export const setManagedInterval = (name: string, callback: () => void, delay: number, persistent = false) =>
  intervalManager.setInterval(name, callback, delay, persistent);

export const setManagedTimeout = (name: string, callback: () => void, delay: number) =>
  intervalManager.setTimeout(name, callback, delay);

export const clearManagedInterval = (id: number) => intervalManager.clearInterval(id);
export const clearManagedTimeout = (id: number) => intervalManager.clearTimeout(id);
export const clearManagedByName = (name: string) => intervalManager.clearByName(name);
export const clearManagedAll = () => intervalManager.clearAll();