# SVLentes Admin Dashboard - Product Requirements Document

**Version:** 1.0
**Date:** 2025-10-19
**Status:** Draft for Review
**Classification:** Healthcare Platform - LGPD Sensitive

---

## Executive Summary

The SVLentes Admin Dashboard is a comprehensive web-based administration interface for managing the contact lens subscription healthcare platform. This dashboard will enable authorized medical, support, and administrative personnel to monitor operations, manage subscriptions, handle customer support, ensure regulatory compliance, and maintain platform health.

**Business Objectives:**
- Centralized operational control for medical oversight and business management
- LGPD compliance monitoring and data protection management
- Real-time visibility into subscription health and financial metrics
- Efficient customer support with AI-powered WhatsApp integration management
- Proactive system health monitoring and issue resolution
- Medical responsibility tracking and emergency response coordination

**Success Criteria:**
- 90% reduction in manual data queries through direct dashboard access
- <2 seconds load time for critical operational views
- 100% LGPD compliance audit trail with full data lineage
- 50% improvement in support ticket resolution time
- Zero medical data exposure incidents through role-based access control

---

## User Personas and Roles

### Role 1: Medical Administrator (Dr. Philipe Saraiva Cruz - CRM-MG 69.870)

**Responsibilities:**
- Oversee medical compliance and patient safety
- Review prescription validations and medical data integrity
- Monitor emergency escalations and critical health-related issues
- Ensure CFM/CRM regulatory compliance
- Approve medical-related feature flags and system changes

**Key Tasks:**
- Review flagged prescription issues
- Monitor patient consent management
- Audit medical data access logs
- Respond to emergency support tickets
- Generate medical compliance reports

**Technical Requirements:**
- Highest privilege level with full system access
- LGPD audit trail for all medical data views
- Emergency contact integration
- Medical records viewing with prescription validation status
- CRM credential verification in system

**Dashboard Priorities:**
1. Emergency alerts and critical patient issues
2. Prescription validation queue
3. Medical compliance metrics
4. LGPD consent status overview
5. System health related to patient safety

---

### Role 2: Support Manager

**Responsibilities:**
- Manage customer support team and ticket distribution
- Monitor AI chatbot performance and escalations
- Handle WhatsApp integration issues
- Resolve billing disputes and payment issues
- Coordinate with medical team on health-related escalations

**Key Tasks:**
- Assign and reassign support tickets
- Review chatbot conversation quality
- Monitor SendPulse WhatsApp integration health
- Handle Asaas payment disputes
- Generate support performance reports

**Technical Requirements:**
- Access to support tickets, chat logs, and customer data
- Permission to modify user accounts and subscriptions
- WhatsApp conversation monitoring with AI intent analysis
- Payment system access (view and refund capabilities)
- Agent performance dashboard

**Dashboard Priorities:**
1. Open ticket queue with SLA tracking
2. WhatsApp chatbot monitoring and manual takeover
3. Payment dispute resolution interface
4. Support team performance metrics
5. Customer satisfaction scores

---

### Role 3: Operations Administrator

**Responsibilities:**
- Manage subscription lifecycle and billing cycles
- Oversee order fulfillment and delivery tracking
- Monitor payment processing and financial health
- Coordinate delivery logistics
- Handle plan changes and subscription modifications

**Key Tasks:**
- Process subscription changes (plan, address, payment method)
- Track order shipments and delivery status
- Monitor payment success rates and failed transactions
- Generate financial and operational reports
- Manage inventory and delivery schedules

**Technical Requirements:**
- Full CRUD access to subscriptions, orders, and payments
- Asaas payment gateway integration dashboard
- Delivery tracking integration
- Financial reporting with export capabilities
- Bulk operations for subscription management

**Dashboard Priorities:**
1. Subscription status overview (active, overdue, paused)
2. Payment processing health (success rate, failures)
3. Order fulfillment pipeline
4. Revenue metrics and financial KPIs
5. Operational alerts (payment failures, delivery delays)

---

### Role 4: System Administrator

**Responsibilities:**
- Monitor platform health and performance
- Manage feature flags and system configurations
- Handle technical incidents and outages
- Oversee integrations (Asaas, SendPulse, Firebase)
- Maintain security and access controls

**Key Tasks:**
- Monitor system health metrics (database, API, services)
- Manage feature flag rollouts
- Review error logs and performance metrics
- Configure webhooks and integrations
- Manage user roles and permissions

**Technical Requirements:**
- Full system access including infrastructure monitoring
- Feature flag management interface (already exists)
- Integration health dashboards
- Error tracking and performance monitoring
- Security audit logs and access control management

**Dashboard Priorities:**
1. System health overview (database, APIs, services)
2. Integration status (Asaas, SendPulse, Firebase)
3. Feature flag management
4. Error logs and performance metrics
5. Security alerts and access audit logs

---

### Role 5: LGPD Compliance Officer (Data Protection)

**Responsibilities:**
- Ensure LGPD compliance across all platform operations
- Process data access and deletion requests
- Audit consent logs and data processing activities
- Generate compliance reports for regulatory audits
- Coordinate data protection impact assessments

**Key Tasks:**
- Review and process data requests (access, deletion, portability)
- Audit consent logs for validity and expiration
- Monitor data retention policies
- Generate LGPD compliance reports
- Handle data breach notifications (if required)

**Technical Requirements:**
- Read-only access to sensitive data with full audit trails
- Data request processing workflow interface
- Consent management dashboard
- Compliance reporting and export tools
- Anonymized data access for testing purposes

**Dashboard Priorities:**
1. Data request queue (pending, processing, completed)
2. Consent log audit interface
3. Data retention compliance metrics
4. User data access audit trail
5. LGPD compliance score and risk indicators

---

## Core Features and Requirements

### Feature 1: Dashboard Home (Overview)

**Description:**
Unified command center providing real-time operational metrics, health indicators, and critical alerts tailored to user role.

**User Stories:**
- As a Medical Administrator, I need to see emergency alerts and prescription validation queues immediately upon login so I can prioritize patient safety issues
- As a Support Manager, I need to see open ticket counts and SLA breach warnings so I can allocate support resources effectively
- As an Operations Administrator, I need to see daily revenue, active subscriptions, and payment success rates so I can monitor business health
- As a System Administrator, I need to see system health status and integration alerts so I can proactively address technical issues
- As a LGPD Officer, I need to see pending data requests and consent expiration warnings so I can maintain compliance

**Functional Requirements:**

1. **Role-Based Widgets:**
   - Dynamic widget layout based on user role
   - Customizable widget positions (drag-and-drop)
   - Real-time data updates (WebSocket or polling every 30s)
   - Alert badges for critical items requiring attention

2. **Key Metrics Display:**
   - **Medical Admin:** Emergency tickets, prescription validation queue, LGPD consent issues
   - **Support Manager:** Open tickets, SLA breaches, chatbot escalations, average response time
   - **Operations Admin:** Active subscriptions, MRR (Monthly Recurring Revenue), payment success rate, pending orders
   - **System Admin:** System uptime, API response times, error rate, integration status
   - **LGPD Officer:** Pending data requests, consent expiration count, compliance score

3. **Quick Actions:**
   - Single-click navigation to critical workflows
   - Role-specific action buttons (e.g., "Process Data Request", "Assign Ticket", "Review Prescription")

4. **Recent Activity Feed:**
   - Real-time log of system events relevant to user role
   - Filterable by event type (payments, tickets, orders, system events)
   - Clickable items linking to detailed views

**Non-Functional Requirements:**
- Load time: <2 seconds for initial dashboard render
- Real-time updates: <5 seconds latency for critical metrics
- Responsive design: 1920x1080 primary, 1366x768 minimum
- Accessibility: WCAG 2.1 AA compliance
- Audit logging: All dashboard views logged for LGPD compliance

**Acceptance Criteria:**
- [ ] Dashboard loads within 2 seconds with all role-appropriate widgets visible
- [ ] Real-time metrics update automatically without page refresh
- [ ] Critical alerts prominently displayed with visual hierarchy (red = urgent, yellow = warning)
- [ ] Quick actions navigate to correct detailed views
- [ ] Recent activity feed shows last 50 events with infinite scroll
- [ ] Dashboard view logged to audit trail with timestamp and user ID

---

### Feature 2: Subscription Management

**Description:**
Comprehensive subscription lifecycle management including viewing, editing, pausing, canceling, and bulk operations.

**User Stories:**
- As an Operations Admin, I need to search subscriptions by user email, phone, or subscription ID so I can quickly locate customer accounts
- As a Support Manager, I need to view complete subscription history including all changes and payments so I can resolve billing disputes
- As an Operations Admin, I need to pause a subscription for delivery hold so customers can manage their lens supply
- As a Medical Admin, I need to see prescription validation status on subscriptions so I can ensure medical compliance
- As an Operations Admin, I need to perform bulk plan upgrades so I can migrate customers to new pricing

**Functional Requirements:**

1. **Subscription List View:**
   - Searchable and filterable table (user name, email, phone, subscription ID, plan type, status)
   - Status filters: ACTIVE, OVERDUE, SUSPENDED, PAUSED, CANCELLED, PENDING_ACTIVATION
   - Sortable columns: creation date, renewal date, monthly value, status
   - Pagination: 50 items per page with infinite scroll option
   - Bulk selection with multi-action toolbar

2. **Subscription Detail View:**
   - **Overview Section:**
     - User profile (name, email, phone, WhatsApp)
     - Plan details (type, price, start date, renewal date, next billing date)
     - Status badge with color coding
     - Lifecycle tracking (days active, total payments, lifetime value)

   - **Payment History:**
     - Table of all payments from `Payment` model
     - Columns: date, amount, status, billing type (PIX, Boleto, Credit Card), invoice URL
     - Payment status badges (PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED)
     - Quick actions: view invoice, issue refund (for authorized roles)

   - **Order History:**
     - Table of all orders from `Order` model
     - Columns: order date, shipping date, delivery status, tracking code
     - Delivery status workflow visualization (PENDING → SHIPPED → IN_TRANSIT → DELIVERED)
     - Track shipment button linking to carrier tracking

   - **Subscription History Timeline:**
     - Visual timeline from `SubscriptionHistory` model
     - Change types: PLAN_CHANGE, ADDRESS_UPDATE, PAYMENT_METHOD_UPDATE, STATUS_CHANGE
     - Expandable items showing old value → new value
     - Audit trail with timestamp, change reason, and initiator

   - **Action Buttons:**
     - Change Plan (modal with plan selection)
     - Update Address (modal with address form)
     - Update Payment Method (modal with payment options)
     - Pause Subscription (with reason and resume date)
     - Cancel Subscription (with cancellation reason required)
     - Process Refund (for authorized roles)

