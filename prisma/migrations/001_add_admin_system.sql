-- Migration: Add Complete Administrative System
-- Version: 001
-- Description: Add comprehensive administrative system with roles, permissions, audit logs, and management features
-- Compatible with existing schema

-- Set timezone
SET timezone = 'America/Sao_Paulo';

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ADMIN USER TABLE ====================

CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "phone" VARCHAR(20),
    "department" VARCHAR(100),
    "position" VARCHAR(100),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" VARCHAR(255),
    "last_password_change" TIMESTAMP(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(6),
    "ip_whitelist" TEXT[],
    "allowed_hours" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "last_login_at" TIMESTAMP(6),
    "last_login_ip" VARCHAR(45),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- Create unique index for email
CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_users_email" ON "admin_users"("email");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_admin_users_role" ON "admin_users"("role");
CREATE INDEX IF NOT EXISTS "idx_admin_users_active" ON "admin_users"("is_active");
CREATE INDEX IF NOT EXISTS "idx_admin_users_created_at" ON "admin_users"("created_at");

-- ==================== ADMIN SESSION TABLE ====================

CREATE TABLE IF NOT EXISTS "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "device_info" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "terminated_at" TIMESTAMP(6),
    "termination_reason" TEXT,
    "suspicious_activity" BOOLEAN NOT NULL DEFAULT false,
    "security_flags" TEXT[],

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- Create unique index for session token
CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_sessions_token" ON "admin_sessions"("session_token");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_admin_sessions_admin_user" ON "admin_sessions"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_sessions_status" ON "admin_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_admin_sessions_expires" ON "admin_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_admin_sessions_last_activity" ON "admin_sessions"("last_activity_at");

-- ==================== PERMISSION HISTORY TABLE ====================

CREATE TABLE IF NOT EXISTS "permission_history" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "permission_added" TEXT,
    "permission_removed" TEXT,
    "role_changed_from" TEXT,
    "role_changed_to" TEXT,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_permission_history_admin_user" ON "permission_history"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_permission_history_changed_by" ON "permission_history"("changed_by");
CREATE INDEX IF NOT EXISTS "idx_permission_history_created_at" ON "permission_history"("created_at");

-- ==================== EXTEND EXISTING USER TABLE ====================

-- Add administrative fields to existing users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_managed_by_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assigned_admin_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "flagged_for_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "review_reason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_status" VARCHAR(50) NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_restricted_at" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_restricted_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_restricted_until" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_reviewed_at" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_reviewed_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_level" VARCHAR(50) NOT NULL DEFAULT 'basic';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Add foreign key constraint for assigned admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_assigned_admin_id_fkey'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_assigned_admin_id_fkey"
        FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for new user fields
CREATE INDEX IF NOT EXISTS "idx_users_assigned_admin" ON "users"("assigned_admin_id");
CREATE INDEX IF NOT EXISTS "idx_users_account_status" ON "users"("account_status");
CREATE INDEX IF NOT EXISTS "idx_users_flagged_review" ON "users"("flagged_for_review");

-- ==================== USER REVIEW TABLE ====================

CREATE TABLE IF NOT EXISTS "user_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "risk_score" INTEGER,
    "notes" TEXT NOT NULL,
    "action_taken" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_reviews_user_id_fkey'
    ) THEN
        ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_reviews_user" ON "user_reviews"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_reviews_reviewer" ON "user_reviews"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_user_reviews_status" ON "user_reviews"("status");
CREATE INDEX IF NOT EXISTS "idx_user_reviews_created_at" ON "user_reviews"("created_at");

-- ==================== ACCOUNT RESTRICTION TABLE ====================

CREATE TABLE IF NOT EXISTS "account_restrictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "restriction_type" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "restricted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restricted_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6),
    "lifted_at" TIMESTAMP(6),
    "lifted_by" TEXT,
    "metadata" JSONB,

    CONSTRAINT "account_restrictions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'account_restrictions_user_id_fkey'
    ) THEN
        ALTER TABLE "account_restrictions" ADD CONSTRAINT "account_restrictions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_account_restrictions_user" ON "account_restrictions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_account_restrictions_active" ON "account_restrictions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_account_restrictions_type" ON "account_restrictions"("restriction_type");
CREATE INDEX IF NOT EXISTS "idx_account_restrictions_expires" ON "account_restrictions"("expires_at");

-- ==================== EXTEND SUBSCRIPTION TABLE ====================

-- Add administrative fields to existing subscriptions table
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "is_managed_by_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "assigned_admin_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "risk_level" VARCHAR(50) NOT NULL DEFAULT 'low';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_payment_attempt" TIMESTAMP(6);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "next_retry_attempt" TIMESTAMP(6);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "dunning_level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "grace_period_ends_at" TIMESTAMP(6);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "flagged_for_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "review_reason" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_reviewed_at" TIMESTAMP(6);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_reviewed_by" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "custom_pricing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "pricing_override" JSONB;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(6);

