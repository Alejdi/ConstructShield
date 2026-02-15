-- ============================================================
-- Migration 00021: Add email notification preference
-- ============================================================

ALTER TABLE notification_preferences
  ADD COLUMN email_enabled BOOLEAN NOT NULL DEFAULT true;