3. **Bulk Operations:**
   - Select multiple subscriptions via checkboxes
   - Available actions: change plan, update status, export data
   - Confirmation dialog with summary of affected subscriptions
   - Background job for large operations with progress tracking

4. **Advanced Search:**
   - Full-text search across user name, email, phone, address
   - Date range filters (created, renewal, last payment)
   - Amount range filters (monthly value, lifetime value)
   - Prescription status filter (validated, pending, expired)

**Data Model Integration:**
```typescript
// Primary Models
Subscription {
  id, userId, asaasSubscriptionId, planType, status,
  monthlyValue, renewalDate, startDate, paymentMethod,
  shippingAddress, nextBillingDate, lensType,
  metadata (JSONB for flexible data)
}

SubscriptionHistory {
  subscriptionId, changeType, description,
  oldValue (JSONB), newValue (JSONB),
  ipAddress, userAgent, createdAt
}

Payment {
  subscriptionId, asaasPaymentId, amount, status,
  billingType, dueDate, paymentDate, invoiceUrl
}

Order {
  subscriptionId, deliveryStatus, trackingCode,
  orderDate, shippingDate, deliveryAddress
}
```

**API Endpoints:**
- `GET /api/admin/subscriptions` - List with pagination and filters
- `GET /api/admin/subscriptions/[id]` - Subscription details
- `PATCH /api/admin/subscriptions/[id]` - Update subscription
- `POST /api/admin/subscriptions/[id]/pause` - Pause subscription
- `POST /api/admin/subscriptions/[id]/cancel` - Cancel subscription
- `POST /api/admin/subscriptions/[id]/refund` - Process refund
- `POST /api/admin/subscriptions/bulk` - Bulk operations

**Security Requirements:**
- Operations Admin: Full CRUD access
- Support Manager: Read + limited edit (address, payment)
- Medical Admin: Read-only with medical data access
- All changes logged to `SubscriptionHistory` with user ID and IP
- Refund operations require secondary confirmation

**Acceptance Criteria:**
- [ ] Subscription list loads within 2 seconds with 50 items
- [ ] Search returns results within 500ms
- [ ] Subscription detail view shows complete history from all related models
- [ ] Plan change modal displays current plan and available upgrades/downgrades
- [ ] Pause subscription requires reason and optional resume date
- [ ] Cancel subscription requires cancellation reason (dropdown + text)
- [ ] All subscription changes create `SubscriptionHistory` record
- [ ] Bulk operations show progress indicator for >10 subscriptions

---

### Feature 3: Customer Support Dashboard

**Description:**
Integrated support ticket management with WhatsApp chatbot monitoring, AI conversation analysis, and manual intervention capabilities.

**User Stories:**
- As a Support Manager, I need to see all open tickets prioritized by SLA urgency so I can prevent SLA breaches
- As a Support Agent, I need to view WhatsApp conversation context before responding so I can provide informed support
- As a Support Manager, I need to manually take over chatbot conversations when AI fails so I can resolve complex issues
- As a Medical Admin, I need to escalate medical emergency tickets immediately so patient safety is prioritized
- As a Support Manager, I need to analyze chatbot performance metrics so I can improve automated responses

**Functional Requirements:**

1. **Ticket Queue Management:**
   - **List View:**
     - Columns: ticket #, customer, subject, category, priority, status, assigned agent, SLA time remaining
     - Color-coded SLA indicators (green >2hrs, yellow <2hrs, red <30min, flashing critical)
     - Filters: status, priority, category, assigned agent, creation date
     - Quick filters: My Tickets, Unassigned, SLA Risk, Escalated

   - **Ticket Detail View:**
     - Customer profile sidebar (name, email, phone, subscription status)
     - Ticket metadata (number, created, updated, source, intent)
     - Conversation thread (chronological with timestamps)
     - AI analysis badge (intent: billing_support, delivery_status, technical_issue, etc.)
     - Internal notes section (private, not visible to customer)
     - Action toolbar: Assign, Escalate, Resolve, Close

   - **Assignment Logic:**
     - Auto-assign based on agent availability and specialization
     - Manual assignment dropdown with agent list (online status indicator)
     - Workload balancing (show current ticket count per agent)

2. **WhatsApp Integration Dashboard:**
   - **Conversation Monitor:**
     - Real-time list of active WhatsApp conversations
     - Columns: customer phone, last message time, conversation status, AI confidence, human intervention flag
     - Auto-refresh every 10 seconds
     - Search by phone number or customer name

   - **Conversation Detail:**
     - Full message history from `WhatsAppInteraction` model
     - Messages color-coded (customer = blue, AI bot = gray, human agent = green)
     - AI metadata overlay: intent, sentiment, urgency, confidence score
     - LLM model indicator (GPT-4, Claude, etc.)
     - Processing time metrics

   - **Manual Takeover:**
     - "Take Over Conversation" button to disable AI and route to agent
     - Agent response interface (text input with template suggestions)
     - "Return to AI" button to re-enable chatbot
     - Takeover reason required (logging for AI improvement)

3. **AI Performance Analytics:**
   - **Metrics Dashboard:**
     - Total conversations handled by AI vs human
     - Intent classification accuracy (manual validation feedback loop)
     - Sentiment analysis distribution (positive, neutral, negative, urgent)
     - Average AI response time vs human response time
     - Escalation rate and escalation reasons

   - **Conversation Quality:**
     - Sample conversations for quality review
     - Thumbs up/down for AI response quality (feedback training data)
     - Common failure patterns (intents AI struggles with)
     - Recommended FAQ additions based on failed interactions

4. **Knowledge Base Management:**
   - **FAQ Editor:**
     - CRUD interface for `FAQ` model
     - Fields: category, question, answer, keywords, priority, confidence threshold
     - Preview how AI will use FAQ in conversation
     - Active/inactive toggle
     - Related topics linkage

   - **Template Manager:**
     - Pre-written response templates for common issues
     - Variable placeholders ({{customer_name}}, {{subscription_plan}}, etc.)
     - Category organization (billing, technical, delivery, medical)
     - Usage analytics (which templates are most used)

**Data Model Integration:**
```typescript
SupportTicket {
  ticketNumber, userId, subject, description,
  category, priority, status, assignedAgentId,
  source (whatsapp, email, phone),
  intent, context (JSONB), sla_breach,
  estimatedResolution, resolvedAt
}

WhatsAppConversation {
  customerPhone, userId, lastMessageAt,
  messageCount, isActive, lastIntent, lastSentiment
}

WhatsAppInteraction {
  conversationId, messageId, content,
  isFromCustomer, intent, sentiment, urgency,
  response, escalationRequired, ticketCreated,
  llmModel, processingTime
}

FAQ {
  category, question, answer, keywords,
  priority, isActive, escalationRequired,
  confidenceThreshold
}

Agent {
  name, email, specializations (JSONB),
  isOnline, maxConcurrentTickets, currentTicketCount,
  averageResponseTime, satisfactionScore
}
```

**API Endpoints:**
- `GET /api/admin/support/tickets` - Ticket list with filters
- `GET /api/admin/support/tickets/[id]` - Ticket details
- `PATCH /api/admin/support/tickets/[id]` - Update ticket (assign, status)
- `POST /api/admin/support/tickets/[id]/escalate` - Create escalation
- `GET /api/admin/support/whatsapp/conversations` - Active conversations
- `GET /api/admin/support/whatsapp/conversations/[id]` - Conversation history
- `POST /api/admin/support/whatsapp/takeover` - Manual takeover
- `POST /api/admin/support/whatsapp/message` - Send message as agent
- `GET /api/admin/support/analytics` - AI performance metrics
- `GET /api/admin/support/faqs` - FAQ list
- `POST /api/admin/support/faqs` - Create FAQ
- `PATCH /api/admin/support/faqs/[id]` - Update FAQ

**Integration Requirements:**
- SendPulse WhatsApp webhook for real-time message ingestion
- LangChain integration for AI response generation monitoring
- OpenAI API metrics tracking for cost and usage
- Ticket auto-creation from WhatsApp when `escalationRequired` flag set

**Acceptance Criteria:**
- [ ] Ticket list loads within 1 second with 100 tickets
- [ ] SLA timers update in real-time with visual warnings
- [ ] WhatsApp conversation takeover disables AI within 5 seconds
- [ ] Agent can send manual WhatsApp message within 10 seconds of takeover
- [ ] AI intent classification displayed with confidence percentage
- [ ] FAQ changes reflect in chatbot responses within 1 minute (cache invalidation)
- [ ] Escalation creates new ticket with full conversation context
- [ ] Support analytics dashboard shows data from last 30 days with daily breakdown

---

### Feature 4: Financial & Payment Management

**Description:**
Comprehensive financial oversight including payment tracking, Asaas integration monitoring, revenue analytics, and reconciliation tools.

**User Stories:**
- As an Operations Admin, I need to see daily payment success rates so I can identify processing issues early
- As a Support Manager, I need to refund failed payments so I can resolve billing disputes
- As an Operations Admin, I need to monitor Asaas webhook delivery so I can detect integration failures
- As a CFO, I need to export monthly revenue reports so I can perform financial analysis
- As an Operations Admin, I need to retry failed payment charges so I can recover revenue

**Functional Requirements:**

1. **Payment Dashboard:**
   - **Key Metrics (Real-time):**
     - Today's revenue (total collected)
     - Payment success rate (confirmed / total attempts)
     - Pending payments (awaiting confirmation)
     - Overdue payments (past due date)
     - Failed payments (last 24 hours)
     - Refund requests pending

   - **Payment Status Distribution:**
     - Pie chart: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, CANCELLED
     - Trend line: daily payment volume (last 30 days)
     - Billing type breakdown: PIX vs Boleto vs Credit Card

   - **Revenue Analytics:**
     - MRR (Monthly Recurring Revenue): sum of active subscription values
     - ARR (Annual Recurring Revenue): MRR * 12
     - Churn rate: cancelled subscriptions / total active
     - LTV (Lifetime Value): average revenue per subscriber
     - Payment method preferences (percentage breakdown)

2. **Payment List View:**
   - Searchable table with columns:
     - Payment ID (Asaas), User, Amount, Status, Billing Type, Due Date, Payment Date, Invoice
   - Filters:
     - Status (all statuses from `PaymentStatus` enum)
     - Billing type (PIX, Boleto, Credit Card)
     - Date range (due date, payment date, created date)
     - Amount range
   - Bulk actions:
     - Export to CSV/Excel
     - Send payment reminders
     - Process refunds (with approval workflow)

