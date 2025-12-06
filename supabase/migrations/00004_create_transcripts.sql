-- =============================================================================
-- Migration 00004: Transcript Entries
-- Individual utterances with detailed metadata
-- =============================================================================

CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Audio storage (if consent given)
  audio_url TEXT,
  audio_duration_ms INTEGER,
  audio_size_bytes INTEGER,

  -- Speech metrics
  duration_ms INTEGER,
  words_count INTEGER,
  words_per_minute REAL,

  -- STT confidence
  confidence_score REAL,  -- 0-1, from Deepgram
  language_detected TEXT,
  is_final BOOLEAN DEFAULT true,  -- vs interim transcript

  -- Analysis
  sentiment TEXT,  -- positive, negative, neutral
  sentiment_score REAL,  -- -1 to 1
  emotion TEXT,  -- happy, frustrated, confused, etc.

  -- For user turns
  grammar_errors JSONB,  -- Array of {error, correction, position}
  vocabulary_level TEXT,  -- basic, intermediate, advanced
  pronunciation_score REAL,  -- If available from STT
  fluency_score REAL,

  -- Token usage (for AI turns)
  tokens_used INTEGER,

  -- Timing
  latency_ms INTEGER,  -- Time from end of user speech to start of AI response
  processing_time_ms INTEGER,  -- STT or TTS processing time

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transcript_entries_conversation_id ON transcript_entries(conversation_id);
CREATE INDEX idx_transcript_entries_created_at ON transcript_entries(created_at);
CREATE INDEX idx_transcript_entries_role ON transcript_entries(role);

-- Full text search on content
CREATE INDEX idx_transcript_entries_content_search ON transcript_entries USING gin(to_tsvector('english', content));

-- RLS
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcripts" ON transcript_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = transcript_entries.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transcripts" ON transcript_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = transcript_entries.conversation_id
      AND c.user_id = auth.uid()
    )
  );
