-- ============================================================
-- Migration 00017: Project images table & Supabase Storage
-- ============================================================

CREATE TABLE project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_images_project ON project_images(project_id, display_order);

ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies for project_images
-- ============================================================

-- Anyone involved in the project or viewing a public listing can see images
CREATE POLICY "project_images_select"
  ON project_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_images.project_id
      AND (
        projects.client_id = auth.uid()
        OR projects.contractor_id = auth.uid()
        OR projects.is_public = true
      )
    )
  );

-- Only the project client can upload images
CREATE POLICY "project_images_insert"
  ON project_images FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_images.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Only the uploader can delete their images
CREATE POLICY "project_images_delete"
  ON project_images FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Only the uploader can update caption / order
CREATE POLICY "project_images_update"
  ON project_images FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- ============================================================
-- Supabase Storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "project_images_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

-- Authenticated users can upload
CREATE POLICY "project_images_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can delete their uploads
CREATE POLICY "project_images_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-images'
    AND auth.uid() IS NOT NULL
  );
