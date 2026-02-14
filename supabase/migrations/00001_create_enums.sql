CREATE TYPE user_role AS ENUM ('client', 'contractor');
CREATE TYPE subscription_tier AS ENUM ('basic', 'pro', 'elite');
CREATE TYPE project_status AS ENUM ('bidding', 'active', 'completed', 'disputed');
CREATE TYPE milestone_status AS ENUM (
  'waiting_for_funds',
  'funded',
  'work_in_progress',
  'verification_pending',
  'released'
);
