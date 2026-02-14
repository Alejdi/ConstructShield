-- Profiles: anyone can read, anyone can insert (needed for signup trigger), owner can update
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Contractors: public read, owner update
CREATE POLICY "Contractors are viewable by everyone"
  ON contractors FOR SELECT USING (true);
CREATE POLICY "Contractors can update own record"
  ON contractors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Contractors can insert own record"
  ON contractors FOR INSERT WITH CHECK (true);

-- Projects: participants can read, client can create and update
CREATE POLICY "Project participants can view"
  ON projects FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = contractor_id);
CREATE POLICY "Clients can create projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Client can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = client_id);

-- Milestones: project participants can read, client can manage
CREATE POLICY "Milestone participants can view"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = milestones.project_id
      AND (projects.client_id = auth.uid() OR projects.contractor_id = auth.uid())
    )
  );
CREATE POLICY "Client can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = milestones.project_id
      AND projects.client_id = auth.uid()
    )
  );
CREATE POLICY "Client can update milestones"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = milestones.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Messages: project participants can read and create
CREATE POLICY "Message participants can view"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.contractor_id = auth.uid())
    )
  );
CREATE POLICY "Project participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.contractor_id = auth.uid())
    )
  );
