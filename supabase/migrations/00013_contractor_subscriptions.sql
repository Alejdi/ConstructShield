-- Migration: Contractor subscription system
-- Adds Stripe subscription tracking fields to contractors table

ALTER TABLE contractors
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trialing',
  ADD COLUMN trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  ADD COLUMN current_period_end TIMESTAMPTZ;

CREATE INDEX idx_contractors_subscription_status ON contractors(subscription_status);
