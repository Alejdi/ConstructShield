-- ============================================================
-- Migration 00016: Add admin role to user_role enum
-- ============================================================
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction.
-- Use the Supabase no-transaction directive.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