3. **Payment Detail View:**
   - **Payment Information:**
     - Asaas payment ID, customer ID, subscription ID
     - Amount, net value, original value
     - Status badge with status history timeline
     - Billing type with method-specific details (PIX QR code, Boleto URL, Card last 4)

   - **Dates:**
     - Due date, original due date
     - Payment date, confirmed date
     - Client payment date (when customer actually paid)

   - **Financial Breakdown:**
     - Original value
     - Discount value (if any)
     - Interest value (late payment)
     - Fine value (late payment penalty)
     - Net value (amount actually received)

   - **Documents:**
     - Invoice URL (view/download)
     - Bank slip URL (for Boleto)
     - Transaction receipt URL
     - PIX QR code image and payload

   - **Actions:**
     - View in Asaas dashboard (external link)
     - Send payment reminder email/WhatsApp
     - Issue refund (with reason and approval)
     - Retry charge (for failed payments)
     - Cancel payment

4. **Asaas Integration Monitor:**
   - **Webhook Health:**
     - Total webhooks received (last 24 hours)
     - Webhook processing success rate
     - Failed webhook log with retry status
     - Webhook payload inspection tool

   - **API Performance:**
     - Average API response time
     - API error rate
     - Rate limit usage (requests / limit)
     - Failed API calls log

   - **Synchronization Status:**
     - Last successful sync timestamp
     - Pending synchronization queue
     - Manual sync trigger button (for troubleshooting)

5. **Reconciliation Tools:**
   - **Payment Matching:**
     - Compare Asaas payments with local database
     - Highlight discrepancies (missing, duplicate, amount mismatch)
     - Bulk reconciliation actions

   - **Revenue Report Generator:**
     - Date range selector
     - Group by: day, week, month, plan type
     - Export formats: CSV, Excel, PDF
     - Include: gross revenue, net revenue, refunds, fees

**Data Model Integration:**
```typescript
Payment {
  // Asaas Integration
  asaasPaymentId (unique), asaasCustomerId, asaasSubscriptionId,

  // Amounts
  amount, netValue, originalValue,
  discountValue, interestValue, fineValue, refundAmount,

  // Status & Dates
  status (PaymentStatus enum), dueDate, paymentDate,
  confirmedDate, refundedDate,

  // Payment Method
  billingType, invoiceUrl, bankSlipUrl,
  pixQrCodePayload, pixQrCodeImage,

  // Metadata
  metadata (JSONB for Asaas data), deleted, anticipated
}

Subscription {
  asaasSubscriptionId, monthlyValue, nextBillingDate,
  lastPaymentId, lastPaymentDate, overdueDate, daysOverdue
}
```

**API Endpoints:**
- `GET /api/admin/payments` - Payment list with filters
- `GET /api/admin/payments/[id]` - Payment details
- `POST /api/admin/payments/[id]/refund` - Process refund
- `POST /api/admin/payments/[id]/retry` - Retry failed charge
- `POST /api/admin/payments/[id]/remind` - Send payment reminder
- `GET /api/admin/payments/analytics` - Revenue metrics
- `GET /api/admin/payments/export` - Generate CSV/Excel export
- `GET /api/admin/asaas/webhooks` - Webhook delivery log
- `GET /api/admin/asaas/health` - Integration health metrics
- `POST /api/admin/asaas/sync` - Manual synchronization
- `GET /api/admin/payments/reconciliation` - Reconciliation report

**Integration with Asaas API v3:**
- Webhook endpoints: `/api/webhooks/asaas`
- Events: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_REFUNDED
- Authentication: API key + webhook token validation
- Idempotency: Use `asaasPaymentId` to prevent duplicate records

**Acceptance Criteria:**
- [ ] Payment dashboard loads within 2 seconds with current day metrics
- [ ] Payment list supports pagination with 100 items per page
- [ ] Refund action requires reason selection and secondary confirmation
- [ ] PIX QR code displays correctly with copy-to-clipboard button
- [ ] Asaas webhook failures trigger admin alert email
- [ ] Revenue export generates Excel file within 10 seconds for 1 year of data
- [ ] Reconciliation report highlights discrepancies with suggested fixes
- [ ] Payment reminder sends via email and WhatsApp (via SendPulse)

---

### Feature 5: Order & Delivery Management

**Description:**
End-to-end order fulfillment tracking from prescription validation to delivery confirmation with carrier integration.

**User Stories:**
- As an Operations Admin, I need to see all pending orders so I can prepare shipments
- As a Support Manager, I need to update delivery status when customers report issues so information stays current
- As an Operations Admin, I need to bulk update tracking codes so I can efficiently process carrier pickups
- As a Customer, I need tracking updates sent automatically via WhatsApp so I know when lenses arrive (automated, not admin dashboard)
- As an Operations Admin, I need to see delivery failure reasons so I can retry shipments

**Functional Requirements:**

1. **Order Pipeline Dashboard:**
   - **Kanban Board View:**
     - Columns: PENDING, SHIPPED, IN_TRANSIT, DELIVERED, CANCELLED
     - Drag-and-drop to update status
     - Order count badges on columns
     - Color coding by urgency (overdue orders in red)

   - **List View (Alternative):**
     - Table with columns: Order ID, Customer, Products, Order Date, Shipping Date, Status, Tracking
     - Filters: status, date range, subscription plan
     - Search: customer name, order ID, tracking code

2. **Order Detail View:**
   - **Order Information:**
     - Order ID, type (subscription, one-time), order date
     - Customer details (name, phone, subscription)
     - Delivery address (formatted, Google Maps link)

   - **Products:**
     - Lens type, quantity, prescription details
     - Product metadata (OD/OS specifications)

   - **Delivery Tracking:**
     - Current status with timestamp
     - Shipping carrier and method
     - Tracking code with carrier link
     - Estimated delivery date
     - Actual delivery date (when DELIVERED)

   - **Status History Timeline:**
     - Visual timeline of status changes
     - Timestamps and user who made changes
     - Notes attached to status updates

   - **Actions:**
     - Update status (dropdown with confirmation)
     - Add tracking code
     - Update estimated delivery
     - Add delivery notes
     - Cancel order (with reason)
     - Resend shipping confirmation (email/WhatsApp)

3. **Bulk Operations:**
   - Select multiple orders
   - Bulk status update (e.g., PENDING → SHIPPED)
   - Bulk tracking code upload (CSV import)
   - Bulk shipping label generation
   - Export selected orders to CSV

4. **Delivery Analytics:**
   - **Performance Metrics:**
     - Average delivery time (shipped → delivered)
     - On-time delivery rate (vs estimated date)
     - Delivery failure rate
     - Customer satisfaction scores (if available)

   - **Geographic Distribution:**
     - Delivery heatmap by city/state
     - Average delivery times by region
     - Identify problem areas

**Data Model Integration:**
```typescript
Order {
  id, subscriptionId,
  type (subscription | one_time),
  orderDate, shippingDate,
  deliveryStatus (DeliveryStatus enum),
  trackingCode, estimatedDelivery, deliveredAt,
  deliveryAddress (JSONB),
  products (JSONB), // Array of product details
  totalAmount, paymentStatus,
  notes
}

Subscription {
  orders: Order[] // Relationship
}
```

**API Endpoints:**
- `GET /api/admin/orders` - Order list with filters
- `GET /api/admin/orders/[id]` - Order details
- `PATCH /api/admin/orders/[id]` - Update order
- `POST /api/admin/orders/[id]/tracking` - Add tracking code
- `POST /api/admin/orders/[id]/cancel` - Cancel order
- `POST /api/admin/orders/bulk` - Bulk operations
- `POST /api/admin/orders/import-tracking` - CSV import tracking codes
- `GET /api/admin/orders/analytics` - Delivery metrics

**Integration Requirements:**
- Carrier API integration for real-time tracking (Correios, Loggi, etc.)
- Automated WhatsApp notifications via SendPulse on status changes
- Email notifications via Resend API
- Google Maps API for address validation and mapping

**Acceptance Criteria:**
- [ ] Kanban board allows drag-and-drop status updates with confirmation
- [ ] Tracking code update sends automated WhatsApp notification within 1 minute
- [ ] Bulk CSV import processes 500 tracking codes within 30 seconds
- [ ] Order timeline shows all status changes with timestamps and user
- [ ] Delivery analytics dashboard updates daily with previous day data
- [ ] Cancelled orders display cancellation reason
- [ ] Order detail view loads within 1 second

---

### Feature 6: LGPD Compliance Dashboard

**Description:**
Data protection management interface for consent tracking, data request processing, audit trails, and regulatory compliance monitoring.

**User Stories:**
- As a LGPD Officer, I need to process data access requests within 15 days so I comply with legal requirements
- As a LGPD Officer, I need to audit all consent logs so I can verify data processing legality
- As a LGPD Officer, I need to export user data for portability requests so I fulfill LGPD Article 18
- As a Medical Admin, I need to monitor medical data consent status so I ensure patient authorization
- As a LGPD Officer, I need to generate compliance reports for regulatory audits so I demonstrate LGPD adherence

**Functional Requirements:**

1. **Data Request Management:**
   - **Request Queue:**
     - Table columns: Request ID, Type, Email, Name, Status, Requested Date, Deadline
     - Types: ACCESS, RECTIFICATION, DELETION, PORTABILITY, OPPOSITION
     - Status: PENDING, PROCESSING, COMPLETED, REJECTED
     - SLA indicator: 15-day legal deadline with countdown
     - Filters: type, status, date range

   - **Request Detail View:**
     - **Request Information:**
       - Request type, email, name
       - Requested date, completed date
       - IP address, user agent (audit trail)
       - Reason (if provided)

     - **User Data Preview:**
       - Aggregated data from all tables (User, Subscription, Payment, Order, SupportTicket, etc.)
       - Anonymized preview (mask sensitive fields)
       - Data categories: Personal, Medical, Financial, Communication

     - **Actions:**
       - Approve Request (with confirmation)
       - Reject Request (requires reason)
       - Export Data (JSON, CSV, PDF formats)
       - Schedule Deletion (for deletion requests)
       - Send Notification (email to requester)

   - **Data Export Generator:**
     - Aggregate user data across all models
     - Format options: JSON (technical), PDF (readable), CSV (tabular)
     - Include data dictionary explaining fields
     - Encrypt exports (password-protected ZIP)
     - Delivery via secure email link (expires in 48 hours)

2. **Consent Management:**
   - **Consent Log Viewer:**
     - Table: User ID, Email, Consent Type, Status, Timestamp, Expiration, IP Address
     - Consent types: TERMS, DATA_PROCESSING, MARKETING, MEDICAL_DATA
     - Status: GRANTED, REVOKED, EXPIRED
     - Filters: consent type, status, expiration date
     - Search: email, user ID

   - **Consent Detail:**
     - Full consent metadata from `ConsentLog` model
     - User agent and IP address (proof of consent)
     - Timestamp with timezone
     - Expiration date (if applicable)
     - Version of terms/policy consented to

   - **Consent Analytics:**
     - Consent grant rate by type
     - Revocation rate trends
     - Expired consents requiring renewal
     - Missing consents (users without required consent)