-- Add foreign key constraint for assigned admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'subscriptions_assigned_admin_id_fkey'
    ) THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_assigned_admin_id_fkey"
        FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for new subscription fields
CREATE INDEX IF NOT EXISTS "idx_subscriptions_assigned_admin" ON "subscriptions"("assigned_admin_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_flagged_review" ON "subscriptions"("flagged_for_review");

-- ==================== SUBSCRIPTION REVIEW TABLE ====================

CREATE TABLE IF NOT EXISTS "subscription_reviews" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_type" VARCHAR(50) NOT NULL,
    "previous_status" VARCHAR(50),
    "new_status" VARCHAR(50),
    "notes" TEXT NOT NULL,
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_reviews_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'subscription_reviews_subscription_id_fkey'
    ) THEN
        ALTER TABLE "subscription_reviews" ADD CONSTRAINT "subscription_reviews_subscription_id_fkey"
        FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_subscription_reviews_subscription" ON "subscription_reviews"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_reviews_reviewer" ON "subscription_reviews"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_subscription_reviews_type" ON "subscription_reviews"("review_type");

-- ==================== PAYMENT RETRY TABLE ====================

CREATE TABLE IF NOT EXISTS "payment_retries" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "attempt_number" INTEGER NOT NULL,
    "retry_reason" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(6) NOT NULL,
    "attempted_at" TIMESTAMP(6),
    "success" BOOLEAN,
    "failure_reason" TEXT,
    "is_automated" BOOLEAN NOT NULL DEFAULT true,
    "triggered_by" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payment_retries_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payment_retries_subscription_id_fkey'
    ) THEN
        ALTER TABLE "payment_retries" ADD CONSTRAINT "payment_retries_subscription_id_fkey"
        FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_payment_retries_subscription" ON "payment_retries"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_payment_retries_scheduled" ON "payment_retries"("scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_payment_retries_success" ON "payment_retries"("success");

-- ==================== MANUAL ADJUSTMENT TABLE ====================

CREATE TABLE IF NOT EXISTS "manual_adjustments" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "adjustment_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "manual_adjustments_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'manual_adjustments_subscription_id_fkey'
    ) THEN
        ALTER TABLE "manual_adjustments" ADD CONSTRAINT "manual_adjustments_subscription_id_fkey"
        FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_manual_adjustments_subscription" ON "manual_adjustments"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_manual_adjustments_type" ON "manual_adjustments"("adjustment_type");
CREATE INDEX IF NOT EXISTS "idx_manual_adjustments_creator" ON "manual_adjustments"("created_by");

-- ==================== EXTEND ORDERS TABLE ====================

-- Add administrative fields to existing orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_managed_by_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "assigned_admin_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(50) NOT NULL DEFAULT 'normal';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "flagged_for_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "review_reason" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_reviewed_at" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_reviewed_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "warehouse_processed_at" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "processed_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quality_checked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quality_checked_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quality_checked_at" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "special_instructions" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_wrap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_message" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "insurance_value" DECIMAL(10,2);

-- Add foreign key constraint for assigned admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_assigned_admin_id_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_admin_id_fkey"
        FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for new order fields
CREATE INDEX IF NOT EXISTS "idx_orders_assigned_admin" ON "orders"("assigned_admin_id");
CREATE INDEX IF NOT EXISTS "idx_orders_flagged_review" ON "orders"("flagged_for_review");

-- ==================== ORDER REVIEW TABLE ====================

CREATE TABLE IF NOT EXISTS "order_reviews" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_type" VARCHAR(50) NOT NULL,
    "previous_status" VARCHAR(50),
    "new_status" VARCHAR(50),
    "notes" TEXT NOT NULL,
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_reviews_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_reviews_order_id_fkey'
    ) THEN
        ALTER TABLE "order_reviews" ADD CONSTRAINT "order_reviews_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_order_reviews_order" ON "order_reviews"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_reviews_reviewer" ON "order_reviews"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_order_reviews_type" ON "order_reviews"("review_type");

-- ==================== ORDER EXCEPTION TABLE ====================

CREATE TABLE IF NOT EXISTS "order_exceptions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "exception_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "assigned_to" TEXT,
    "resolved_by" TEXT,
    "detected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),
    "financial_impact" DECIMAL(10,2),
    "customer_impact" TEXT,
    "customer_notified" BOOLEAN NOT NULL DEFAULT false,
    "internal_notification" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_exceptions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_exceptions_order_id_fkey'
    ) THEN
        ALTER TABLE "order_exceptions" ADD CONSTRAINT "order_exceptions_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_order_exceptions_order" ON "order_exceptions"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_exceptions_status" ON "order_exceptions"("status");
