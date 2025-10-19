# SendPulse Integration - Logging and Debugging System

Comprehensive logging, debugging, and monitoring system for SendPulse WhatsApp integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This system provides enterprise-grade logging, debugging, and monitoring capabilities for the SendPulse WhatsApp integration, including:

- **Structured Logging**: Multi-level logging with LGPD-compliant data sanitization
- **Message Status Tracking**: Complete lifecycle tracking from sent → delivered → read
- **Performance Monitoring**: Detailed timing metrics for all operations
- **Debug Utilities**: Comprehensive debugging tools and reports
- **Health Monitoring**: System health checks and alerting

---

## Features

### 1. Message Status Tracking

Track the complete lifecycle of every WhatsApp message:

- **Status Events**: queued, sending, sent, delivered, read, failed, rejected, expired
- **Timing Metrics**: Processing time, delivery time, read time
- **Error Tracking**: Detailed error codes and messages
- **Status History**: Complete timeline of status changes

### 2. Enhanced Logging System

Comprehensive logging with multiple categories and levels:

**Log Levels**:
- `DEBUG`: Detailed debugging information
- `INFO`: General informational messages
- `WARN`: Warning messages
- `ERROR`: Error conditions
- `FATAL`: Critical failures

**Log Categories**:
- `SENDPULSE`: SendPulse API operations
- `WHATSAPP`: WhatsApp message processing
- `LANGCHAIN`: AI/LangChain processing
- `DATABASE`: Database operations
- `WEBHOOK`: Webhook events
- `API`: API requests/responses
- `PERFORMANCE`: Performance metrics
- `SYSTEM`: System-level events

**Key Features**:
- Structured JSON logging in production
- Pretty-printed logs in development
- Automatic data sanitization (LGPD compliant)
- Request ID tracking
- Performance timing
- Error stack traces

### 3. Debugging Utilities

Advanced debugging tools for troubleshooting:

- **Message Flow Tracing**: Track message through entire pipeline
- **Conversation Analysis**: Analyze conversation patterns and metrics
- **System Health Checks**: Monitor system components
- **Debug Reports**: Human-readable debug reports

### 4. Performance Monitoring

Track performance metrics for optimization:

- **Operation Timing**: Measure duration of all operations
- **Stage Breakdown**: Separate timings for each processing stage
- **Delivery Metrics**: Average delivery and read times
- **Failure Rate Tracking**: Monitor and alert on failures

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Webhook Handler                        │
│              (src/app/api/webhooks/sendpulse)            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├──────────────────┬────────────────────┐
                  │                  │                    │
        ┌─────────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
        │   Logger         │  │   Status     │  │    Debug       │
        │   (logger.ts)    │  │   Tracker    │  │   Utilities    │
        └─────────┬────────┘  └──────┬───────┘  └───────┬────────┘
                  │                  │                    │
                  └──────────────────┴────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Prisma Database   │
                          │ (WhatsAppInteraction)│
                          └─────────────────────┘
```

### Data Flow

1. **Webhook Received** → Logged with request ID
2. **Message Processed** → Performance metrics tracked
3. **LangChain Analysis** → Intent and confidence logged
4. **Response Sent** → Send metrics recorded
5. **Status Updates** → Database updated with status tracker
6. **Debug Info** → Available via API endpoints

---

## Usage

### Basic Logging

```typescript
import { logger, LogCategory } from '@/lib/logger'

// Info log
logger.info(LogCategory.WHATSAPP, 'Message received', {
  messageId: 'msg_123',
  phone: '5533999898026'
})

// Error log with stack trace
logger.error(LogCategory.SENDPULSE, 'API error', error, {
  operation: 'sendMessage',
  messageId: 'msg_123'
})

// Performance measurement
const timer = logger.startTimer()
// ... perform operation ...
const duration = timer()
logger.logPerformance('message_processing', {
  duration,
  messageId: 'msg_123'
})
```

### Message Status Tracking

```typescript
import { messageStatusTracker, MessageStatus } from '@/lib/message-status-tracker'

// Update message status
await messageStatusTracker.updateStatus({
  messageId: 'msg_123',
  status: MessageStatus.DELIVERED,
  timestamp: new Date(),
  errorCode: undefined,
  errorMessage: undefined
})

// Get status history
const history = await messageStatusTracker.getStatusHistory('msg_123')

