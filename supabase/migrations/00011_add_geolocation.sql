-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location to contractors (home base / office)
ALTER TABLE contractors
  ADD COLUMN location geography(POINT, 4326),
  ADD COLUMN latitude FLOAT,
  ADD COLUMN longitude FLOAT;

CREATE INDEX contractors_geo_index ON contractors USING GIST (location);

-- Add location to projects (job site)
ALTER TABLE projects
  ADD COLUMN location geography(POINT, 4326),
  ADD COLUMN latitude FLOAT,
  ADD COLUMN longitude FLOAT,
  ADD COLUMN address TEXT;

CREATE INDEX projects_geo_index ON projects USING GIST (location);

-- Add check-in tracking to milestones
ALTER TABLE milestones
  ADD COLUMN check_in_lat FLOAT,
  ADD COLUMN check_in_lng FLOAT,
  ADD COLUMN check_in_on_site BOOLEAN,
  ADD COLUMN checked_in_at TIMESTAMPTZ;

-- Nearby contractors search function
CREATE OR REPLACE FUNCTION find_nearby_contractors(
  user_lat FLOAT,
  user_long FLOAT,
  search_radius_meters INT DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  dist_meters FLOAT,
  is_active_nearby BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.business_name,
    ST_Distance(c.location, ST_Point(user_long, user_lat)::geography) AS dist_meters,
    (ST_Distance(c.location, ST_Point(user_long, user_lat)::geography) < 5000) AS is_active_nearby
  FROM contractors c
  WHERE c.location IS NOT NULL
    AND ST_DWithin(c.location, ST_Point(user_long, user_lat)::geography, search_radius_meters)
  ORDER BY dist_meters ASC;
$$;

-- Nearby active projects function
CREATE OR REPLACE FUNCTION find_nearby_active_projects(
  user_lat FLOAT,
  user_long FLOAT,
  search_radius_meters INT DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  dist_meters FLOAT,
  contractor_id UUID
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    ST_Distance(p.location, ST_Point(user_long, user_lat)::geography) AS dist_meters,
    p.contractor_id
  FROM projects p
  WHERE p.location IS NOT NULL
    AND p.status = 'active'
    AND ST_DWithin(p.location, ST_Point(user_long, user_lat)::geography, search_radius_meters)
  ORDER BY dist_meters ASC;
$$;

-- Helper: update contractor location (sets geography from lat/lng)
CREATE OR REPLACE FUNCTION update_contractor_location(
  p_contractor_id UUID,
  p_lat FLOAT,
  p_long FLOAT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE contractors
  SET location = ST_Point(p_long, p_lat)::geography,
      latitude = p_lat,
      longitude = p_long
  WHERE id = p_contractor_id;
END;
$$;

-- Helper: update project location (sets geography from lat/lng)
CREATE OR REPLACE FUNCTION update_project_location(
  p_project_id UUID,
  p_lat FLOAT,
  p_long FLOAT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET location = ST_Point(p_long, p_lat)::geography,
      latitude = p_lat,
      longitude = p_long
  WHERE id = p_project_id;
END;
$$;

-- On-site check function (200m tolerance)
CREATE OR REPLACE FUNCTION check_on_site(
  contractor_lat FLOAT,
  contractor_long FLOAT,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_Point(contractor_long, contractor_lat)::geography,
        200
      )
  );
$$;