3. **Audit Trail Explorer:**
   - **Activity Log:**
     - All admin actions logged with timestamps
     - Columns: User, Action, Resource, Timestamp, IP Address, Changes
     - Actions: VIEW, CREATE, UPDATE, DELETE
     - Resources: User data, Subscription, Payment, Medical records
     - Changes: JSON diff of old vs new values

   - **Search & Filter:**
     - Date range (with presets: today, last 7 days, last 30 days)
     - User (admin who performed action)
     - Action type
     - Resource type
     - Full-text search on changes

   - **Export Audit Logs:**
     - CSV export for external compliance tools
     - Date range selector
     - Include/exclude action types

4. **Compliance Reports:**
   - **LGPD Compliance Score:**
     - Overall compliance percentage (0-100%)
     - Breakdown by category:
       - Consent management (valid consents / total users)
       - Data request processing (processed within SLA / total requests)
       - Audit trail completeness (logged actions / total actions)
       - Data retention compliance (expired data deleted)

   - **Regulatory Report Generator:**
     - Preset reports: Monthly Compliance Summary, Annual Audit Report
     - Custom date ranges
     - Include: consent logs, data requests, audit trails, violations
     - Export to PDF for regulatory submission

5. **Data Retention Policy Enforcement:**
   - **Retention Rules Dashboard:**
     - Define retention periods by data type (e.g., inactive user data = 5 years)
     - View data eligible for deletion
     - Schedule automated deletion jobs

   - **Deletion Queue:**
     - Users marked for deletion (after retention period)
     - Preview before deletion (what will be removed)
     - Execute deletion with confirmation
     - Deletion confirmation email to user (if email still valid)

**Data Model Integration:**
```typescript
ConsentLog {
  userId, email, consentType (ConsentType enum),
  status (ConsentStatus enum),
  ipAddress, userAgent, timestamp,
  expiresAt, metadata (JSONB for version tracking)
}

DataRequest {
  email, name, requestType (DataRequestType enum),
  status (DataRequestStatus enum),
  reason, requestedAt, completedAt,
  ipAddress, userAgent, metadata (JSONB)
}

// Audit Trail (new model needed)
AuditLog {
  userId (admin), action, resourceType, resourceId,
  changes (JSONB: old/new values), ipAddress,
  userAgent, timestamp
}
```

**API Endpoints:**
- `GET /api/admin/lgpd/requests` - Data request list
- `GET /api/admin/lgpd/requests/[id]` - Request details
- `POST /api/admin/lgpd/requests/[id]/approve` - Approve request
- `POST /api/admin/lgpd/requests/[id]/reject` - Reject request
- `GET /api/admin/lgpd/requests/[id]/export` - Export user data
- `GET /api/admin/lgpd/consents` - Consent log list
- `GET /api/admin/lgpd/consents/[id]` - Consent details
- `GET /api/admin/lgpd/audit` - Audit log list
- `GET /api/admin/lgpd/reports/compliance` - Compliance score
- `POST /api/admin/lgpd/reports/generate` - Generate report
- `GET /api/admin/lgpd/retention` - Retention policy dashboard
- `POST /api/admin/lgpd/retention/delete` - Execute scheduled deletion

**Privacy & Security:**
- All LGPD dashboard views logged to audit trail
- Sensitive data masked in previews (show last 4 digits only)
- Data exports encrypted with user-provided password
- Export links expire after 48 hours
- IP address logging for all LGPD-related actions

**Acceptance Criteria:**
- [ ] Data request queue shows SLA countdown with visual urgency indicators
- [ ] User data export includes all data from User, Subscription, Payment, Order, SupportTicket, WhatsApp models
- [ ] Consent log displays all consent types with expiration warnings (30 days before expiry)
- [ ] Audit trail logs every admin action with IP address and JSON diff
- [ ] Compliance score calculates in real-time based on current data
- [ ] Data deletion physically removes records from database (not just soft delete)
- [ ] LGPD Officer receives email alert when new data request submitted
- [ ] Rejected data requests require reason selection from dropdown

---

### Feature 7: System Health & Monitoring

**Description:**
Real-time infrastructure monitoring, integration health checks, error tracking, and performance analytics for proactive issue detection.

**User Stories:**
- As a System Admin, I need to see database response times so I can detect performance degradation early
- As a System Admin, I need to monitor Asaas webhook delivery so I can fix integration issues before customers complain
- As a System Admin, I need to view error logs so I can debug production issues quickly
- As a System Admin, I need alerts when API error rate exceeds 5% so I can respond to outages
- As a System Admin, I need to see SendPulse WhatsApp message delivery rate so I can ensure customer notifications work

**Functional Requirements:**

1. **System Overview Dashboard:**
   - **Infrastructure Health:**
     - Database: status (healthy/degraded/down), response time, connection pool usage
     - API: uptime percentage, average response time, error rate
     - Next.js: server uptime, memory usage, CPU usage
     - Nginx: request rate, error rate, SSL certificate expiry

   - **Service Status Indicators:**
     - Green: healthy (all metrics normal)
     - Yellow: degraded (warnings but operational)
     - Red: down (critical failure)
     - Blinking red: critical alert requiring immediate action

2. **Integration Monitoring:**
   - **Asaas Payment Gateway:**
     - Connection status (API reachable)
     - Webhook delivery success rate (last 24 hours)
     - Failed webhook log with retry attempts
     - API rate limit usage (requests / daily limit)
     - Average API response time
     - Last successful payment processed

   - **SendPulse WhatsApp:**
     - Bot status (online/offline)
     - Message delivery rate (sent vs delivered)
     - Failed messages log
     - API quota usage
     - Average message delivery time
     - Last successful message sent

   - **Firebase Authentication:**
     - Auth service status
     - Active sessions count
     - Failed login attempts (last hour)
     - Token refresh success rate

3. **Error Tracking:**
   - **Error Log Viewer:**
     - Real-time error stream
     - Columns: Timestamp, Severity, Error Type, Message, Stack Trace, User, Endpoint
     - Severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
     - Filters: severity, date range, endpoint, error type
     - Full-text search on error messages

   - **Error Aggregation:**
     - Group similar errors (same stack trace)
     - Show occurrence count and first/last seen
     - Trending errors (increasing frequency)

   - **Error Detail View:**
     - Full stack trace with syntax highlighting
     - Request context (URL, method, headers, body)
     - User context (ID, email, IP address)
     - Environment (production, development)
     - Related errors (similar stack traces)

4. **Performance Monitoring:**
   - **API Endpoint Performance:**
     - Table: Endpoint, Method, Avg Response Time, P95, P99, Request Count, Error Rate
     - Sortable by any column
     - Highlight slow endpoints (>1s average)

   - **Database Query Analytics:**
     - Slow query log (queries >500ms)
     - Most frequent queries
     - Query execution plans

   - **Frontend Performance:**
     - Core Web Vitals: LCP, FID, CLS
     - Page load times by route
     - JavaScript error rate

5. **Alerts & Notifications:**
   - **Alert Rules:**
     - Database response time >500ms for 5 minutes
     - API error rate >5% for 10 minutes
     - Asaas webhook failure rate >10%
     - Disk space <10% free
     - Memory usage >90%

   - **Alert Channels:**
     - Email to system admin
     - WhatsApp to on-call engineer
     - In-dashboard notification banner

   - **Alert History:**
     - Table of fired alerts with resolution status
     - Acknowledgment tracking (who acknowledged, when)
     - Auto-resolve when condition clears

6. **Feature Flag Dashboard (Existing - Reference):**
   - Link to existing `/admin/feature-flags` page
   - Quick summary widget in system health dashboard
   - Active flags count
   - Recently toggled flags

**Data Model Integration:**
```typescript
// Existing monitoring endpoint: /api/admin/system-health
SystemHealthMetrics {
  database: { status, responseTime, error },
  notifications: { backupSystem, failedNotifications },
  history: { backupSystem, totalRecords },
  system: { nodeVersion, platform, uptime }
}

// New model for alerts
SystemAlert {
  id, alertType, severity, message,
  triggeredAt, resolvedAt, acknowledgedBy,
  metadata (JSONB)
}

// Error logging (integrate with existing /api/monitoring/errors)
ErrorLog {
  id, timestamp, severity, errorType,
  message, stackTrace, endpoint, userId,
  ipAddress, userAgent, metadata (JSONB)
}
```

**API Endpoints:**
- `GET /api/admin/system-health` - System health metrics (existing)
- `GET /api/admin/monitoring/performance` - Performance metrics (existing)
- `GET /api/admin/monitoring/errors` - Error logs (existing)
- `GET /api/admin/monitoring/alerts` - Alert history (existing)
- `GET /api/admin/integrations/asaas/health` - Asaas health check
- `GET /api/admin/integrations/sendpulse/health` - SendPulse health (existing: `/api/admin/sendpulse-health`)
- `GET /api/admin/integrations/firebase/health` - Firebase health check
- `POST /api/admin/monitoring/alerts/acknowledge` - Acknowledge alert
- `GET /api/admin/monitoring/performance/endpoints` - Endpoint performance

**Integration with Existing Monitoring:**
- Reuse existing `/api/monitoring/*` endpoints
- Extend `/api/admin/system-health` with integration checks
- Leverage existing `/api/admin/sendpulse-health` and `/api/admin/sendpulse-troubleshoot`

**Acceptance Criteria:**
- [ ] System health dashboard loads within 1 second
- [ ] All integration health checks complete within 5 seconds
- [ ] Error logs update in real-time (WebSocket or 10s polling)
- [ ] Alerts trigger within 30 seconds of condition threshold breach
- [ ] Alert emails sent within 1 minute of alert firing
- [ ] Performance metrics show data from last 7 days with hourly granularity
- [ ] Database query log identifies queries >500ms with full execution plan
- [ ] Integration health shows last successful API call timestamp

---

### Feature 8: User & Role Management

**Description:**
Admin user management, role-based access control (RBAC), permission assignment, and activity auditing.

**User Stories:**
- As a System Admin, I need to create admin accounts with specific roles so I can grant appropriate access
- As a System Admin, I need to deactivate compromised admin accounts immediately so I can prevent unauthorized access
- As a Medical Admin, I need to audit which staff accessed patient data so I can ensure LGPD compliance
- As a System Admin, I need to reset admin passwords so I can help locked-out staff
- As a LGPD Officer, I need to see all admin actions on sensitive data so I can generate compliance reports