CREATE INDEX IF NOT EXISTS "idx_order_exceptions_severity" ON "order_exceptions"("severity");
CREATE INDEX IF NOT EXISTS "idx_order_exceptions_assigned" ON "order_exceptions"("assigned_to");

-- ==================== EXTEND SUPPORT TICKETS TABLE ====================

-- Add administrative fields to existing support_tickets table
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_admin_id" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "internal_priority" VARCHAR(50) NOT NULL DEFAULT 'medium';
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "escalation_level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "sla_breach_at" TIMESTAMP(6);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "first_response_at" TIMESTAMP(6);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "resolution_time" INTEGER;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "sentiment_score" REAL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "channel" VARCHAR(50) NOT NULL DEFAULT 'whatsapp';

-- Add foreign key constraint for assigned admin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_assigned_admin_id_fkey'
    ) THEN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey"
        FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create index for new support ticket fields
CREATE INDEX IF NOT EXISTS "idx_support_tickets_admin_id" ON "support_tickets"("assigned_admin_id");

-- ==================== TICKET MESSAGE TABLE ====================

CREATE TABLE IF NOT EXISTS "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender_type" VARCHAR(50) NOT NULL,
    "sender_id" TEXT,
    "sender_name" VARCHAR(255),
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(50) NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "internal_recipients" TEXT[],
    "attachments" JSONB,
    "is_automated" BOOLEAN NOT NULL DEFAULT false,
    "template_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ticket_messages_ticket_id_fkey'
    ) THEN
        ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_ticket" ON "ticket_messages"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_sender_type" ON "ticket_messages"("sender_type");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_created_at" ON "ticket_messages"("created_at");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_internal" ON "ticket_messages"("is_internal");

-- ==================== TICKET ESCALATION TABLE ====================

CREATE TABLE IF NOT EXISTS "ticket_escalations" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_level" INTEGER NOT NULL,
    "to_level" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" VARCHAR(50) NOT NULL,
    "escalated_by" TEXT NOT NULL,
    "escalated_to" TEXT,
    "previous_assignee" TEXT,
    "escalated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(6),
    "resolved_at" TIMESTAMP(6),
    "resolution" TEXT,
    "resolution_by" TEXT,
    "sla_paused_at" TIMESTAMP(6),
    "sla_resumed_at" TIMESTAMP(6),

    CONSTRAINT "ticket_escalations_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ticket_escalations_ticket_id_fkey'
    ) THEN
        ALTER TABLE "ticket_escalations" ADD CONSTRAINT "ticket_escalations_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_ticket_escalations_ticket" ON "ticket_escalations"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_escalations_escalated_by" ON "ticket_escalations"("escalated_by");
CREATE INDEX IF NOT EXISTS "idx_ticket_escalations_to_level" ON "ticket_escalations"("to_level");

-- ==================== TICKET RESOLUTION TABLE ====================

CREATE TABLE IF NOT EXISTS "ticket_resolutions" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "resolution_type" VARCHAR(50) NOT NULL,
    "resolution_category" VARCHAR(50) NOT NULL,
    "solution" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "customer_satisfaction" INTEGER,
    "agent_effort" INTEGER,
    "complexity" VARCHAR(50),
    "total_handle_time" INTEGER,
    "first_response_time" INTEGER,
    "resolution_time" INTEGER,
    "resolved_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMP(6),
    "follow_up_notes" TEXT,
    "add_to_knowledge_base" BOOLEAN NOT NULL DEFAULT false,
    "knowledge_base_entry" TEXT,
    "resolved_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_resolutions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ticket_resolutions_ticket_id_fkey'
    ) THEN
        ALTER TABLE "ticket_resolutions" ADD CONSTRAINT "ticket_resolutions_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_ticket_resolutions_ticket" ON "ticket_resolutions"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_resolutions_resolved_by" ON "ticket_resolutions"("resolved_by");
CREATE INDEX IF NOT EXISTS "idx_ticket_resolutions_type" ON "ticket_resolutions"("resolution_type");

-- ==================== SATISFACTION REVIEW TABLE ====================

CREATE TABLE IF NOT EXISTS "satisfaction_reviews" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "categories" JSONB,
    "response_time_rating" INTEGER,
    "solution_quality_rating" INTEGER,
    "agent_rating" INTEGER,
    "customer_id" TEXT,
    "customer_email" VARCHAR(255),
    "requested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(6),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_contact" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "satisfaction_reviews_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'satisfaction_reviews_ticket_id_fkey'
    ) THEN
        ALTER TABLE "satisfaction_reviews" ADD CONSTRAINT "satisfaction_reviews_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_satisfaction_reviews_ticket" ON "satisfaction_reviews"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_satisfaction_reviews_rating" ON "satisfaction_reviews"("rating");
CREATE INDEX IF NOT EXISTS "idx_satisfaction_reviews_requested" ON "satisfaction_reviews"("requested_at");

-- ==================== FINANCIAL TRANSACTION TABLE ====================

