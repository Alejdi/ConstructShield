-- ============================================================
-- Migration 00015: Notifications system
-- ============================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification preferences table (one row per user)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bid_received BOOLEAN NOT NULL DEFAULT true,
  bid_accepted BOOLEAN NOT NULL DEFAULT true,
  bid_rejected BOOLEAN NOT NULL DEFAULT true,
  milestone_funded BOOLEAN NOT NULL DEFAULT true,
  milestone_started BOOLEAN NOT NULL DEFAULT true,
  milestone_proof BOOLEAN NOT NULL DEFAULT true,
  milestone_released BOOLEAN NOT NULL DEFAULT true,
  message_received BOOLEAN NOT NULL DEFAULT true,
  project_completed BOOLEAN NOT NULL DEFAULT true,
  review_received BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- RLS: notifications
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS: notification_preferences
-- ============================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Enable Supabase Realtime for notifications
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- Helper function: create_notification
-- Checks user preferences before inserting.
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_pref_enabled BOOLEAN := true;
  v_id UUID;
  v_col_exists BOOLEAN;
BEGIN
  -- Check if the type column exists in notification_preferences
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
      AND column_name = p_type
  ) INTO v_col_exists;

  -- If column exists, check user preference
  IF v_col_exists THEN
    EXECUTE format(
      'SELECT COALESCE((SELECT %I FROM notification_preferences WHERE user_id = $1), true)',
      p_type
    ) INTO v_pref_enabled USING p_user_id;
  END IF;

  IF NOT v_pref_enabled THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, action_url, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_action_url, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
