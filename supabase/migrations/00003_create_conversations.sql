-- =============================================================================
-- Migration 00003: Conversations
-- Detailed conversation tracking with comprehensive metrics
-- =============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Conversation metadata
  title TEXT,  -- Auto-generated from first exchange
  language TEXT NOT NULL,
  level user_level NOT NULL,
  topic TEXT,  -- Conversation topic/scenario
  scenario_id TEXT,  -- If using predefined scenarios
  status conversation_status NOT NULL DEFAULT 'active',

  -- Timing metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,

  -- Speaking metrics - User
  user_speaking_time_ms INTEGER NOT NULL DEFAULT 0,
  user_words_spoken INTEGER NOT NULL DEFAULT 0,
  user_sentences_count INTEGER NOT NULL DEFAULT 0,
  user_avg_words_per_minute REAL,
  user_avg_sentence_length REAL,
  user_vocabulary_unique_count INTEGER NOT NULL DEFAULT 0,

  -- Speaking metrics - AI
  ai_speaking_time_ms INTEGER NOT NULL DEFAULT 0,
  ai_words_spoken INTEGER NOT NULL DEFAULT 0,

  -- Interaction metrics
  total_turns INTEGER NOT NULL DEFAULT 0,  -- Back and forth count
  silence_time_ms INTEGER NOT NULL DEFAULT 0,
  interruptions_count INTEGER NOT NULL DEFAULT 0,  -- User interrupted AI
  hesitations_count INTEGER NOT NULL DEFAULT 0,  -- "um", "uh" detected

  -- Quality metrics
  corrections_count INTEGER NOT NULL DEFAULT 0,
  grammar_errors_count INTEGER NOT NULL DEFAULT 0,
  pronunciation_issues_count INTEGER NOT NULL DEFAULT 0,
  vocabulary_suggestions_count INTEGER NOT NULL DEFAULT 0,

  -- AI usage
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  llm_input_tokens INTEGER NOT NULL DEFAULT 0,
  llm_output_tokens INTEGER NOT NULL DEFAULT 0,
  stt_minutes REAL NOT NULL DEFAULT 0,
  tts_minutes REAL NOT NULL DEFAULT 0,

  -- Session context
  session_id TEXT,  -- Links to user_sessions
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  connection_type TEXT,  -- wifi, 4g, etc.

  -- Feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  reported_issues TEXT[],

  -- AI performance
  avg_response_latency_ms INTEGER,
  max_response_latency_ms INTEGER,
  stt_errors_count INTEGER NOT NULL DEFAULT 0,
  tts_errors_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_language ON conversations(language);
CREATE INDEX idx_conversations_user_date ON conversations(user_id, started_at DESC);

-- For analytics queries
CREATE INDEX idx_conversations_duration ON conversations(duration_seconds) WHERE status = 'completed';
CREATE INDEX idx_conversations_rating ON conversations(user_rating) WHERE user_rating IS NOT NULL;

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);
