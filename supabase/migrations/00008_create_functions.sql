-- Calculate platform fee (5%)
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount BIGINT)
RETURNS BIGINT AS $$
BEGIN
  RETURN (amount * 5) / 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Milestone state machine with validation
CREATE OR REPLACE FUNCTION transition_milestone_status(
  p_milestone_id UUID,
  p_new_status milestone_status,
  p_user_id UUID
)
RETURNS milestones AS $$
DECLARE
  v_milestone milestones;
  v_project projects;
BEGIN
  SELECT * INTO v_milestone FROM milestones WHERE id = p_milestone_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = v_milestone.project_id;

  -- Validate state transitions
  CASE v_milestone.status
    WHEN 'waiting_for_funds' THEN
      IF p_new_status != 'funded' THEN
        RAISE EXCEPTION 'Can only transition from waiting_for_funds to funded';
      END IF;
      IF v_project.client_id != p_user_id THEN
        RAISE EXCEPTION 'Only the client can fund milestones';
      END IF;
    WHEN 'funded' THEN
      IF p_new_status != 'work_in_progress' THEN
        RAISE EXCEPTION 'Can only transition from funded to work_in_progress';
      END IF;
      IF v_project.contractor_id != p_user_id THEN
        RAISE EXCEPTION 'Only the contractor can start work';
      END IF;
    WHEN 'work_in_progress' THEN
      IF p_new_status != 'verification_pending' THEN
        RAISE EXCEPTION 'Can only transition from work_in_progress to verification_pending';
      END IF;
      IF v_project.contractor_id != p_user_id THEN
        RAISE EXCEPTION 'Only the contractor can submit proof';
      END IF;
    WHEN 'verification_pending' THEN
      IF p_new_status != 'released' THEN
        RAISE EXCEPTION 'Can only transition from verification_pending to released';
      END IF;
      IF v_project.client_id != p_user_id THEN
        RAISE EXCEPTION 'Only the client can release funds';
      END IF;
    ELSE
      RAISE EXCEPTION 'Milestone is in a terminal state';
  END CASE;

  UPDATE milestones
  SET status = p_new_status,
      updated_at = now(),
      funded_at = CASE WHEN p_new_status = 'funded' THEN now() ELSE funded_at END,
      released_at = CASE WHEN p_new_status = 'released' THEN now() ELSE released_at END
  WHERE id = p_milestone_id
  RETURNING * INTO v_milestone;

  RETURN v_milestone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