**Functional Requirements:**

1. **Admin User List:**
   - Table columns: Name, Email, Role, Status, Last Login, Created Date
   - Roles: Medical Admin, Support Manager, Operations Admin, System Admin, LGPD Officer
   - Status: Active, Inactive, Suspended
   - Filters: role, status, last login date
   - Search: name, email

2. **Admin User Detail:**
   - **Profile Information:**
     - Name, email, role badge
     - Status indicator (active/inactive/suspended)
     - Created date, last login date
     - Login history (last 10 logins with IP addresses)

   - **Permissions:**
     - Read-only view of role-based permissions
     - Granular permissions checklist (view, create, edit, delete per resource)

   - **Activity Log:**
     - Recent actions by this admin (last 50)
     - Filterable by action type and date

   - **Actions:**
     - Edit profile (name, email)
     - Change role (requires System Admin approval)
     - Suspend/Reactivate account
     - Reset password (sends email to admin)
     - View full audit trail

3. **Role Management:**
   - **Predefined Roles:**
     - **Medical Admin:** Full access to medical data, prescription validation, emergency tickets, LGPD consents
     - **Support Manager:** Full access to tickets, WhatsApp, FAQs, limited subscription editing
     - **Operations Admin:** Full CRUD on subscriptions, orders, payments, delivery tracking
     - **System Admin:** Full system access including infrastructure, feature flags, user management
     - **LGPD Officer:** Full LGPD dashboard access, data requests, consents, audit logs

   - **Permission Matrix:**
     - Table showing role vs resource permissions
     - Resources: Subscriptions, Payments, Orders, Tickets, Users, Settings, etc.
     - Permissions: View, Create, Edit, Delete
     - Read-only display (no custom roles in MVP)

4. **Access Control Enforcement:**
   - **API Middleware:**
     - Check user role before processing admin API requests
     - Return 403 Forbidden if insufficient permissions
     - Log all permission denials to audit trail

   - **UI Enforcement:**
     - Hide menu items for unauthorized features
     - Disable action buttons for insufficient permissions
     - Show "Insufficient Permissions" message on unauthorized pages

5. **Admin Invitation System:**
   - **Invite Flow:**
     - System Admin enters email and selects role
     - System generates secure invitation token (expires in 7 days)
     - Invitation email sent with setup link
     - New admin clicks link, sets password, activates account

   - **Invitation Tracking:**
     - List pending invitations with expiry dates
     - Resend invitation email
     - Cancel pending invitation

**Data Model Integration:**
```typescript
// Extend existing User model with admin roles
User {
  role: 'subscriber' | 'support_manager' | 'operations_admin' |
        'medical_admin' | 'system_admin' | 'lgpd_officer'
}

// New model for admin invitations
AdminInvitation {
  id, email, role, token, invitedBy,
  createdAt, expiresAt, acceptedAt, status
}

// Audit trail model
AuditLog {
  userId, action, resource, resourceId,
  changes (JSONB), ipAddress, timestamp
}
```

**API Endpoints:**
- `GET /api/admin/users` - Admin user list
- `GET /api/admin/users/[id]` - Admin user details
- `POST /api/admin/users` - Create admin user
- `PATCH /api/admin/users/[id]` - Update admin user
- `POST /api/admin/users/[id]/suspend` - Suspend admin
- `POST /api/admin/users/[id]/reset-password` - Reset password
- `GET /api/admin/roles` - List roles and permissions
- `POST /api/admin/invitations` - Send admin invitation
- `GET /api/admin/invitations` - List pending invitations
- `DELETE /api/admin/invitations/[id]` - Cancel invitation

**Security Requirements:**
- Password requirements: min 12 chars, uppercase, lowercase, number, special char
- Two-factor authentication (2FA) required for Medical Admin and System Admin roles
- Session timeout: 30 minutes of inactivity
- Password reset requires email verification
- Account lockout after 5 failed login attempts (15-minute cooldown)

**Acceptance Criteria:**
- [ ] Only System Admin can create/edit admin users
- [ ] Role change requires secondary confirmation dialog
- [ ] Suspended admin cannot login (receives "Account suspended" message)
- [ ] Password reset email contains secure one-time link (expires in 1 hour)
- [ ] Admin invitation expires after 7 days
- [ ] All admin actions logged to audit trail with timestamp and IP
- [ ] Permission denied actions show clear error message explaining required role

---

## UI/UX Guidelines

### Design System

**Color Palette:**
- Primary: Cyan (`#06b6d4`) - Actions, links, CTAs
- Secondary: Silver (`#64748b`) - Secondary actions, borders
- Success: Green (`#22c55e`) - Successful states, confirmations
- Warning: Amber (`#f59e0b`) - Warnings, pending states
- Error: Red (`#ef4444`) - Errors, critical alerts, destructive actions
- Medical: Professional gray (`#475569`) - Medical oversight sections

**Typography:**
- Headings: Poppins (600 weight for titles, 500 for subtitles)
- Body: Inter (400 regular, 500 medium, 600 semibold)
- Monospace: Fira Code (code snippets, IDs, technical data)

**Component Library:**
- Reuse existing shadcn/ui components from `/src/components/ui/`
- Extend with custom admin-specific components
- Maintain consistency with subscriber dashboard styling

### Layout Structure

**Navigation:**
- Side navigation bar (fixed left, 240px width)
- Collapsible to icons-only mode (64px width)
- Top navigation bar (64px height) with user profile, notifications, global search
- Breadcrumb navigation below top bar

**Page Structure:**
```
┌─────────────────────────────────────────────────┐
│ Top Bar: Logo | Breadcrumbs | Search | Profile │ 64px
├──────┬──────────────────────────────────────────┤
│      │                                          │
│ Side │         Page Content                     │
│ Nav  │         - Page Title                     │
│ 240px│         - Filters/Actions Toolbar       │
│      │         - Main Content Area              │
│      │         - Data Tables/Cards/Forms        │
│      │                                          │
└──────┴──────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Desktop: 1920x1080 (primary)
- Laptop: 1366x768 (minimum supported)
- Tablet: Navigation collapses to drawer
- Mobile: Admin dashboard not optimized for mobile (require desktop access)

### Navigation Structure

**Main Menu:**
1. **Dashboard** (home icon)
2. **Subscriptions** (package icon)
   - Active Subscriptions
   - Overdue Payments
   - Paused Subscriptions
   - Cancelled Subscriptions
3. **Support** (headset icon)
   - Ticket Queue
   - WhatsApp Monitoring
   - AI Analytics
   - Knowledge Base
4. **Financial** (dollar icon)
   - Payments
   - Revenue Analytics
   - Asaas Integration
   - Reconciliation
5. **Orders** (truck icon)
   - Order Pipeline
   - Delivery Tracking
   - Analytics
6. **LGPD** (shield icon) - Only visible to LGPD Officer and System Admin
   - Data Requests
   - Consent Management
   - Audit Trail
   - Compliance Reports
7. **System** (settings icon) - Only visible to System Admin
   - Health Monitoring
   - Integrations
   - Feature Flags
   - Error Logs
8. **Users** (users icon) - Only visible to System Admin
   - Admin Users
   - Role Management
   - Invitations

### Interaction Patterns

**Data Tables:**
- Sortable columns (click header to toggle sort direction)
- Filterable columns (filter icon in header opens filter dropdown)
- Searchable (global search bar filters all visible columns)
- Pagination: "Load More" button or infinite scroll (configurable)
- Row actions: kebab menu (3 dots) on right side of each row
- Bulk selection: checkbox column on left, bulk action toolbar appears at top

**Forms:**
- Inline validation (on blur for inputs, on change for selects)
- Clear error messages below fields
- Required fields marked with asterisk (*)
- Save and Cancel buttons at bottom right
- Unsaved changes warning when navigating away

**Modals:**
- Centered overlay with backdrop blur
- Close button (X) at top right
- Actions at bottom right (Cancel left, Primary action right)
- Escape key to close (except for critical confirmations)

**Confirmations:**
- Destructive actions (delete, cancel, suspend) require confirmation dialog
- Confirmation shows summary of action and impact
- Require typing confirmation phrase for critical actions (e.g., type "DELETE" to confirm deletion)

**Loading States:**
- Skeleton loaders for content-heavy sections
- Spinner for quick actions (<1s)
- Progress bars for batch operations
- "Loading..." text with animation

**Empty States:**
- Friendly message explaining why no data
- CTA to create first item (if applicable)
- Illustration or icon

**Error States:**
- Error message with clear description
- Suggested action to resolve
- Retry button (if applicable)
- Contact support link

### Accessibility

**WCAG 2.1 AA Compliance:**
- Color contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text
- Keyboard navigation support (Tab, Enter, Escape, Arrow keys)
- Focus indicators clearly visible (2px cyan outline)
- Screen reader support (ARIA labels on all interactive elements)
- Alt text for all images and icons

**Keyboard Shortcuts:**
- `Ctrl+K` or `Cmd+K`: Open global search
- `Ctrl+S` or `Cmd+S`: Save form (if applicable)
- `Esc`: Close modal or cancel action
- `/`: Focus search input

### Performance Guidelines

**Load Time Targets:**
- Initial page load: <2 seconds
- Page navigation: <500ms
- Search results: <300ms
- Filter application: <200ms

**Optimization Strategies:**
- Server-side rendering (SSR) for initial page load
- Client-side caching with React Query
- Pagination for large datasets (limit 100 items per page)
- Lazy loading for modals and secondary views
- Debounced search (300ms delay)
- Virtual scrolling for very large lists (>500 items)

---

## Technical Requirements

### Technology Stack

**Frontend:**
- Framework: Next.js 15 with App Router
- Language: TypeScript
- UI Library: React 19
- Styling: Tailwind CSS v4
- Component Library: shadcn/ui (Radix UI primitives)
- State Management: React Context + React Query
- Forms: React Hook Form + Zod validation
- Charts: Recharts or Chart.js
- Tables: TanStack Table (React Table v8)
- Date Handling: date-fns

**Backend:**
- API Routes: Next.js API Routes
- Database: PostgreSQL
- ORM: Prisma
- Authentication: NextAuth.js (reuse existing Firebase integration)
- Session Management: NextAuth session cookies

**Integrations:**
- Payment: Asaas API v3 (existing)
- WhatsApp: SendPulse (existing)
- Email: Resend API (existing)
- AI: OpenAI + LangChain (existing)
- Analytics: Google Analytics (optional)

### Database Schema Extensions

**New Models Required:**

```typescript
// Admin invitations
model AdminInvitation {
  id              String   @id @default(cuid())
  email           String   @db.VarChar(255)
  role            String   @db.VarChar(50)
  token           String   @unique @db.VarChar(255)
  invitedBy       String   @map("invited_by")
  status          String   @default("pending") // pending, accepted, expired
  createdAt       DateTime @default(now()) @map("created_at")
  expiresAt       DateTime @map("expires_at")
  acceptedAt      DateTime? @map("accepted_at")

  @@index([email], name: "idx_admin_invitations_email")
  @@index([token], name: "idx_admin_invitations_token")
  @@map("admin_invitations")
}