// Get statistics
const stats = await messageStatusTracker.getGlobalStats(30) // last 30 days
```

### Debugging

```typescript
import { debugUtilities, DebugLevel } from '@/lib/debug-utilities'

// Set debug level (from environment)
debugUtilities.setDebugLevel(DebugLevel.VERBOSE)

// Get message debug info
const debugInfo = await debugUtilities.getMessageDebugInfo('msg_123')

// Generate debug report
const report = await debugUtilities.generateMessageReport('msg_123')
console.log(report)

// Get conversation debug info
const convDebug = await debugUtilities.getConversationDebugInfo('5533999898026')

// System health check
const health = await debugUtilities.getSystemHealth()
```

---

## API Endpoints

### 1. Message Debug Info

Get comprehensive debug information for a specific message.

**Endpoint**: `GET /api/debug/message/[messageId]`

**Query Parameters**:
- `format`: `json` (default) or `text`

**Response** (JSON):
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "phone": "5533****8026",
    "status": "delivered",
    "flowEvents": [...],
    "totalDuration": 1234,
    "stages": {
      "received": "2025-10-17T10:00:00.000Z",
      "processed": "2025-10-17T10:00:01.500Z",
      "sent": "2025-10-17T10:00:02.000Z",
      "delivered": "2025-10-17T10:00:03.000Z"
    },
    "durations": {
      "processing": 1500,
      "delivery": 1000
    }
  },
  "timestamp": "2025-10-17T10:05:00.000Z"
}
```

**Response** (Text):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 MESSAGE DEBUG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message ID: msg_123
Phone: 5533****8026
Current Status: delivered
Total Duration: 3000ms
...
```

### 2. Conversation Debug Info

Get debug information for an entire conversation.

**Endpoint**: `GET /api/debug/conversation/[phone]`

**Query Parameters**:
- `format`: `json` (default) or `text`

**Response**:
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_456",
    "phone": "5533****8026",
    "messageCount": 25,
    "lastMessageAt": "2025-10-17T10:00:00.000Z",
    "intents": ["subscription_inquiry", "billing_support"],
    "sentiments": ["positive", "neutral"],
    "escalations": 0,
    "tickets": 1,
    "averageResponseTime": 1234,
    "messages": [...]
  }
}
```

### 3. System Health

Get system health status and metrics.

**Endpoint**: `GET /api/debug/health`

**Query Parameters**:
- `days`: Number of days for statistics (default: 30)

**Response**:
```json
{
  "success": true,
  "data": {
    "health": {
      "status": "healthy",
      "checks": {
        "database": true,
        "sendpulse": true,
        "langchain": true
      },
      "metrics": {
        "messagesLast24h": 150,
        "failureRate": 2.5,
        "averageDeliveryTime": 1234,
        "averageResponseTime": 2345
      },
      "alerts": []
    },
    "stats": {...},
    "failedMessages": [...],
    "failedCount": 3
  }
}
```

### 4. Message Statistics

Get message delivery and performance statistics.

**Endpoint**: `GET /api/debug/stats`

**Query Parameters**:
- `userId`: User ID for user-specific stats (optional)
- `days`: Number of days (default: 30)

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 1000,
      "queued": 10,
      "sending": 5,
      "sent": 50,
      "delivered": 800,
      "read": 600,
      "failed": 15,
      "rejected": 5,
      "expired": 0,
      "averageDeliveryTime": 1234,
      "averageReadTime": 5678,
      "deliveryRate": 95.5,
      "readRate": 75.0,
      "failureRate": 2.0
    },
    "period": {
      "days": 30,
      "from": "2025-09-17T10:00:00.000Z",
      "to": "2025-10-17T10:00:00.000Z"
    },
    "userId": "global"
  }
}
```

---

## Environment Configuration

Configure logging and debugging behavior via environment variables:

```bash
# Logger Configuration
LOG_LEVEL=info                    # debug, info, warn, error, fatal
NODE_ENV=development              # development, production, test
ENABLE_PERFORMANCE_LOGS=true      # Enable performance logging
ENABLE_STRUCTURED_LOGS=false      # JSON logs in production

# Debug Configuration
DEBUG_LEVEL=standard              # minimal, standard, verbose, trace

