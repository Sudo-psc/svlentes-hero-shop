/**
 * LangGraph Agent Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { conversationMemory } from '../memory'

// Mock Prisma to avoid database dependency
jest.mock('@/lib/prisma', () => ({
  prisma: {
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('LangGraph Agent', () => {
  const testPhone = '5511999999999'

  beforeEach(() => {
    // Clear test conversation before each test
    conversationMemory.clearConversation(testPhone)
  })

  describe('Conversation Memory', () => {
    it('should store and retrieve conversation history', () => {
      conversationMemory.addUserMessage(testPhone, 'Olá', 'Test User')
      conversationMemory.addAIMessage(testPhone, 'Olá! Como posso ajudar?')

      const history = conversationMemory.getConversation(testPhone)

      expect(history).toHaveLength(2)
      expect(history[0].content).toBe('Olá')
      expect(history[1].content).toBe('Olá! Como posso ajudar?')
    })

    it('should track conversation metadata', () => {
      conversationMemory.addUserMessage(testPhone, 'Test message', 'Test User')

      const metadata = conversationMemory.getMetadata(testPhone)

      expect(metadata).toBeDefined()
      expect(metadata?.customerName).toBe('Test User')
      expect(metadata?.messageCount).toBe(1)
      expect(metadata?.escalated).toBe(false)
    })

    it('should mark conversation as escalated', () => {
      conversationMemory.addUserMessage(testPhone, 'Preciso falar com atendente')
      conversationMemory.markAsEscalated(testPhone)

      const isEscalated = conversationMemory.isEscalated(testPhone)

      expect(isEscalated).toBe(true)
    })

    it('should clear conversation history', () => {
      conversationMemory.addUserMessage(testPhone, 'Test message')
      conversationMemory.clearConversation(testPhone)

      const history = conversationMemory.getConversation(testPhone)

      expect(history).toHaveLength(0)
    })

    it('should generate conversation summary', () => {
      conversationMemory.addUserMessage(testPhone, 'Olá', 'Test User')
      conversationMemory.addAIMessage(testPhone, 'Olá! Como posso ajudar?')

      const summary = conversationMemory.getConversationSummary(testPhone)

      expect(summary).toContain('Test User')
      expect(summary).toContain('Messages: 2')
    })

    it('should track statistics', () => {
      conversationMemory.addUserMessage('5511111111111', 'Test 1')
      conversationMemory.addUserMessage('5522222222222', 'Test 2')
      conversationMemory.markAsEscalated('5522222222222')

      const stats = conversationMemory.getStats()

      expect(stats.totalConversations).toBeGreaterThanOrEqual(2)
      expect(stats.escalatedConversations).toBeGreaterThanOrEqual(1)
      expect(stats.totalMessages).toBeGreaterThanOrEqual(2)
    })

    it('should limit message history', () => {
      // Add more messages than the limit
      for (let i = 0; i < 60; i++) {
        conversationMemory.addUserMessage(testPhone, `Message ${i}`)
      }

      const history = conversationMemory.getConversation(testPhone)

      // Should be limited to maxMessagesPerConversation (50 by default)
      expect(history.length).toBeLessThanOrEqual(50)
    })

    it('should export conversation data', () => {
      conversationMemory.addUserMessage(testPhone, 'Test message', 'Test User')

      const exported = conversationMemory.exportConversation(testPhone)

      expect(exported).toBeDefined()
      expect(exported?.customerPhone).toBe(testPhone)
      expect(exported?.messages).toHaveLength(1)
      expect(exported?.metadata).toBeDefined()
    })
  })

  describe('Agent Integration', () => {
    it('should be importable', async () => {
      const { langGraphAgent } = await import('../agent')

      expect(langGraphAgent).toBeDefined()
      expect(typeof langGraphAgent.processMessage).toBe('function')
    })

    // Note: Actual agent tests require OpenAI API key and would make API calls
    // These should be run separately in integration tests
  })

  describe('WhatsApp Client', () => {
    it('should be importable', async () => {
      const { whatsappClient } = await import('../whatsapp-client')

      expect(whatsappClient).toBeDefined()
      expect(typeof whatsappClient.sendTextMessage).toBe('function')
    })

    it('should handle missing credentials gracefully', async () => {
      const { whatsappClient } = await import('../whatsapp-client')

      // Should not throw when credentials are missing (mock mode)
      await expect(whatsappClient.sendTextMessage('5511999999999', 'Test')).resolves.toBeDefined()
    })
  })
})
