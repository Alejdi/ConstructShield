-- Marketplace: bids + service listings

-- New enums
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE service_listing_status AS ENUM ('active', 'paused');

-- Bids table: contractors bid on public bidding projects
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  message TEXT,
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contractor_id)
);

CREATE INDEX idx_bids_project ON bids(project_id);
CREATE INDEX idx_bids_contractor ON bids(contractor_id);
CREATE INDEX idx_bids_status ON bids(status);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Service listings table: contractors post services
CREATE TABLE service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  starting_price BIGINT NOT NULL,
  status service_listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_listings_contractor ON service_listings(contractor_id);
CREATE INDEX idx_service_listings_category ON service_listings(category);
CREATE INDEX idx_service_listings_status ON service_listings(status);

ALTER TABLE service_listings ENABLE ROW LEVEL SECURITY;

-- Add is_public to projects (controls job board visibility)
ALTER TABLE projects
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Auto-update updated_at triggers
CREATE TRIGGER set_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_service_listings_updated_at
  BEFORE UPDATE ON service_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

-- Bids: contractors can view their own bids
CREATE POLICY "Contractors can view own bids"
  ON bids FOR SELECT
  USING (auth.uid() = contractor_id);

-- Bids: clients can view bids on their projects
CREATE POLICY "Clients can view bids on their projects"
  ON bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Bids: contractors can insert bids on public bidding projects
CREATE POLICY "Contractors can insert bids"
  ON bids FOR INSERT
  WITH CHECK (
    auth.uid() = contractor_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.status = 'bidding'
      AND projects.is_public = true
    )
  );

-- Bids: contractors can update own bids
CREATE POLICY "Contractors can update own bids"
  ON bids FOR UPDATE
  USING (auth.uid() = contractor_id);

-- Bids: clients can update bids on their projects (accept/reject)
CREATE POLICY "Clients can update bids on their projects"
  ON bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Projects: public bidding projects viewable by all authenticated users
CREATE POLICY "Public bidding projects viewable by all"
  ON projects FOR SELECT
  USING (
    status = 'bidding' AND is_public = true AND auth.uid() IS NOT NULL
  );

-- Service listings: active listings viewable by everyone
CREATE POLICY "Active service listings viewable by everyone"
  ON service_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = contractor_id);

-- Service listings: contractors manage own
CREATE POLICY "Contractors can insert own service listings"
  ON service_listings FOR INSERT
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update own service listings"
  ON service_listings FOR UPDATE
  USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can delete own service listings"
  ON service_listings FOR DELETE
  USING (auth.uid() = contractor_id);

-- ============================================================
-- PostGIS: find nearby bidding projects
-- ============================================================

CREATE OR REPLACE FUNCTION find_nearby_bidding_projects(
  user_lat FLOAT,
  user_long FLOAT,
  search_radius_meters INT DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  total_budget BIGINT,
  dist_meters FLOAT,
  client_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.total_budget,
    ST_Distance(p.location, ST_Point(user_long, user_lat)::geography) AS dist_meters,
    p.client_id,
    p.created_at
  FROM projects p
  WHERE p.location IS NOT NULL
    AND p.status = 'bidding'
    AND p.is_public = true
    AND ST_DWithin(p.location, ST_Point(user_long, user_lat)::geography, search_radius_meters)
  ORDER BY dist_meters ASC;
$$;