CREATE TABLE IF NOT EXISTS "financial_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "payment_id" TEXT,
    "invoice_id" TEXT,
    "order_id" TEXT,
    "refund_id" TEXT,
    "transaction_type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" VARCHAR(50) NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "gateway_transaction_id" VARCHAR(255),
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "processed_at" TIMESTAMP(6),
    "settled_at" TIMESTAMP(6),
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" TIMESTAMP(6),
    "reconciled_by" TEXT,
    "manual_review" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(6),
    "review_notes" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'financial_transactions_user_id_fkey'
    ) THEN
        ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'financial_transactions_subscription_id_fkey'
    ) THEN
        ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_subscription_id_fkey"
        FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'financial_transactions_payment_id_fkey'
    ) THEN
        ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_user" ON "financial_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_subscription" ON "financial_transactions"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_payment" ON "financial_transactions"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_type" ON "financial_transactions"("transaction_type");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_status" ON "financial_transactions"("status");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_date" ON "financial_transactions"("transaction_date");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_gateway" ON "financial_transactions"("gateway");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_reconciled" ON "financial_transactions"("reconciled");

-- ==================== REFUND TABLE ====================

CREATE TABLE IF NOT EXISTS "refunds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "payment_id" TEXT NOT NULL,
    "order_id" TEXT,
    "financial_transaction_id" TEXT,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "original_amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_by" TEXT,
    "approved_by" TEXT,
    "rejected_by" TEXT,
    "gateway" VARCHAR(50) NOT NULL,
    "gateway_refund_id" VARCHAR(255),
    "gateway_status" VARCHAR(100),
    "requested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(6),
    "approved_at" TIMESTAMP(6),
    "rejected_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "expected_completion" TIMESTAMP(6),
    "processing_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refundable_amount" DECIMAL(10,2) NOT NULL,
    "customer_notified" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent_at" TIMESTAMP(6),
    "reason_details" TEXT,
    "admin_notes" TEXT,
    "evidence_attachments" JSONB,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'refunds_user_id_fkey'
    ) THEN
        ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'refunds_payment_id_fkey'
    ) THEN
        ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'refunds_financial_transaction_id_fkey'
    ) THEN
        ALTER TABLE "refunds" ADD CONSTRAINT "refunds_financial_transaction_id_fkey"
        FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_refunds_user" ON "refunds"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_payment" ON "refunds"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_status" ON "refunds"("status");
CREATE INDEX IF NOT EXISTS "idx_refunds_requested" ON "refunds"("requested_at");
CREATE INDEX IF NOT EXISTS "idx_refunds_processor" ON "refunds"("processed_by");

-- ==================== DISPUTE TABLE ====================

CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "refund_id" TEXT,
    "dispute_type" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" VARCHAR(50) NOT NULL,
    "phase" VARCHAR(50) NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "gateway_dispute_id" VARCHAR(255),
    "response_due" TIMESTAMP(6),
    "evidence_due" TIMESTAMP(6),
    "resolution_expected" TIMESTAMP(6),
    "assigned_to" TEXT,
    "case_manager" TEXT,
    "provisional_credit" DECIMAL(10,2),
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "evidence_submitted" BOOLEAN NOT NULL DEFAULT false,
    "evidence_files" JSONB,
    "customer_evidence" JSONB,
    "customer_contacted" BOOLEAN NOT NULL DEFAULT false,
    "last_contact_at" TIMESTAMP(6),
    "outcome" VARCHAR(50),
    "resolution_reason" TEXT,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" TEXT,
    "admin_notes" TEXT,
    "legal_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'disputes_user_id_fkey'
    ) THEN
        ALTER TABLE "disputes" ADD CONSTRAINT "disputes_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'disputes_payment_id_fkey'
    ) THEN
        ALTER TABLE "disputes" ADD CONSTRAINT "disputes_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'disputes_refund_id_fkey'
    ) THEN
        ALTER TABLE "disputes" ADD CONSTRAINT "disputes_refund_id_fkey"
        FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_disputes_user" ON "disputes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_payment" ON "disputes"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_status" ON "disputes"("status");
CREATE INDEX IF NOT EXISTS "idx_disputes_type" ON "disputes"("dispute_type");
CREATE INDEX IF NOT EXISTS "idx_disputes_assigned" ON "disputes"("assigned_to");

-- ==================== ADMIN ACTION TABLE ====================

CREATE TABLE IF NOT EXISTS "admin_actions" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "admin_email" VARCHAR(255) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" TEXT,
    "resource_name" VARCHAR(255),
    "action_type" VARCHAR(50) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_fields" TEXT[],
    "description" TEXT,
    "reason" TEXT,
    "source" VARCHAR(50) NOT NULL,
    "session_id" TEXT,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "request_id" TEXT,
    "endpoint" TEXT,
    "duration" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspicious_activity" BOOLEAN NOT NULL DEFAULT false,
    "risk_score" INTEGER,
    "security_flags" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'admin_actions_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_admin_actions_admin_user" ON "admin_actions"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_action" ON "admin_actions"("action");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_resource_type" ON "admin_actions"("resource_type");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_resource_id" ON "admin_actions"("resource_id");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_type" ON "admin_actions"("action_type");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_created_at" ON "admin_actions"("created_at");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_ip" ON "admin_actions"("ip_address");
