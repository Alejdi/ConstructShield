-- ============================================================
-- Migration 00022: Contractor reputation score
-- ============================================================

-- Add reputation_score column to contractors (0-100)
ALTER TABLE contractors
  ADD COLUMN reputation_score SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX idx_contractors_reputation ON contractors(reputation_score DESC);

-- ============================================================
-- Function: recalculate_reputation(contractor_id)
-- Computes a 0-100 composite score from:
--   - Average rating (0-50 pts)
--   - Review volume  (0-20 pts, logarithmic)
--   - Completion rate (0-20 pts)
--   - Verified bonus  (0-10 pts)
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_reputation(p_contractor_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_review_count BIGINT;
  v_completed BIGINT;
  v_disputed BIGINT;
  v_verified BOOLEAN;
  v_rating_pts NUMERIC;
  v_volume_pts NUMERIC;
  v_completion_pts NUMERIC;
  v_verified_pts NUMERIC;
  v_score SMALLINT;
BEGIN
  -- Average rating and count
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM reviews
   WHERE contractor_id = p_contractor_id;

  -- Project completion stats
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'disputed')
    INTO v_completed, v_disputed
    FROM projects
   WHERE contractor_id = p_contractor_id
     AND status IN ('completed', 'disputed');

  -- Verified status
  SELECT verified INTO v_verified
    FROM contractors
   WHERE id = p_contractor_id;

  -- Rating points: avg_rating / 5 * 50 (max 50)
  v_rating_pts := CASE WHEN v_review_count > 0
    THEN (v_avg_rating / 5.0) * 50
    ELSE 0
  END;

  -- Volume points: logarithmic scale up to 20 (reaches ~20 at 50+ reviews)
  v_volume_pts := CASE WHEN v_review_count > 0
    THEN LEAST(LN(v_review_count + 1) / LN(51) * 20, 20)
    ELSE 0
  END;

  -- Completion rate points: completed / (completed + disputed) * 20
  v_completion_pts := CASE WHEN (v_completed + v_disputed) > 0
    THEN (v_completed::NUMERIC / (v_completed + v_disputed)) * 20
    ELSE 0
  END;

  -- Verified bonus
  v_verified_pts := CASE WHEN v_verified THEN 10 ELSE 0 END;

  v_score := LEAST(ROUND(v_rating_pts + v_volume_pts + v_completion_pts + v_verified_pts), 100)::SMALLINT;

  -- Update the stored score
  UPDATE contractors SET reputation_score = v_score WHERE id = p_contractor_id;

  RETURN v_score;
END;
$$;

-- ============================================================
-- Trigger: auto-recalculate on new review
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  PERFORM recalculate_reputation(NEW.contractor_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_reputation
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_reputation();
