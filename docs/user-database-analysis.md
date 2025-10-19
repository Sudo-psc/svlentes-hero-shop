# User Database Analysis

This document summarizes the current Prisma data model for users and the tables that directly interact with user records.

## Core User Model (`users` table)
- **Identifiers**: `id` (CUID primary key), optional unique identifiers for Google (`google_id`), Firebase (`firebase_uid`), and Asaas (`asaas_customer_id`).
- **Authentication**: email with uniqueness constraint, optional password hash, optional OAuth linkage via `Account` records.
- **Profile Information**: optional `name`, `avatar_url`, generic `image`, contact numbers (`phone`, `whatsapp`).
- **Lifecycle Tracking**: timestamps for creation (`created_at`), updates (`updated_at`), last login (`last_login_at`), and email verification (`email_verified`).
- **Preferences & Roles**: JSON `preferences` blob, role string defaulting to `subscriber`.
- **Compliance**: relationships to consent logs for LGPD tracking.
- **Indexes**: dedicated indexes on `email`, `google_id`, and `asaas_customer_id` for efficient lookups.

## Authentication & Session Tables
- **`accounts`**: OAuth providers linked to `user_id`, enabling Google/Firebase sign-ins.
- **`sessions`**: NextAuth session tokens tied to `user_id` for persistent logins.

## Subscription & Billing Dependencies
- **`subscriptions`**: Each subscription references a `user_id`, storing plan type, payment method, Asaas identifiers, lifecycle fields, and shipping metadata.
- **`payments`**: Payment history tied to both `user_id` and `subscription_id`, including Asaas webhook data, financial adjustments, PIX metadata, and refund tracking.
- **`payment_method_records`**: Stored payment methods connected to subscriptions with card metadata and billing details.
- **`invoices`**: Generated invoices for subscriptions, tracking status, financial totals, delivery, and LGPD-compliant metadata.

## Support & Interaction Tracking
- **`support_tickets`**: Customer service cases with categorization, priority, SLAs, communication channels, and audit fields referencing `user_id`.
- **`notifications`** and **`interactions`**: Multi-channel customer engagement records for reminders, follow-ups, and AI-powered routing.
- **`whatsapp_conversations`** & **`whatsapp_interactions`**: Detailed conversational logs with message payloads, statuses, template usage, and escalation paths.

## Analytics & Machine Learning
- **`ml_predictions`**: Stores automated predictions for notification channels and send times, linked to `user_id` with accuracy tracking.
- **`user_behavior`**: One-to-one model capturing engagement metrics (open rates, click-throughs, churn risk) and event counters.

## Compliance & Data Governance
- **`consent_logs`**: Historical log of consent grants/revocations with IP, user agent, expiration, and metadata.
- **`data_requests`**: Tracks LGPD data requests independently of `user_id` but keyed by email, supporting deletion/export workflows.

## Operational Considerations
- **Cascade Deletes**: Many relations (`subscriptions`, `payments`, `support_tickets`, etc.) cascade on user deletion, ensuring dependent records are removed automatically.
- **JSON Fields**: Multiple models use `JsonB` columns (`preferences`, `metadata`, `shipping_address`) to store flexible structured data.
- **Timestamp Precision**: `Timestamp(6)` is used widely for audit accuracy, especially important for compliance and financial reconciliation.
- **Index Coverage**: High-cardinality columns (emails, Asaas IDs, statuses) are indexed to support frequent queries from billing and support workflows.