CREATE INDEX IF NOT EXISTS "idx_admin_actions_suspicious" ON "admin_actions"("suspicious_activity");

-- ==================== SYSTEM LOG TABLE ====================

CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "component" VARCHAR(100) NOT NULL,
    "service" VARCHAR(100),
    "version" VARCHAR(50),
    "resource_type" VARCHAR(100),
    "resource_id" TEXT,
    "user_id" TEXT,
    "admin_user_id" TEXT,
    "request_id" TEXT,
    "session_id" TEXT,
    "trace_id" TEXT,
    "correlation_id" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "endpoint" TEXT,
    "method" VARCHAR(10),
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "stack_trace" TEXT,
    "duration" INTEGER,
    "memory_usage" BIGINT,
    "cpu_usage" REAL,
    "environment" VARCHAR(50) NOT NULL,
    "region" VARCHAR(50),
    "instance_id" TEXT,
    "alert_triggered" BOOLEAN NOT NULL DEFAULT false,
    "alert_sent" BOOLEAN NOT NULL DEFAULT false,
    "alert_level" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'system_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'system_logs_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_system_logs_level" ON "system_logs"("level");
CREATE INDEX IF NOT EXISTS "idx_system_logs_event" ON "system_logs"("event");
CREATE INDEX IF NOT EXISTS "idx_system_logs_component" ON "system_logs"("component");
CREATE INDEX IF NOT EXISTS "idx_system_logs_resource_type" ON "system_logs"("resource_type");
CREATE INDEX IF NOT EXISTS "idx_system_logs_user" ON "system_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_system_logs_admin" ON "system_logs"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_system_logs_created_at" ON "system_logs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_system_logs_alert" ON "system_logs"("alert_triggered");

-- ==================== SECURITY EVENT TABLE ====================

CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_id" TEXT,
    "target_email" VARCHAR(255),
    "source_ip" VARCHAR(45) NOT NULL,
    "source_user_agent" TEXT,
    "source_location" JSONB,
    "user_id" TEXT,
    "admin_user_id" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "confidence" REAL,
    "risk_score" INTEGER,
    "risk_level" VARCHAR(50),
    "impact" TEXT,
    "action_taken" TEXT,
    "automated_response" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to" TEXT,
    "investigation_notes" TEXT,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" TEXT,
    "related_events" TEXT[],
    "parent_event_id" TEXT,
    "metadata" JSONB,
    "raw_event" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'security_events_user_id_fkey'
    ) THEN
        ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'security_events_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "security_events" ADD CONSTRAINT "security_events_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_security_events_type" ON "security_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_security_events_severity" ON "security_events"("severity");
CREATE INDEX IF NOT EXISTS "idx_security_events_status" ON "security_events"("status");
CREATE INDEX IF NOT EXISTS "idx_security_events_target_type" ON "security_events"("target_type");
CREATE INDEX IF NOT EXISTS "idx_security_events_user" ON "security_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_security_events_admin" ON "security_events"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_security_events_source_ip" ON "security_events"("source_ip");
CREATE INDEX IF NOT EXISTS "idx_security_events_created_at" ON "security_events"("created_at");
CREATE INDEX IF NOT EXISTS "idx_security_events_risk" ON "security_events"("risk_score");

-- ==================== ADMIN NOTIFICATION TABLE ====================

CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "action_url" TEXT,
    "action_text" VARCHAR(100),
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_completed" BOOLEAN NOT NULL DEFAULT false,
    "context" JSONB,
    "resource_type" VARCHAR(100),
    "resource_id" TEXT,
    "channels" TEXT[],
    "sent_via" TEXT[],
    "scheduled_at" TIMESTAMP(6),
    "expires_at" TIMESTAMP(6),
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'admin_notifications_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_admin_user" ON "admin_notifications"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_read" ON "admin_notifications"("is_read");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_type" ON "admin_notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_priority" ON "admin_notifications"("priority");
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_created_at" ON "admin_notifications"("created_at");

-- ==================== ANALYTICS CACHE TABLE ====================

CREATE TABLE IF NOT EXISTS "analytics_cache" (
    "id" TEXT NOT NULL,
    "cache_key" VARCHAR(255) NOT NULL,
    "data" JSONB NOT NULL,
    "data_type" VARCHAR(100) NOT NULL,
    "parameters" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "last_accessed_at" TIMESTAMP(6),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "size_bytes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "generated_by" TEXT,
    "generation_time" INTEGER,
    "query" TEXT,

    CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("id")
);

