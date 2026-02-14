CREATE TABLE contractors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  license_number TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  subscription_tier subscription_tier NOT NULL DEFAULT 'basic',
  stripe_connect_account_id TEXT,
  bio TEXT,
  specialties TEXT[],
  service_area TEXT,
  hype_video_playback_id TEXT,
  hype_video_asset_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