// Audit log for all admin actions
model AuditLog {
  id              String   @id @default(cuid())
  userId          String   @map("user_id") // Admin who performed action
  action          String   @db.VarChar(50) // VIEW, CREATE, UPDATE, DELETE
  resourceType    String   @map("resource_type") @db.VarChar(50) // User, Subscription, Payment, etc.
  resourceId      String?  @map("resource_id") // ID of affected resource
  changes         Json?    @db.JsonB // Old and new values for UPDATE actions
  ipAddress       String   @map("ip_address") @db.VarChar(45)
  userAgent       String   @map("user_agent") @db.Text
  timestamp       DateTime @default(now())

  @@index([userId], name: "idx_audit_logs_user")
  @@index([resourceType], name: "idx_audit_logs_resource_type")
  @@index([timestamp], name: "idx_audit_logs_timestamp")
  @@map("audit_logs")
}

// System alerts
model SystemAlert {
  id              String   @id @default(cuid())
  alertType       String   @map("alert_type") @db.VarChar(100)
  severity        String   @db.VarChar(20) // INFO, WARNING, ERROR, CRITICAL
  message         String   @db.Text
  metadata        Json?    @db.JsonB
  triggeredAt     DateTime @default(now()) @map("triggered_at")
  resolvedAt      DateTime? @map("resolved_at")
  acknowledgedBy  String?  @map("acknowledged_by") // Admin user ID
  acknowledgedAt  DateTime? @map("acknowledged_at")

  @@index([alertType], name: "idx_system_alerts_type")
  @@index([severity], name: "idx_system_alerts_severity")
  @@index([triggeredAt], name: "idx_system_alerts_triggered")
  @@map("system_alerts")
}

// Error logs (structured logging)
model ErrorLog {
  id              String   @id @default(cuid())
  severity        String   @db.VarChar(20) // DEBUG, INFO, WARNING, ERROR, CRITICAL
  errorType       String   @map("error_type") @db.VarChar(100)
  message         String   @db.Text
  stackTrace      String?  @map("stack_trace") @db.Text
  endpoint        String?  @db.VarChar(255)
  userId          String?  @map("user_id")
  ipAddress       String?  @map("ip_address") @db.VarChar(45)
  userAgent       String?  @map("user_agent") @db.Text
  metadata        Json?    @db.JsonB
  timestamp       DateTime @default(now())

  @@index([severity], name: "idx_error_logs_severity")
  @@index([errorType], name: "idx_error_logs_type")
  @@index([timestamp], name: "idx_error_logs_timestamp")
  @@map("error_logs")
}
```

**Schema Modifications to Existing Models:**

```typescript
// Add admin role tracking to User model
model User {
  // ... existing fields ...
  role: 'subscriber' | 'support_manager' | 'operations_admin' |
        'medical_admin' | 'system_admin' | 'lgpd_officer'

  // Add relation to audit logs
  auditLogs AuditLog[]
}
```

### API Architecture

**Endpoint Naming Convention:**
```
/api/admin/<resource>/<action>

Examples:
GET    /api/admin/subscriptions          - List subscriptions
GET    /api/admin/subscriptions/[id]     - Get subscription details
PATCH  /api/admin/subscriptions/[id]     - Update subscription
POST   /api/admin/subscriptions/[id]/pause - Pause subscription
DELETE /api/admin/subscriptions/[id]     - Cancel subscription
```

**Standard Response Format:**
```typescript
// Success response
{
  success: true,
  data: any,
  metadata?: {
    pagination?: { page: number, total: number, hasMore: boolean },
    timestamp: string
  }
}

// Error response
{
  success: false,
  error: string,
  code?: string, // Error code for programmatic handling
  details?: any  // Additional error context
}
```

**Authentication & Authorization:**
```typescript
// Middleware: Check admin authentication
export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    throw new Error('Unauthenticated')
  }

  const adminRoles = ['support_manager', 'operations_admin', 'medical_admin', 'system_admin', 'lgpd_officer']
  if (!adminRoles.includes(session.user.role)) {
    throw new Error('Unauthorized: Admin access required')
  }

  return session.user
}

// Middleware: Check specific permission
export async function requirePermission(req: NextRequest, resource: string, action: string) {
  const user = await requireAdmin(req)

  const hasPermission = checkPermission(user.role, resource, action)
  if (!hasPermission) {
    throw new Error(`Unauthorized: Requires ${action} permission on ${resource}`)
  }

  return user
}
```

**Audit Logging:**
```typescript
export async function logAuditTrail({
  userId: string,
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE',
  resourceType: string,
  resourceId?: string,
  changes?: { old: any, new: any },
  req: NextRequest
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      changes: changes ? JSON.stringify(changes) : null,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date()
    }
  })
}
```

### Performance Optimization

**Database Query Optimization:**
- Use Prisma's `select` to fetch only needed fields
- Implement cursor-based pagination for large datasets
- Add database indexes on frequently queried columns (already defined in schema)
- Use database views for complex aggregations (revenue reports, analytics)

**Caching Strategy:**
- Redis cache for frequently accessed data (dashboard metrics, subscription counts)
- Cache TTL: 5 minutes for real-time metrics, 1 hour for analytics
- Cache invalidation on data mutations (subscription update → invalidate subscription cache)

**Frontend Optimization:**
- React Query for client-side caching and request deduplication
- Debounced search inputs (300ms delay)
- Virtual scrolling for large tables (>100 rows)
- Lazy loading for modals and off-screen content
- Code splitting by route

### Security Requirements

**Authentication:**
- Reuse existing NextAuth.js setup with Firebase
- Session-based authentication (HTTP-only cookies)
- Session timeout: 30 minutes of inactivity
- Automatic session renewal on activity

**Authorization:**
- Role-based access control (RBAC)
- Middleware checks on all admin API routes
- UI-level permission enforcement (hide unauthorized features)

**Data Protection:**
- HTTPS enforced (existing SSL certificates)
- Sensitive data encrypted at rest (database encryption)
- Passwords hashed with bcrypt (12 rounds)
- CSRF protection on state-changing requests
- Input validation with Zod schemas
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React's built-in escaping

**Rate Limiting:**
- Admin API rate limit: 1000 requests / hour per user
- Login attempts: 5 failures → 15-minute lockout
- Data export: 10 requests / hour (prevent abuse)

**Audit & Compliance:**
- All admin actions logged to `AuditLog`
- IP address tracking for LGPD compliance
- Data access logging for medical data
- Password change notifications via email

---

## Security and Compliance

### LGPD (Brazilian Data Protection Law)

**Legal Basis for Processing:**
- Medical data: Explicit consent + medical necessity (LGPD Art. 11)
- Subscription data: Contractual necessity (LGPD Art. 7, V)
- Support data: Legitimate interest (LGPD Art. 7, IX)
- Marketing: Explicit consent with opt-out (LGPD Art. 7, I)

**Data Minimization:**
- Collect only data necessary for subscription management
- Avoid collecting sensitive data not related to lens delivery
- Regularly review data retention policies

**User Rights Implementation:**
- **Right to Access:** Data export via LGPD dashboard (Art. 18, I)
- **Right to Rectification:** User profile editing + admin editing (Art. 18, III)
- **Right to Deletion:** Data deletion requests with 15-day SLA (Art. 18, VI)
- **Right to Portability:** Structured data export in JSON/CSV (Art. 18, V)
- **Right to Revoke Consent:** Consent revocation interface (Art. 18, IX)

**Data Processing Inventory:**
```
Personal Data Types:
- Identification: name, email, phone, CPF
- Address: full delivery address
- Medical: prescription details, lens specifications
- Financial: payment methods (tokenized), transaction history
- Behavioral: WhatsApp interactions, support tickets

Processing Activities:
- Subscription management (legal basis: contract)
- Payment processing (legal basis: contract)
- Lens delivery (legal basis: contract)
- Customer support (legal basis: legitimate interest)
- Marketing communications (legal basis: consent)
- Medical oversight (legal basis: consent + legal obligation)