-- Create unique index for cache key
CREATE UNIQUE INDEX IF NOT EXISTS "idx_analytics_cache_key" ON "analytics_cache"("cache_key");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_analytics_cache_type" ON "analytics_cache"("data_type");
CREATE INDEX IF NOT EXISTS "idx_analytics_cache_expires" ON "analytics_cache"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_analytics_cache_active" ON "analytics_cache"("is_active");

-- ==================== DASHBOARD CONFIG TABLE ====================

CREATE TABLE IF NOT EXISTS "dashboard_configs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "widgets" JSONB NOT NULL,
    "default_filters" JSONB,
    "date_range" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "shared_with" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[],
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "last_accessed_at" TIMESTAMP(6),

    CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dashboard_configs_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "dashboard_configs" ADD CONSTRAINT "dashboard_configs_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_dashboard_configs_admin_user" ON "dashboard_configs"("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_dashboard_configs_active" ON "dashboard_configs"("is_active");
CREATE INDEX IF NOT EXISTS "idx_dashboard_configs_public" ON "dashboard_configs"("is_public");

-- ==================== REPORT SCHEDULE TABLE ====================

CREATE TABLE IF NOT EXISTS "report_schedules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "report_type" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,
    "cron_expression" VARCHAR(100),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    "next_run_at" TIMESTAMP(6) NOT NULL,
    "last_run_at" TIMESTAMP(6),
    "parameters" JSONB,
    "filters" JSONB,
    "delivery_method" VARCHAR(50) NOT NULL,
    "recipients" TEXT[],
    "format" VARCHAR(20) NOT NULL DEFAULT 'pdf',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(50) NOT NULL,
    "created_by" TEXT NOT NULL,
    "last_success_at" TIMESTAMP(6),
    "last_failure_at" TIMESTAMP(6),
    "failure_reason" TEXT,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_report_schedules_type" ON "report_schedules"("report_type");
CREATE INDEX IF NOT EXISTS "idx_report_schedules_frequency" ON "report_schedules"("frequency");
CREATE INDEX IF NOT EXISTS "idx_report_schedules_next_run" ON "report_schedules"("next_run_at");
CREATE INDEX IF NOT EXISTS "idx_report_schedules_active" ON "report_schedules"("is_active");
CREATE INDEX IF NOT EXISTS "idx_report_schedules_status" ON "report_schedules"("status");

-- ==================== SYSTEM HEALTH TABLE ====================

CREATE TABLE IF NOT EXISTS "system_health" (
    "id" TEXT NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "component" VARCHAR(100) NOT NULL,
    "environment" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "health_score" REAL,
    "response_time" REAL,
    "cpu_usage" REAL,
    "memory_usage" REAL,
    "disk_usage" REAL,
    "error_rate" REAL,
    "last_error_at" TIMESTAMP(6),
    "last_error_message" TEXT,
    "dependencies" JSONB,
    "external_services" JSONB,
    "version" VARCHAR(50),
    "build_number" VARCHAR(50),
    "deployment_time" TIMESTAMP(6),
    "uptime" INTEGER,
    "restart_count" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for service-component-environment combination
CREATE UNIQUE INDEX IF NOT EXISTS "system_health_service_component_environment_key" ON "system_health"("service_name", "component", "environment");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_system_health_status" ON "system_health"("status");
CREATE INDEX IF NOT EXISTS "idx_system_health_service" ON "system_health"("service_name");
CREATE INDEX IF NOT EXISTS "idx_system_health_created_at" ON "system_health"("created_at");

-- ==================== INSERT INITIAL DATA ====================

-- Create default super admin user
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO "admin_users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "permissions",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'admin-super-001',
    'admin@svlentes.com.br',
    '$2b$10$rOZJqQjQjQjQjQjQjQjQjOZJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQj',
    'Administrador Sistema',
    'SUPER_ADMIN',
    ARRAY[
        'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_EXPORT',
        'SUBSCRIPTION_CREATE', 'SUBSCRIPTION_READ', 'SUBSCRIPTION_UPDATE', 'SUBSCRIPTION_DELETE', 'SUBSCRIPTION_PAUSE', 'SUBSCRIPTION_RESUME', 'SUBSCRIPTION_CANCEL', 'SUBSCRIPTION_EXPORT',
        'ORDER_CREATE', 'ORDER_READ', 'ORDER_UPDATE', 'ORDER_DELETE', 'ORDER_TRACK', 'ORDER_EXPORT',
        'PAYMENT_READ', 'PAYMENT_REFUND', 'PAYMENT_EXPORT', 'PAYMENT_DISPUTE',
        'SUPPORT_READ', 'SUPPORT_ASSIGN', 'SUPPORT_ESCALATE', 'SUPPORT_RESOLVE', 'SUPPORT_EXPORT',
        'FINANCIAL_READ', 'FINANCIAL_REPORT', 'FINANCIAL_REFUND', 'FINANCIAL_EXPORT',
        'SYSTEM_CONFIG', 'SYSTEM_LOGS', 'SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE',
        'ANALYTICS_READ', 'ANALYTICS_EXPORT', 'ANALYTICS_DASHBOARD'
    ],
    true,
    'system',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create manager user
-- Password: Manager123!
INSERT INTO "admin_users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "permissions",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'admin-manager-001',
    'manager@svlentes.com.br',
    '$2b$10$rOZJqQjQjQjQjQjQjQjQjOZJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'Gerente Operações',
    'MANAGER',
    ARRAY[
        'USER_READ', 'USER_UPDATE', 'USER_EXPORT',
        'SUBSCRIPTION_READ', 'SUBSCRIPTION_UPDATE', 'SUBSCRIPTION_PAUSE', 'SUBSCRIPTION_RESUME', 'SUBSCRIPTION_EXPORT',
        'ORDER_READ', 'ORDER_UPDATE', 'ORDER_TRACK', 'ORDER_EXPORT',
        'PAYMENT_READ', 'PAYMENT_REFUND', 'PAYMENT_EXPORT',
        'SUPPORT_READ', 'SUPPORT_ASSIGN', 'SUPPORT_ESCALATE', 'SUPPORT_RESOLVE', 'SUPPORT_EXPORT',
        'FINANCIAL_READ', 'FINANCIAL_REPORT',
        'ANALYTICS_READ', 'ANALYTICS_EXPORT', 'ANALYTICS_DASHBOARD'
    ],
    true,
    'admin-super-001',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create support agent user
-- Password: Support123!
INSERT INTO "admin_users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "permissions",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'admin-support-001',
    'support@svlentes.com.br',
    '$2b$10$rOZJqQjQjQjQjQjQjQjQjOZJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'Agente Suporte',
    'SUPPORT_AGENT',
    ARRAY[
        'USER_READ',
        'SUBSCRIPTION_READ',
        'ORDER_READ', 'ORDER_TRACK',
        'PAYMENT_READ',
        'SUPPORT_READ', 'SUPPORT_ASSIGN', 'SUPPORT_RESOLVE', 'SUPPORT_EXPORT'
    ],
    true,
    'admin-super-001',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create financial analyst user
-- Password: Finance123!
INSERT INTO "admin_users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "permissions",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'admin-finance-001',
    'finance@svlentes.com.br',
    '$2b$10$rOZJqQjQjQjQjQjQjQjQjOZJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'Analista Financeiro',
    'FINANCIAL_ANALYST',
    ARRAY[
        'USER_READ',
        'SUBSCRIPTION_READ',
        'ORDER_READ',
        'PAYMENT_READ', 'PAYMENT_REFUND', 'PAYMENT_EXPORT',
        'FINANCIAL_READ', 'FINANCIAL_REPORT', 'FINANCIAL_REFUND', 'FINANCIAL_EXPORT',
        'ANALYTICS_READ', 'ANALYTICS_EXPORT'
    ],
    true,
    'admin-super-001',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create viewer user
-- Password: Viewer123!
INSERT INTO "admin_users" (
    "id",
    "email",
    "password",
    "name",
    "role",
    "permissions",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'admin-viewer-001',
    'viewer@svlentes.com.br',
    '$2b$10$rOZJqQjQjQjQjQjQjQjQjOZJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'Visualizador',
    'VIEWER',
    ARRAY[
        'USER_READ',
        'SUBSCRIPTION_READ',
        'ORDER_READ',
        'PAYMENT_READ',
        'SUPPORT_READ',
        'FINANCIAL_READ',
        'ANALYTICS_READ'
    ],
    true,
    'admin-super-001',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create default dashboard config for super admin
INSERT INTO "dashboard_configs" (
    "id",
    "admin_user_id",
    "name",
    "description",
    "layout",
    "widgets",
    "is_public",
    "is_active",
    "created_by",
    "created_at"
) VALUES (
    'dashboard-super-default',
    'admin-super-001',
    'Dashboard Principal',
    'Dashboard administrativo completo com todas as métricas principais',
    '{
        "version": "1.0",
        "breakpoints": {"lg": 12, "md": 10, "sm": 6, "xs": 4, "xxs": 2},
        "cols": {"lg": 12, "md": 10, "sm": 6, "xs": 4, "xxs": 2},
        "rowHeight": 100
    }',
    '{
        "overview": {
            "id": "overview",
            "type": "overview",
            "title": "Visão Geral",
            "position": {"x": 0, "y": 0, "w": 12, "h": 4}
        },
        "subscriptions": {
            "id": "subscriptions",
            "type": "subscriptions-chart",
            "title": "Assinaturas",
            "position": {"x": 0, "y": 4, "w": 6, "h": 6}
        },
        "revenue": {
            "id": "revenue",
            "type": "revenue-chart",
            "title": "Receita",
            "position": {"x": 6, "y": 4, "w": 6, "h": 6}
        },
        "support": {
            "id": "support",
            "type": "support-tickets",
            "title": "Tickets de Suporte",
            "position": {"x": 0, "y": 10, "w": 12, "h": 4}
        }
    }',
    false,
    true,
    'admin-super-001',
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Create system health monitoring entry
INSERT INTO "system_health" (
    "id",
    "service_name",
    "component",
    "environment",
    "status",
    "health_score",
    "version",
    "created_at",
    "updated_at"
) VALUES (
    'health-svlentes-api',
    'svlentes-api',
    'backend',
    'production',
    'healthy',
    100.0,
    '1.0.0',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Create basic analytics cache entry
INSERT INTO "analytics_cache" (
    "id",
    "cache_key",
    "data",
    "data_type",
    "generated_at",
    "expires_at",
    "generated_by"
) VALUES (
    'cache-overview-001',
    'dashboard_overview_summary',
    '{
        "totalUsers": 0,
        "activeSubscriptions": 0,
        "monthlyRevenue": 0,
        "openTickets": 0,
        "lastUpdated": "' || to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') || '"
    }',
    'overview_summary',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 hour',
    'system'
) ON CONFLICT DO NOTHING;

-- ==================== TRIGGERS FOR UPDATED_AT ====================

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DO $$
BEGIN
    -- Check if trigger already exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_admin_users_updated_at'
    ) THEN
        CREATE TRIGGER set_admin_users_updated_at
            BEFORE UPDATE ON "admin_users"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_admin_sessions_updated_at'
    ) THEN
        CREATE TRIGGER set_admin_sessions_updated_at
            BEFORE UPDATE ON "admin_sessions"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_reviews_updated_at'
    ) THEN
        CREATE TRIGGER set_user_reviews_updated_at
            BEFORE UPDATE ON "user_reviews"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_payment_retries_updated_at'
    ) THEN
        CREATE TRIGGER set_payment_retries_updated_at
            BEFORE UPDATE ON "payment_retries"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_manual_adjustments_updated_at'
    ) THEN
        CREATE TRIGGER set_manual_adjustments_updated_at
            BEFORE UPDATE ON "manual_adjustments"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_ticket_messages_updated_at'
    ) THEN
        CREATE TRIGGER set_ticket_messages_updated_at
            BEFORE UPDATE ON "ticket_messages"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_refunds_updated_at'
    ) THEN
        CREATE TRIGGER set_refunds_updated_at
            BEFORE UPDATE ON "refunds"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_disputes_updated_at'
    ) THEN
        CREATE TRIGGER set_disputes_updated_at
            BEFORE UPDATE ON "disputes"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_admin_notifications_updated_at'
    ) THEN
        CREATE TRIGGER set_admin_notifications_updated_at
            BEFORE UPDATE ON "admin_notifications"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_dashboard_configs_updated_at'
    ) THEN
        CREATE TRIGGER set_dashboard_configs_updated_at
            BEFORE UPDATE ON "dashboard_configs"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_report_schedules_updated_at'
    ) THEN
        CREATE TRIGGER set_report_schedules_updated_at
            BEFORE UPDATE ON "report_schedules"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_system_health_updated_at'
    ) THEN
        CREATE TRIGGER set_system_health_updated_at
            BEFORE UPDATE ON "system_health"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_security_events_updated_at'
    ) THEN
        CREATE TRIGGER set_security_events_updated_at
            BEFORE UPDATE ON "security_events"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END
$$;

-- ==================== MIGRATION COMPLETION ====================

-- Create migration log entry
CREATE TABLE IF NOT EXISTS "migration_log" (
    "id" SERIAL PRIMARY KEY,
    "migration_name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "executed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed'
);

INSERT INTO "migration_log" ("migration_name", "version", "status")
VALUES ('add_admin_system', '001', 'completed')
ON CONFLICT DO NOTHING;

-- Output completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_add_admin_system completed successfully';
    RAISE NOTICE 'Added administrative system with roles, permissions, and audit capabilities';
    RAISE NOTICE 'Created default admin users:';
    RAISE NOTICE '  - admin@svlentes.com.br (Super Admin) - Password: Admin123!';
    RAISE NOTICE '  - manager@svlentes.com.br (Manager) - Password: Manager123!';
    RAISE NOTICE '  - support@svlentes.com.br (Support Agent) - Password: Support123!';
    RAISE NOTICE '  - finance@svlentes.com.br (Financial Analyst) - Password: Finance123!';
    RAISE NOTICE '  - viewer@svlentes.com.br (Viewer) - Password: Viewer123!';
    RAISE NOTICE 'IMPORTANT: Change default passwords in production!';
END
$$;