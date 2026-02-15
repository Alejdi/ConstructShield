-- Store Web Push API subscriptions per user/device
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- A user may have multiple devices, but the same endpoint should not be duplicated
CREATE UNIQUE INDEX push_subscriptions_endpoint_idx ON push_subscriptions(endpoint);

-- Index for fast lookups when sending notifications
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Add push_enabled flag to notification_preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
ON push_subscriptions FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
