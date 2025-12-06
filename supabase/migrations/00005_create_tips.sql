-- =============================================================================
-- Migration 00005: Conversation Tips
-- AI-generated learning insights
-- =============================================================================

CREATE TABLE conversation_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Tip content
  category tip_category NOT NULL,
  title TEXT,
  content TEXT NOT NULL,

  -- Context
  original_text TEXT,  -- What the user said
  corrected_text TEXT,  -- Corrected version
  explanation TEXT,  -- Why it's wrong/better
  examples JSONB,  -- Example sentences

  -- Source
  transcript_entry_id UUID REFERENCES transcript_entries(id) ON DELETE SET NULL,

  -- Prioritization
  priority INTEGER NOT NULL DEFAULT 0,  -- Higher = more important
  is_recurring BOOLEAN DEFAULT false,  -- User makes this mistake often
  occurrence_count INTEGER DEFAULT 1,  -- How many times in this conversation

  -- User interaction
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  is_helpful BOOLEAN,  -- User feedback

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_tips_conversation_id ON conversation_tips(conversation_id);
CREATE INDEX idx_conversation_tips_category ON conversation_tips(category);
CREATE INDEX idx_conversation_tips_priority ON conversation_tips(priority DESC);

-- RLS
ALTER TABLE conversation_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tips" ON conversation_tips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_tips.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tips" ON conversation_tips
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_tips.conversation_id
      AND c.user_id = auth.uid()
    )
  );
