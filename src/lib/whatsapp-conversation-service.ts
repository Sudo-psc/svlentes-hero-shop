/**
 * WhatsApp Conversation Database Service
 *
 * Provides database operations for WhatsApp chat integration:
 * - Conversation thread management
 * - Message history retrieval
 * - User profile persistence
 * - Support ticket tracking
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
// ==================== TYPE DEFINITIONS ====================
export interface WhatsAppUserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  whatsapp: string
  subscription: {
    id: string
    planType: string
    status: string
    renewalDate: Date
  } | null
  subscriptionStatus: string
  source: string
  metadata?: any
}
export interface ConversationMessage {
  id: string
  messageId: string
  content: string
  isFromCustomer: boolean
  intent: string | null
  sentiment: string | null
  response: string | null
  createdAt: Date
}
export interface UserSupportHistory {
  tickets: Array<{
    id: string
    ticketNumber: string
    category: string
    priority: string
    status: string
    subject: string
    createdAt: Date
  }>
  lastIntent: string | null
  lastInteraction: Date | null
  totalInteractions: number
}
export interface StoreInteractionData {
  messageId: string
  customerPhone: string
  content: string
  intent: any
  response: string
  escalationRequired: boolean
  ticketCreated: boolean
  ticketId?: string
  userProfile: WhatsAppUserProfile
  llmModel?: string
  processingTime?: number
}
// ==================== CONVERSATION MANAGEMENT ====================
/**
 * Get or create a conversation thread for a customer
 */
export async function getOrCreateConversation(
  customerPhone: string,
  customerName?: string,
  userId?: string
): Promise<{ id: string; isNew: boolean }> {
  try {
    // Check if conversation exists (using customerPhone which has @@unique constraint)
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { customerPhone }
    })
    if (conversation) {
      // Update last message timestamp
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          ...(customerName && { customerName }),
          ...(userId && { userId })
        }
      })
      return { id: conversation.id, isNew: false }
    }
    // Create new conversation
    conversation = await prisma.whatsAppConversation.create({
      data: {
        customerPhone,
        customerName: customerName || null,
        userId: userId || null,
        lastMessageAt: new Date(),
        messageCount: 0,
        isActive: true
      }
    })
    return { id: conversation.id, isNew: true }
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error)
    throw error
  }
}
/**
 * Update conversation metadata (last intent, sentiment, SendPulse IDs)
 */
export async function updateConversationMetadata(
  conversationId: string,
  metadata: {
    lastIntent?: string
    lastSentiment?: string
    sendpulseContactId?: string
    sendpulseBotId?: string
  }
): Promise<void> {
  try {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: metadata
    })
  } catch (error) {
    console.error('Error updating conversation metadata:', error)
    throw error
  }
}
// ==================== MESSAGE HISTORY ====================
/**
 * Get conversation history for a customer phone number
 * Returns last N messages in chronological order
 */
export async function getConversationHistory(
  phone: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    // Get conversation for this phone
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { customerPhone: phone },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            messageId: true,
            content: true,
            isFromCustomer: true,
            intent: true,
            sentiment: true,
            response: true,
            createdAt: true
          }
        }
      }
    })
    if (!conversation) {
      return []
    }
    // Return in chronological order (oldest first for context)
    return conversation.messages.reverse()
  } catch (error) {
    console.error('Error getting conversation history:', error)
    return []
  }
}
/**
 * Get user support history (tickets and interactions)
 */
