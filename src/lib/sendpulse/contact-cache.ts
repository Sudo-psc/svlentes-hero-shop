/**
 * SendPulse Contact Cache
 * In-memory caching for phone number → contact ID mappings
 * Reduces API calls for repeat contact operations
 */

import type { SendPulseContact } from './types'

interface CachedContact {
  contactId: string
  phone: string
  botId: string
  name?: string
  isChatOpened: boolean
  cachedAt: number
  expiresAt: number
  conversationCheckedAt: number // Track when conversation status was last checked
  freshnessThreshold: number // Max age for conversation status before refresh needed
}

export class ContactCache {
  private cache: Map<string, CachedContact> = new Map()
  private ttl: number

  constructor(ttlMs: number = 60 * 60 * 1000) { // Default: 1 hour
    this.ttl = ttlMs
  }

  /**
   * Generate cache key from bot ID and phone number
   */
  private getCacheKey(botId: string, phone: string): string {
    const cleanPhone = phone.toString().replace(/\D/g, '')
    return `${botId}:${cleanPhone}`
  }

  /**
   * Add or update contact in cache
   */
  set(botId: string, phone: string, contact: SendPulseContact): void {
    const key = this.getCacheKey(botId, phone)
    const now = Date.now()

    this.cache.set(key, {
      contactId: contact.id,
      phone: contact.channel_data.phone.toString(),
      botId: contact.bot_id,
      name: contact.channel_data.name,
      isChatOpened: contact.is_chat_opened,
      cachedAt: now,
      expiresAt: now + this.ttl,
      conversationCheckedAt: now,
      freshnessThreshold: 5 * 60 * 1000 // 5 minutes for conversation status freshness
    })
  }

  /**
   * Get contact from cache
   */
  get(botId: string, phone: string): CachedContact | null {
    const key = this.getCacheKey(botId, phone)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // Check if cache entry has expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  /**
   * Get contact ID from cache (convenience method)
   */
  getContactId(botId: string, phone: string): string | null {
    const cached = this.get(botId, phone)
    return cached ? cached.contactId : null
  }

  /**
   * Check if contact is in 24-hour conversation window
   */
  isContactActive(botId: string, phone: string): boolean | null {
    const cached = this.get(botId, phone)
    return cached ? cached.isChatOpened : null
  }

  /**
   * Check if conversation status data is fresh enough
   */
  isConversationStatusFresh(botId: string, phone: string): boolean {
    const cached = this.get(botId, phone)
    if (!cached) return false

    const now = Date.now()
    return (now - cached.conversationCheckedAt) < cached.freshnessThreshold
  }

  /**
   * Mark conversation status as freshly checked
   */
  updateConversationCheckTime(botId: string, phone: string): void {
    const key = this.getCacheKey(botId, phone)
    const cached = this.cache.get(key)

    if (cached) {
      cached.conversationCheckedAt = Date.now()
      this.cache.set(key, cached)
    }
  }

  /**
   * Get contacts that need conversation status refresh
   */
  getStaleConversationContacts(botId: string): CachedContact[] {
    const now = Date.now()
    const staleContacts: CachedContact[] = []

    Array.from(this.cache.values()).forEach(contact => {
      if (contact.botId === botId &&
          now <= contact.expiresAt &&
          (now - contact.conversationCheckedAt) > contact.freshnessThreshold) {
        staleContacts.push(contact)
      }
    })

    return staleContacts
  }

  /**
   * Update conversation window status for contact
   */
  updateConversationWindow(botId: string, phone: string, isChatOpened: boolean): void {
    const key = this.getCacheKey(botId, phone)
    const cached = this.cache.get(key)

    if (cached) {
      cached.isChatOpened = isChatOpened
      this.cache.set(key, cached)
    }
  }

  /**
   * Remove contact from cache
   */
  delete(botId: string, phone: string): boolean {
    const key = this.getCacheKey(botId, phone)
    return this.cache.delete(key)
  }

  /**
   * Check if contact exists in cache
   */
  has(botId: string, phone: string): boolean {
    const cached = this.get(botId, phone)
    return cached !== null
  }

  /**
   * Clear all cached contacts
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): number {
    const now = Date.now()
    let clearedCount = 0

    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now > value.expiresAt) {
        this.cache.delete(key)
        clearedCount++
      }
    })

    return clearedCount
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total: number
    active: number
    expired: number
  } {
    const now = Date.now()
    let activeCount = 0
    let expiredCount = 0

    Array.from(this.cache.values()).forEach(value => {
      if (now > value.expiresAt) {
        expiredCount++
      } else {
        activeCount++
      }
    })

    return {
      total: this.cache.size,
      active: activeCount,
      expired: expiredCount
    }
  }

  /**
   * Get all cached contacts for a specific bot
   */
  getByBotId(botId: string): CachedContact[] {
    const contacts: CachedContact[] = []
    const now = Date.now()

    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (value.botId === botId && now <= value.expiresAt) {
        contacts.push(value)
      }
    })

    return contacts
  }

  /**
   * Prefetch contacts into cache
   */
  prefetch(botId: string, contacts: SendPulseContact[]): void {
    contacts.forEach(contact => {
      this.set(botId, contact.channel_data.phone.toString(), contact)
    })
  }
}

// Singleton instance
export const contactCache = new ContactCache()
