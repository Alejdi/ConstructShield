-- ============================================================
-- Migration 00020: Disputes table
-- ============================================================

-- Disputes table — stores the reason and metadata for each dispute
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_disputes_project_id ON disputes(project_id);
CREATE INDEX idx_disputes_opened_by ON disputes(opened_by);

-- ============================================================
-- RLS: disputes
-- ============================================================
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Project participants (client or contractor) can view disputes for their projects
CREATE POLICY "Project participants can view disputes"
  ON disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.project_id
        AND (p.client_id = auth.uid() OR p.contractor_id = auth.uid())
    )
  );

-- Project participants can insert disputes for their active projects
CREATE POLICY "Project participants can open disputes"
  ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.project_id
        AND p.status = 'active'
        AND (p.client_id = auth.uid() OR p.contractor_id = auth.uid())
    )
  );

-- Add dispute_opened to notification preferences
ALTER TABLE notification_preferences
  ADD COLUMN dispute_opened BOOLEAN NOT NULL DEFAULT true;
