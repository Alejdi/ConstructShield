-- Conversations: direct messaging between clients and contractors (pre-deal)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, contractor_id)
);

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  filtered_content TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_contractor ON conversations(contractor_id);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_dm_created ON direct_messages(created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Only participants can view their conversations
CREATE POLICY "Conversation participants can view"
  ON conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = contractor_id);

CREATE POLICY "Clients can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = contractor_id);

-- RLS: Only conversation participants can view/send direct messages
CREATE POLICY "DM participants can view"
  ON direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = direct_messages.conversation_id
      AND (conversations.client_id = auth.uid() OR conversations.contractor_id = auth.uid())
    )
  );

CREATE POLICY "DM participants can send"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = direct_messages.conversation_id
      AND (conversations.client_id = auth.uid() OR conversations.contractor_id = auth.uid())
    )
  );