# External Logging Services (Optional)
DATADOG_API_KEY=your_key          # DataDog integration
SENTRY_DSN=your_dsn               # Sentry error tracking
AWS_CLOUDWATCH_LOG_GROUP=your_group  # CloudWatch logs
```

### Debug Levels

- **minimal**: Only critical errors
- **standard**: Normal operation logs (default)
- **verbose**: Detailed operation logs + full payloads
- **trace**: Maximum verbosity with all internal operations

---

## Troubleshooting

### 1. Message Not Being Tracked

**Problem**: Messages are processed but status is not tracked

**Solution**:
1. Check if message has valid `messageId` in webhook payload
2. Verify database connection: `GET /api/debug/health`
3. Check logs for errors: `LogCategory.DATABASE`

### 2. High Failure Rate

**Problem**: `failureRate > 10%` in health check

**Solution**:
1. Check failed messages: `GET /api/debug/health`
2. Review error codes and messages
3. Verify SendPulse API credentials
4. Check network connectivity

### 3. Slow Performance

**Problem**: `averageDeliveryTime > 5000ms`

**Solution**:
1. Check system health: `GET /api/debug/health`
2. Review performance logs: `LogCategory.PERFORMANCE`
3. Monitor database query times
4. Check SendPulse API response times

### 4. Missing Debug Info

**Problem**: `GET /api/debug/message/[id]` returns 404

**Solution**:
1. Verify message ID is correct
2. Check if message was stored in database
3. Review webhook processing logs
4. Verify `storeInteraction()` was called

### 5. Logs Not Appearing

**Problem**: Expected logs not showing in console

**Solution**:
1. Check `LOG_LEVEL` environment variable
2. Verify logger category is enabled
3. In production, check external logging services
4. Review log sanitization (phone numbers masked)

---

## Best Practices

### 1. Logging

- **Use Appropriate Levels**: DEBUG for development, INFO for important events, ERROR for failures
- **Add Context**: Include relevant IDs (messageId, requestId, userId)
- **Sanitize Data**: Logger automatically sanitizes sensitive data (phones, tokens)
- **Performance**: Use timer helpers for accurate performance measurement

### 2. Debugging

- **Enable Appropriate Level**: Use VERBOSE only when needed to reduce noise
- **Check Health First**: Start troubleshooting with `/api/debug/health`
- **Message Flow**: Use message debug reports to understand full pipeline
- **Conversation Context**: Analyze conversation patterns for behavioral insights

### 3. Monitoring

- **Regular Health Checks**: Schedule periodic health checks
- **Alert Thresholds**: Set alerts for failureRate > 10%, deliveryTime > 5s
- **Track Trends**: Monitor stats over time to detect degradation
- **Failed Message Review**: Regularly check and retry failed messages

### 4. Production

- **Structured Logs**: Enable JSON logs (`ENABLE_STRUCTURED_LOGS=true`)
- **External Services**: Configure DataDog, Sentry, or CloudWatch
- **Log Rotation**: Implement log rotation to manage disk space
- **Performance Impact**: Monitor logging overhead in production

---

## Advanced Features

### Custom Performance Tracking

```typescript
import { logger, PerformanceTimer } from '@/lib/logger'

const timer = logger.startPerformance('custom_operation', {
  customMetric: 'value'
})

// Add metadata during execution
timer.addMetadata({ step: 'processing' })

// Complete with success/failure
timer.end(true) // success
// or
timer.end(false, 'Operation failed') // failure
```

### Request Tracing

```typescript
import { logger, generateRequestId } from '@/lib/logger'

const requestId = generateRequestId()
logger.setRequestId(requestId)

// All subsequent logs will include this requestId
logger.info(LogCategory.API, 'Processing request') // includes requestId

// Clear when done
logger.clearContext()
```

### Debug Level Control

```typescript
import { debugUtilities, DebugLevel } from '@/lib/debug-utilities'

// Change debug level at runtime
debugUtilities.setDebugLevel(DebugLevel.TRACE)

// Trace specific operations
await debugUtilities.traceWebhookProcessing(webhookData, 'sendpulse')
await debugUtilities.traceMessageProcessing('stage_name', { data })
```

---

## Support

For issues or questions:

1. Check system health: `GET /api/debug/health`
2. Review logs with appropriate debug level
3. Generate debug reports for specific messages
4. Check [Troubleshooting](#troubleshooting) section
5. Contact development team with debug reports

---

## License

This logging and debugging system is part of SV Lentes WhatsApp integration.
