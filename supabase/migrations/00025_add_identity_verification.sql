-- Identity verification for clients (ID document) and contractors (TIN)

-- 1. Create verification_status enum
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');

-- 2. Add verification columns to profiles (for clients)
ALTER TABLE profiles
  ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN id_document_path TEXT,
  ADD COLUMN id_document_type TEXT,
  ADD COLUMN verification_rejected_reason TEXT,
  ADD COLUMN verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN verification_reviewed_at TIMESTAMPTZ;

-- 3. Add verification columns to contractors
ALTER TABLE contractors
  ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN tax_id TEXT,
  ADD COLUMN verification_rejected_reason TEXT,
  ADD COLUMN verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN verification_reviewed_at TIMESTAMPTZ;

-- 4. Sync contractors.verified boolean with verification_status enum
CREATE OR REPLACE FUNCTION sync_contractor_verified()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status = 'approved' THEN
    NEW.verified = true;
  ELSE
    NEW.verified = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_contractor_verification_status_change
  BEFORE UPDATE OF verification_status ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION sync_contractor_verified();

-- 5. Backfill already-verified contractors
UPDATE contractors
  SET verification_status = 'approved'
  WHERE verified = true;

-- 6. Update handle_new_user trigger to include verification_status
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'unverified'
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'contractor' THEN
    INSERT INTO public.contractors (id, verification_status)
    VALUES (NEW.id, 'unverified');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create private storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. RLS policies for id-documents bucket
CREATE POLICY "Users can upload own id document"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own id documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own id documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'id-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