export async function getUserSupportHistory(userId: string): Promise<UserSupportHistory> {
  try {
    // Get support tickets
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ticketNumber: true,
        category: true,
        priority: true,
        status: true,
        subject: true,
        createdAt: true
      }
    })
    // Get last interaction
    const lastInteraction = await prisma.whatsAppInteraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        intent: true,
        createdAt: true
      }
    })
    // Get total interaction count
    const totalInteractions = await prisma.whatsAppInteraction.count({
      where: { userId }
    })
    return {
      tickets,
      lastIntent: lastInteraction?.intent || null,
      lastInteraction: lastInteraction?.createdAt || null,
      totalInteractions
    }
  } catch (error) {
    console.error('Error getting user support history:', error)
    return {
      tickets: [],
      lastIntent: null,
      lastInteraction: null,
      totalInteractions: 0
    }
  }
}
// ==================== USER PROFILE MANAGEMENT ====================
/**
 * Get or create user profile from WhatsApp contact data
 */
export async function getOrCreateUserProfile(
  contact: {
    id?: string
    name?: string
    email?: string
    phone?: string
    profile?: { name?: string }
    variables?: any
    tags?: string[]
  },
  phone: string
): Promise<WhatsAppUserProfile> {
  try {
    const whatsappFormatted = phone.startsWith('+') ? phone : `+${phone}`
    // Try to find existing user by phone/whatsapp
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: whatsappFormatted },
          { whatsapp: whatsappFormatted },
          { phone },
          { whatsapp: phone }
        ]
      },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'PENDING_ACTIVATION'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    if (!user) {
      // Create new user profile
      const contactName = contact.name || contact.profile?.name || 'Cliente'
      user = await prisma.user.create({
        data: {
          name: contactName,
          email: contact.email || `${phone}@whatsapp.temp`,
          phone,
          whatsapp: whatsappFormatted,
          role: 'subscriber',
          preferences: {
            source: 'sendpulse_whatsapp',
            sendpulseId: contact.id,
            contactVariables: contact.variables || {},
            contactTags: contact.tags || []
          }
        },
        include: {
          subscriptions: true
        }
      })
    }
    // Format subscription data
    const subscription = user.subscriptions?.[0] || null
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      whatsapp: user.whatsapp || whatsappFormatted,
      subscription: subscription ? {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        renewalDate: subscription.renewalDate
      } : null,
      subscriptionStatus: subscription?.status || 'none',
      source: 'sendpulse',
      metadata: {
        sendpulseId: contact.id,
        variables: contact.variables || {},
        tags: contact.tags || []
      }
    }
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error)
    // Return temporary profile on error
    return {
      id: `sendpulse_${phone}`,
      name: contact.name || 'Cliente',
      email: contact.email || null,
      phone,
      whatsapp: phone,
      subscription: null,
      subscriptionStatus: 'none',
      source: 'sendpulse',
      metadata: {
        sendpulseId: contact.id,
        variables: contact.variables || {},
        tags: contact.tags || []
      }
    }
  }
}
// ==================== INTERACTION STORAGE ====================
/**
 * Store a WhatsApp interaction (message + response)
 */
