-- =============================================================================
-- Migration 00008: Vocabulary & Learning Progress
-- Track words learned and user progress over time
-- =============================================================================

-- Vocabulary learned
CREATE TABLE vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Word details
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  part_of_speech TEXT,  -- noun, verb, adjective, etc.
  definition TEXT,
  example_sentence TEXT,
  pronunciation_ipa TEXT,

  -- Learning context
  first_encountered_in UUID REFERENCES conversations(id) ON DELETE SET NULL,
  first_encountered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Spaced repetition
  times_seen INTEGER NOT NULL DEFAULT 1,
  times_used_correctly INTEGER NOT NULL DEFAULT 0,
  times_used_incorrectly INTEGER NOT NULL DEFAULT 0,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,

  -- Difficulty
  user_difficulty_rating INTEGER CHECK (user_difficulty_rating BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, word, language)
);

CREATE INDEX idx_vocabulary_items_user_id ON vocabulary_items(user_id);
CREATE INDEX idx_vocabulary_items_language ON vocabulary_items(language);
CREATE INDEX idx_vocabulary_items_mastery ON vocabulary_items(mastery_level);
CREATE INDEX idx_vocabulary_items_review ON vocabulary_items(next_review_at) WHERE next_review_at IS NOT NULL;

-- Daily progress snapshots
CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Activity
  conversations_count INTEGER NOT NULL DEFAULT 0,
  speaking_time_minutes INTEGER NOT NULL DEFAULT 0,
  words_spoken INTEGER NOT NULL DEFAULT 0,

  -- Learning
  new_vocabulary_count INTEGER NOT NULL DEFAULT 0,
  vocabulary_reviewed_count INTEGER NOT NULL DEFAULT 0,
  tips_received_count INTEGER NOT NULL DEFAULT 0,

  -- Quality
  avg_fluency_score REAL,
  avg_pronunciation_score REAL,
  grammar_errors_count INTEGER NOT NULL DEFAULT 0,

  -- Streak
  is_active_day BOOLEAN NOT NULL DEFAULT false,  -- Met minimum goal

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date DESC);

-- Weekly/monthly aggregates (for faster dashboards)
CREATE TABLE weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,  -- Monday of the week

  -- Aggregates
  conversations_count INTEGER NOT NULL DEFAULT 0,
  speaking_time_minutes INTEGER NOT NULL DEFAULT 0,
  words_spoken INTEGER NOT NULL DEFAULT 0,
  new_vocabulary_count INTEGER NOT NULL DEFAULT 0,
  active_days_count INTEGER NOT NULL DEFAULT 0,

  -- Averages
  avg_session_length_minutes REAL,
  avg_fluency_score REAL,

  -- Comparison
  improvement_vs_last_week_percent REAL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_progress_user_week ON weekly_progress(user_id, week_start DESC);

-- RLS
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vocabulary" ON vocabulary_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily progress" ON daily_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weekly progress" ON weekly_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_vocabulary_items_updated_at
  BEFORE UPDATE ON vocabulary_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
