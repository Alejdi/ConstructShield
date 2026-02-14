CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount BIGINT NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  status milestone_status NOT NULL DEFAULT 'waiting_for_funds',
  proof_video_url TEXT,
  proof_video_asset_id TEXT,
  stripe_payment_intent_id TEXT,
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_project ON milestones(project_id);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