Data Sharing:
- Asaas: Payment processing (data processor agreement required)
- SendPulse: WhatsApp messaging (data processor agreement required)
- Delivery carriers: Address for shipment (data processor agreement required)
```

**Consent Management:**
- Granular consent options (terms, data processing, marketing, medical data)
- Clear consent language (plain Portuguese, no legal jargon)
- Consent withdrawal mechanism (one-click revoke)
- Consent version tracking (changes require re-consent)
- Consent expiration: 2 years (require renewal)

**Data Retention Policies:**
- Active subscribers: retain all data
- Cancelled subscriptions: retain for 5 years (legal requirement)
- Inactive users (no activity 3 years): notify and delete after 30 days
- Support tickets: retain for 2 years
- Audit logs: retain for 5 years (LGPD compliance)

### Medical Compliance (CFM/CRM Regulations)

**Responsible Physician:**
- Dr. Philipe Saraiva Cruz, CRM-MG 69.870
- Medical responsibility statement on all patient-facing pages
- Emergency contact information prominently displayed

**Prescription Validation:**
- All lens purchases require valid prescription
- Prescription expiry monitoring (typically 1 year)
- Medical review queue for flagged prescriptions
- No lens delivery without medical authorization

**Medical Data Handling:**
- Prescription details encrypted at rest
- Access logged to audit trail with medical justification
- Only Medical Admin and Operations Admin can view prescriptions
- Prescription images stored securely (if uploaded)

**Telemedicine Compliance:**
- Online consultations follow CFM Resolution 2.314/2022
- Patient consent for remote consultations
- Medical records maintained for 20 years (CFM requirement)

**Emergency Protocols:**
- Emergency contact information on all admin pages
- Escalation path for medical emergencies detected via support
- Direct line to Dr. Philipe for urgent medical issues

### Payment Security (PCI DSS)

**Asaas Integration:**
- No credit card data stored locally (PCI DSS compliance via Asaas)
- Tokenized payment methods only
- Asaas handles all PCI DSS compliance requirements
- Payment data transmitted via HTTPS only

**Financial Data Protection:**
- Payment amounts and history encrypted at rest
- Access to payment data logged to audit trail
- Refund operations require secondary confirmation
- Financial reports anonymized for non-financial staff

---

## Success Metrics

### Operational Efficiency Metrics

**Subscription Management:**
- Time to process subscription change: Target <2 minutes (Baseline: 10 minutes manual)
- Subscription search response time: Target <500ms
- Bulk operations throughput: Target 100 subscriptions/minute

**Customer Support:**
- Average ticket resolution time: Target <24 hours (Baseline: 48 hours)
- First response time: Target <2 hours (Baseline: 4 hours)
- AI chatbot automation rate: Target 70% (manual takeover <30%)
- SLA breach rate: Target <5%

**Financial Operations:**
- Payment reconciliation time: Target <1 hour daily (Baseline: 4 hours)
- Refund processing time: Target <10 minutes (Baseline: 2 days)
- Revenue report generation time: Target <30 seconds

### System Performance Metrics

**Page Load Performance:**
- Dashboard home: <2 seconds (p95)
- Subscription list: <2 seconds for 50 items (p95)
- Search results: <500ms (p95)
- Data exports: <10 seconds for 1 year of data (p95)

**API Performance:**
- Admin API response time: <300ms average
- Database query time: <100ms average
- Integration health checks: <5 seconds total

**Availability:**
- Admin dashboard uptime: 99.5% (excluding planned maintenance)
- Database uptime: 99.9%
- Integration uptime (Asaas, SendPulse): 99% (dependent on third parties)

### Compliance Metrics

**LGPD Compliance:**
- Data request processing SLA: 100% within 15 days (legal requirement)
- Consent log completeness: 100% of users have valid consent
- Audit trail coverage: 100% of admin actions logged
- Data deletion accuracy: 100% (zero missed deletions)

**Medical Compliance:**
- Prescription validation coverage: 100% of lens orders
- Medical data access audit: 100% of accesses logged
- Emergency response time: <5 minutes (alert → medical admin notification)

### User Satisfaction Metrics

**Admin User Satisfaction:**
- System usability score: Target >80% (SUS score)
- Admin user NPS: Target >50
- Feature request fulfillment: >50% of requests addressed within 6 months

**Customer Impact (Indirect):**
- Customer support satisfaction: Target >85% (via faster resolutions)
- Payment issue resolution time: <24 hours (via improved payment tools)
- Delivery tracking accuracy: >95% (via better order management)

### Business Impact Metrics

**Revenue Protection:**
- Payment recovery rate: Target >60% of failed payments recovered
- Churn prevention: Target 20% reduction via proactive support
- Refund fraud detection: 100% of suspicious refunds flagged

**Operational Cost Reduction:**
- Manual data queries: Target 90% reduction
- Support staff time saved: Target 30% (via AI automation)
- Administrative overhead: Target 40% reduction

---

## Implementation Phases

### Phase 1: Foundation & Core Features (Weeks 1-4)

**Goals:**
- Establish admin authentication and authorization
- Build core dashboard infrastructure
- Implement subscription management (most critical)

**Deliverables:**
1. **Authentication & Authorization:**
   - Extend NextAuth with admin roles
   - Implement RBAC middleware
   - Create admin login page
   - Session management with 30-minute timeout

2. **Dashboard Layout:**
   - Side navigation component
   - Top navigation bar
   - Breadcrumb navigation
   - Role-based menu rendering

3. **Dashboard Home:**
   - Role-based widget system
   - Real-time metrics for each role
   - Quick action buttons
   - Recent activity feed

4. **Subscription Management:**
   - Subscription list view with search/filter
   - Subscription detail view
   - Plan change functionality
   - Address update functionality
   - Payment method update functionality
   - Subscription history timeline

5. **Database Schema:**
   - Create `AdminInvitation`, `AuditLog` models
   - Add admin role to `User` model
   - Database migrations

**API Endpoints Phase 1:**
- `/api/admin/auth/*` - Admin authentication
- `/api/admin/dashboard` - Dashboard metrics
- `/api/admin/subscriptions/*` - Subscription CRUD
- `/api/admin/subscriptions/[id]/pause` - Pause subscription
- `/api/admin/subscriptions/[id]/cancel` - Cancel subscription

**Acceptance Criteria:**
- [ ] Admin can login and see role-appropriate dashboard
- [ ] Subscription list loads within 2 seconds with 50 items
- [ ] Subscription changes create audit trail entries
- [ ] All subscription actions require appropriate role permissions

---

### Phase 2: Support & Financial Management (Weeks 5-8)

**Goals:**
- Enable comprehensive customer support management
- Implement financial oversight and payment tools
- Integrate WhatsApp chatbot monitoring

**Deliverables:**
1. **Customer Support Dashboard:**
   - Ticket queue with SLA tracking
   - Ticket detail view with conversation thread
   - Ticket assignment and escalation
   - WhatsApp conversation monitor
   - Manual chatbot takeover
   - AI performance analytics

2. **Financial Dashboard:**
   - Payment list view with search/filter
   - Payment detail view with full history
   - Refund processing workflow
   - Revenue analytics and metrics
   - Asaas integration health monitor
   - Payment reconciliation tools

3. **Knowledge Base Management:**
   - FAQ CRUD interface
   - Template manager
   - AI response preview

**API Endpoints Phase 2:**
- `/api/admin/support/tickets/*` - Ticket management
- `/api/admin/support/whatsapp/*` - WhatsApp monitoring
- `/api/admin/support/faqs/*` - Knowledge base
- `/api/admin/payments/*` - Payment management
- `/api/admin/payments/[id]/refund` - Refund processing
- `/api/admin/asaas/*` - Asaas integration monitoring

**Acceptance Criteria:**
- [ ] Ticket list shows SLA countdown with visual urgency
- [ ] WhatsApp takeover disables AI within 5 seconds
- [ ] Payment refund requires reason and secondary confirmation
- [ ] Asaas webhook failures trigger admin alerts
- [ ] AI performance dashboard shows 30-day metrics

---

### Phase 3: Order Management & LGPD Compliance (Weeks 9-12)

**Goals:**
- Complete order fulfillment tracking
- Implement LGPD compliance tools
- Enable data request processing

**Deliverables:**
1. **Order Management:**
   - Order pipeline kanban board
   - Order detail view with tracking
   - Bulk tracking code import
   - Delivery analytics
   - Carrier integration (if available)

2. **LGPD Compliance Dashboard:**
   - Data request queue with SLA tracking
   - User data export generator (JSON, CSV, PDF)
   - Consent log viewer and analytics
   - Audit trail explorer
   - Compliance reports
   - Data retention policy enforcement

3. **Audit Trail System:**
   - Automatic logging of all admin actions
   - Changes tracking (old vs new values)
   - IP address and user agent logging
   - Search and filter interface

**API Endpoints Phase 3:**
- `/api/admin/orders/*` - Order management
- `/api/admin/orders/bulk` - Bulk operations
- `/api/admin/lgpd/requests/*` - Data request processing
- `/api/admin/lgpd/consents/*` - Consent management
- `/api/admin/lgpd/audit/*` - Audit trail
- `/api/admin/lgpd/reports/*` - Compliance reporting

**Acceptance Criteria:**
- [ ] Order status updates send automatic WhatsApp notifications
- [ ] Data export includes all user data from all models
- [ ] Data deletion physically removes records from database
- [ ] Audit trail logs every admin action with IP and timestamp
- [ ] LGPD Officer receives email when new data request submitted

---

### Phase 4: System Monitoring & Admin Management (Weeks 13-16)

**Goals:**
- Implement comprehensive system health monitoring
- Enable admin user management
- Complete feature parity with requirements

**Deliverables:**
1. **System Health Dashboard:**
   - Infrastructure health overview
   - Integration monitoring (Asaas, SendPulse, Firebase)
   - Error log viewer
   - Performance metrics
   - Alert management

2. **User & Role Management:**
   - Admin user list and detail views
   - Role assignment and permission display
   - Admin invitation system
   - Password reset workflow
   - Admin activity audit

3. **Error Tracking:**
   - Real-time error stream
   - Error aggregation and grouping
   - Stack trace viewer
   - Error detail with request context

4. **Integration Enhancements:**
   - Asaas API health dashboard
   - SendPulse message delivery tracking
   - Firebase auth monitoring
   - Webhook delivery logs

**API Endpoints Phase 4:**
- `/api/admin/system-health` - System metrics (extend existing)
- `/api/admin/monitoring/*` - Error logs and performance (extend existing)
- `/api/admin/integrations/*` - Integration health checks
- `/api/admin/users/*` - Admin user management
- `/api/admin/invitations/*` - Admin invitations

**Acceptance Criteria:**
- [ ] System health dashboard loads within 1 second
- [ ] Error logs update in real-time
- [ ] Alerts trigger within 30 seconds of threshold breach
- [ ] Admin invitation sends secure email with 7-day expiry
- [ ] All integration health checks complete within 5 seconds

---

### Phase 5: Polish, Testing & Launch Preparation (Weeks 17-20)

**Goals:**
- Complete end-to-end testing
- Performance optimization
- Security audit and penetration testing
- User training and documentation

**Deliverables:**
1. **Testing:**
   - Unit tests for critical business logic (>80% coverage)
   - Integration tests for API endpoints
   - End-to-end tests for key workflows (subscription management, support tickets, LGPD requests)
   - Load testing for performance validation
   - Security penetration testing

2. **Documentation:**
   - Admin user guide with screenshots
   - API documentation for developers
   - Security and compliance documentation
   - Disaster recovery procedures
   - Incident response playbook

3. **Training:**
   - Training sessions for each admin role
   - Video tutorials for common workflows
   - Knowledge base articles
   - FAQ for admin users

4. **Performance Optimization:**
   - Database query optimization
   - Frontend bundle size reduction
   - Caching strategy implementation
   - CDN configuration for static assets

5. **Security Hardening:**
   - Security audit findings remediation
   - Penetration testing findings resolution
   - Rate limiting configuration
   - DDoS protection setup

**Launch Checklist:**
- [ ] All critical features tested and working
- [ ] Load testing confirms performance targets
- [ ] Security audit passed with no critical findings
- [ ] Admin users trained on their respective roles
- [ ] Documentation complete and accessible
- [ ] Backup and disaster recovery tested
- [ ] Monitoring and alerting configured
- [ ] LGPD compliance verified by legal team
- [ ] Medical admin approval obtained
- [ ] Production deployment plan reviewed

---

### Post-Launch Roadmap (Beyond 20 Weeks)

**Phase 6: Advanced Analytics (Months 5-6):**
- Predictive churn analytics
- Customer lifetime value modeling
- Subscription health scoring
- Revenue forecasting
- Cohort analysis

**Phase 7: Automation & AI Enhancements (Months 6-8):**
- Automated payment retry strategies
- AI-powered support ticket categorization
- Predictive delivery delays
- Automated fraud detection
- Smart escalation rules

**Phase 8: Advanced Integrations (Months 8-10):**
- ERP integration (if needed)
- Accounting software integration (e.g., ContaAzul)
- CRM integration (e.g., RD Station)
- BI tools integration (e.g., Metabase, Google Data Studio)
- SMS provider integration for notifications

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: Performance Degradation with Large Datasets**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:**
  - Implement database indexing on all queried columns
  - Use cursor-based pagination for large datasets
  - Implement Redis caching for frequently accessed data
  - Load testing with realistic data volumes (100K users, 1M payments)
  - Performance monitoring with alerts on slow queries

**Risk 2: Third-Party Integration Failures (Asaas, SendPulse)**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:**
  - Implement retry logic with exponential backoff
  - Queue-based webhook processing (prevent data loss)
  - Manual sync capabilities for troubleshooting
  - Real-time integration health monitoring
  - Alerting on integration failures

**Risk 3: Security Vulnerabilities**
- **Likelihood:** Low
- **Impact:** Critical
- **Mitigation:**
  - Security audit before launch
  - Penetration testing by third-party
  - OWASP Top 10 vulnerability scanning
  - Regular dependency updates
  - Security monitoring and logging

### Compliance Risks

**Risk 4: LGPD Non-Compliance**
- **Likelihood:** Low
- **Impact:** Critical (legal penalties)
- **Mitigation:**
  - Legal review of data processing practices
  - Complete audit trail implementation
  - Data deletion verification testing
  - Regular compliance audits
  - LGPD officer involvement throughout development

**Risk 5: Medical Compliance Violations (CFM/CRM)**
- **Likelihood:** Low
- **Impact:** Critical (license revocation)
- **Mitigation:**
  - Dr. Philipe involvement in medical features
  - Prescription validation enforcement
  - Medical data access restrictions
  - Emergency protocol implementation
  - Regular medical compliance audits

### Operational Risks

**Risk 6: User Adoption Challenges**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Comprehensive user training
  - Intuitive UI/UX design
  - In-app help and tooltips
  - Video tutorials
  - Dedicated support during rollout

**Risk 7: Data Migration Issues**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Thorough testing of database migrations
  - Backup before each migration
  - Rollback procedures documented
  - Staging environment testing
  - Data validation post-migration

**Risk 8: System Downtime During Launch**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Phased rollout (start with System Admin role only)
  - Blue-green deployment strategy
  - Comprehensive monitoring during launch
  - Rollback plan ready
  - Launch during low-traffic period

---

## Appendices

### Appendix A: Role-Permission Matrix

| Resource | Medical Admin | Support Manager | Operations Admin | System Admin | LGPD Officer |
|----------|---------------|-----------------|------------------|--------------|--------------|
| **Dashboard** | View (medical metrics) | View (support metrics) | View (ops metrics) | View (system metrics) | View (compliance metrics) |
| **Subscriptions** | View | View, Edit (address, payment) | Full CRUD | Full CRUD | View (audit only) |
| **Payments** | View | View | Full CRUD, Refund | Full CRUD | View (audit only) |
| **Orders** | View | View, Edit (status) | Full CRUD | Full CRUD | View (audit only) |
| **Support Tickets** | View, Create, Edit (medical) | Full CRUD | View | View | View (audit only) |
| **WhatsApp** | View (medical escalations) | Full access | View | View | View (audit only) |
| **LGPD Dashboard** | View (medical consents) | View | View | Full access | Full access |
| **System Health** | View | View | View | Full access | View |
| **Feature Flags** | View | View | View | Full access | View |
| **Admin Users** | View | View | View | Full CRUD | View (audit only) |
| **Audit Logs** | View (own actions) | View (own actions) | View (own actions) | Full access | Full access |

**Legend:**
- View: Read-only access
- Edit: Modify existing records
- Create: Create new records
- Delete: Delete/cancel records
- Full CRUD: Create, Read, Update, Delete
- Full access: All permissions including configuration

---

### Appendix B: Data Export Formats

**JSON Format (Technical, Machine-Readable):**
```json
{
  "user": {
    "id": "cuid123",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "5533999999999",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "subscriptions": [
    {
      "id": "sub123",
      "plan_type": "Mensal - Ambos Olhos",
      "status": "ACTIVE",
      "monthly_value": 149.90,
      "start_date": "2024-01-15",
      "renewal_date": "2025-01-15"
    }
  ],
  "payments": [ /* ... */ ],
  "orders": [ /* ... */ ],
  "support_tickets": [ /* ... */ ]
}
```

**CSV Format (Tabular, Spreadsheet-Compatible):**
```csv
Resource,Field,Value
User,ID,cuid123
User,Name,João Silva
User,Email,joao@example.com
Subscription,ID,sub123
Subscription,Plan,Mensal - Ambos Olhos
Subscription,Status,ACTIVE
```

**PDF Format (Human-Readable, Printable):**
```
┌─────────────────────────────────────────┐
│ LGPD Data Export Report                │
│ Generated: 2025-10-19 14:30 BRT        │
└─────────────────────────────────────────┘

