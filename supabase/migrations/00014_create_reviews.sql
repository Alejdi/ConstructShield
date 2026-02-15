-- Migration: Reviews & Ratings
-- Clients can rate contractors after project completion

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

CREATE INDEX idx_reviews_contractor_id ON reviews(contractor_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews on their completed projects"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
        AND projects.client_id = auth.uid()
        AND projects.status = 'completed'
    )
  );

-- Aggregate rating function
CREATE OR REPLACE FUNCTION get_contractor_rating(p_contractor_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
    COUNT(*) AS review_count
  FROM reviews
  WHERE contractor_id = p_contractor_id;
$$;
