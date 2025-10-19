-- Add SubscriptionChangeType enum
CREATE TYPE "SubscriptionChangeType" AS ENUM (
  'PLAN_CHANGE',
  'ADDRESS_UPDATE',
  'PAYMENT_METHOD_UPDATE',
  'STATUS_CHANGE',
  'PRICE_ADJUSTMENT',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_CANCELLED',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIPTION_RESUMED'
);

-- Create SubscriptionHistory table
CREATE TABLE "subscription_history" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "subscription_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "change_type" "SubscriptionChangeType" NOT NULL,
  "description" TEXT NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB,
  "metadata" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_history_subscription_fkey"
    FOREIGN KEY ("subscription_id")
    REFERENCES "subscriptions"("id")
    ON DELETE CASCADE,

  CONSTRAINT "subscription_history_user_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "idx_subscription_history_subscription" ON "subscription_history"("subscription_id");
CREATE INDEX "idx_subscription_history_user" ON "subscription_history"("user_id");
CREATE INDEX "idx_subscription_history_change_type" ON "subscription_history"("change_type");
CREATE INDEX "idx_subscription_history_created_at" ON "subscription_history"("created_at" DESC);