USER INFORMATION
• Name: João Silva
• Email: joao@example.com
• Phone: (33) 99999-9999
• Registration Date: 15/01/2024

SUBSCRIPTION INFORMATION
• Plan: Mensal - Ambos Olhos
• Status: Ativa
• Monthly Value: R$ 149,90
• Renewal Date: 15/01/2025

PAYMENT HISTORY
[ Table of all payments ]

ORDER HISTORY
[ Table of all orders ]

---
This document contains all personal data processed by SVLentes
as required by LGPD Article 18, I.
```

---

### Appendix C: Webhook Event Handling

**Asaas Webhook Events:**

```typescript
// PAYMENT_RECEIVED: Payment confirmed by bank
{
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: 'pay_123',
    customer: 'cus_123',
    subscription: 'sub_123',
    value: 149.90,
    netValue: 145.50,
    status: 'RECEIVED',
    billingType: 'PIX',
    paymentDate: '2024-10-19T14:30:00Z'
  }
}

// Action: Update Payment model, update Subscription status if needed, send confirmation email/WhatsApp

// PAYMENT_OVERDUE: Payment past due date
{
  event: 'PAYMENT_OVERDUE',
  payment: {
    id: 'pay_123',
    dueDate: '2024-10-15',
    status: 'OVERDUE',
    daysOverdue: 4
  }
}

// Action: Update Payment status, update Subscription status to OVERDUE, send payment reminder

// PAYMENT_CONFIRMED: Payment confirmed and settled
{
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: 'pay_123',
    confirmedDate: '2024-10-19T16:00:00Z',
    status: 'CONFIRMED'
  }
}

// Action: Update Payment status, trigger order creation if subscription renewal
```

**SendPulse Webhook Events:**

```typescript
// Incoming WhatsApp message
{
  bot_id: 'bot_123',
  contact: {
    phone: '5533999999999',
    name: 'João Silva'
  },
  message: {
    id: 'msg_123',
    text: 'Quero cancelar minha assinatura',
    timestamp: '2024-10-19T14:30:00Z'
  }
}

// Action: Process with LangChain AI, determine intent, generate response or escalate
```

---

### Appendix D: API Rate Limits

**Admin API Rate Limits:**
- General admin endpoints: 1000 requests / hour per user
- Search endpoints: 60 requests / minute
- Data export endpoints: 10 requests / hour
- Bulk operations: 5 requests / hour

**Third-Party API Rate Limits:**
- Asaas API: 10,000 requests / day (API key limit)
- SendPulse API: 5,000 requests / hour
- Firebase Auth: Unlimited (but billing-based)

**Rate Limit Handling:**
- Return `429 Too Many Requests` with `Retry-After` header
- Implement exponential backoff on client side
- Show friendly error message in UI
- Log rate limit violations to audit trail

---

### Appendix E: Monitoring & Alerting Rules

**Critical Alerts (Immediate Response Required):**
1. Database connection failure → Email + SMS to System Admin
2. API error rate >10% for 5 minutes → Email + SMS to System Admin
3. Asaas webhook delivery failure >50% for 15 minutes → Email to Operations Admin
4. Payment processing failure >20% for 10 minutes → Email to Operations Admin
5. Medical emergency ticket created → Email + SMS to Medical Admin

**Warning Alerts (Response Within 1 Hour):**
1. Database response time >500ms for 10 minutes → Email to System Admin
2. API error rate >5% for 15 minutes → Email to System Admin
3. Disk space <20% free → Email to System Admin
4. Memory usage >80% for 10 minutes → Email to System Admin
5. SLA breach risk (ticket nearing deadline) → Email to Support Manager

**Info Alerts (Response Within 24 Hours):**
1. New data request submitted → Email to LGPD Officer
2. Consent expiration in 30 days → Email to LGPD Officer
3. Failed payment retry exhausted → Email to Operations Admin
4. Delivery delay detected → Email to Operations Admin

**Alert Acknowledgment:**
- Admin can acknowledge alert in dashboard
- Acknowledgment pauses repeat notifications
- Unacknowledged critical alerts escalate after 30 minutes

---

### Appendix F: Glossary

**Terms:**
- **Admin User:** Staff member with access to admin dashboard (not customer)
- **Asaas:** Brazilian payment gateway used for subscription billing
- **CFM:** Conselho Federal de Medicina (Federal Medical Council)
- **CRM:** Conselho Regional de Medicina (Regional Medical Council)
- **CRUD:** Create, Read, Update, Delete operations
- **LGPD:** Lei Geral de Proteção de Dados (Brazilian GDPR equivalent)
- **MRR:** Monthly Recurring Revenue
- **RBAC:** Role-Based Access Control
- **SendPulse:** WhatsApp Business API provider
- **SLA:** Service Level Agreement (response time commitment)
- **SSR:** Server-Side Rendering

**Acronyms:**
- **API:** Application Programming Interface
- **CSV:** Comma-Separated Values
- **JSON:** JavaScript Object Notation
- **OTP:** One-Time Password
- **PDF:** Portable Document Format
- **UI/UX:** User Interface / User Experience
- **WCAG:** Web Content Accessibility Guidelines

---

**End of Document**

**Review Status:** Draft for Review
**Next Steps:**
1. Review with stakeholders (Dr. Philipe, Operations Team, Legal/LGPD)
2. Prioritize features based on business impact
3. Refine technical specifications based on feedback
4. Validate timeline with development team
5. Obtain formal approval to proceed with Phase 1 implementation

**Contact:**
- **Product Owner:** [To be assigned]
- **Technical Lead:** [To be assigned]
- **Medical Oversight:** Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- **LGPD Compliance:** [To be assigned]