export async function storeInteraction(data: StoreInteractionData): Promise<void> {
  const { conversationBackupService } = await import('@/lib/conversation-backup-service')

  try {
    // Get or create conversation
    const { id: conversationId } = await getOrCreateConversation(
      data.customerPhone,
      data.userProfile.name || undefined,
      data.userProfile.id
    )

    let interactionCreated = null
    let databaseError = null

    // Try to store in primary database (PostgreSQL via Prisma)
    try {
      interactionCreated = await prisma.whatsAppInteraction.create({
        data: {
          conversationId,
          messageId: data.messageId,
          customerPhone: data.customerPhone,
          userId: data.userProfile.id,
          content: data.content,
          isFromCustomer: true,
          intent: data.intent?.intent || data.intent?.category || null,
          sentiment: data.intent?.sentiment || null,
          urgency: data.intent?.priority?.toString() || null,
          response: data.response,
          escalationRequired: data.escalationRequired,
          ticketCreated: data.ticketCreated,
          ticketId: data.ticketId || null,
          llmModel: data.llmModel || null,
          processingTime: data.processingTime || null
        }
      })

      // Update conversation message count and last intent
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 1 },
          lastIntent: data.intent?.intent || data.intent?.category || null,
          lastSentiment: data.intent?.sentiment || null,
          lastMessageAt: new Date()
        }
      })

      console.log(`Interaction stored in database: ${data.response.substring(0, 50)}...`)

    } catch (dbError) {
      databaseError = dbError
      console.error('Primary database error, using Airtable fallback:', dbError)

      // FALLBACK: Store in Airtable when database fails
      const fallbackResult = await conversationBackupService.storeInteractionFallback({
        id: `fallback-${data.messageId}-${Date.now()}`,
        conversationId,
        messageId: data.messageId,
        customerPhone: data.customerPhone,
        userId: data.userProfile.id,
        content: data.content,
        direction: 'inbound',
        intent: data.intent?.intent || data.intent?.category || null,
        sentiment: data.intent?.sentiment || null,
        response: data.response,
        processingTime: data.processingTime || null,
        status: 'sent',
        timestamp: new Date(),
        createdAt: new Date()
      })

      if (!fallbackResult.success) {
        throw new Error(`Both database and Airtable fallback failed: ${fallbackResult.error}`)
      }

      console.log(`Interaction stored via Airtable fallback (will sync later)`)
      return
    }

    // SUCCESS: Backup to Airtable for redundancy (fire and forget)
    if (interactionCreated) {
      conversationBackupService.backupInteraction({
        id: interactionCreated.id,
        conversationId: interactionCreated.conversationId,
        messageId: interactionCreated.messageId,
        customerPhone: interactionCreated.customerPhone,
        userId: interactionCreated.userId,
        content: interactionCreated.content,
        direction: 'inbound',
        intent: interactionCreated.intent,
        sentiment: interactionCreated.sentiment,
        response: interactionCreated.response,
        processingTime: interactionCreated.processingTime,
        status: 'sent',
        timestamp: interactionCreated.createdAt,
        createdAt: interactionCreated.createdAt
      }).catch(err => {
        // Log but don't throw - backup is optional
        console.warn('Airtable backup failed (non-critical):', err)
      })
    }

  } catch (error) {
    console.error('Error storing interaction:', error)
    throw error
  }
}
// ==================== ANALYTICS & REPORTING ====================
/**
 * Get conversation analytics for a user
 */
export async function getConversationAnalytics(userId: string) {
  try {
    const conversations = await prisma.whatsAppConversation.findMany({
      where: { userId },
      include: {
        messages: {
          select: {
            intent: true,
            sentiment: true,
            escalationRequired: true,
            ticketCreated: true
          }
        }
      }
    })
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0)
    const totalConversations = conversations.length
    // Count escalations
    let escalations = 0
    let tickets = 0
    const intents: Record<string, number> = {}
    const sentiments: Record<string, number> = {}
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.escalationRequired) escalations++
        if (msg.ticketCreated) tickets++
        if (msg.intent) intents[msg.intent] = (intents[msg.intent] || 0) + 1
        if (msg.sentiment) sentiments[msg.sentiment] = (sentiments[msg.sentiment] || 0) + 1
      })
    })
    return {
      totalConversations,
      totalMessages,
      escalations,
      tickets,
      topIntents: Object.entries(intents).sort((a, b) => b[1] - a[1]).slice(0, 5),
      sentimentDistribution: sentiments
    }
  } catch (error) {
    console.error('Error getting conversation analytics:', error)
    return null
  }
}
// ==================== CLEANUP & MAINTENANCE ====================
/**
 * Archive inactive conversations (older than N days)
 */
export async function archiveInactiveConversations(daysInactive: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)
    const result = await prisma.whatsAppConversation.updateMany({
      where: {
        lastMessageAt: { lt: cutoffDate },
        isActive: true
      },
      data: {
        isActive: false
      }
    })
    return result.count
  } catch (error) {
    console.error('Error archiving conversations:', error)
    return 0
  }
}
// Export prisma instance for direct queries if needed
export { prisma }