-- =============================================================================
-- Migration 00002: User Profiles
-- Comprehensive user data with GDPR consent tracking
-- =============================================================================

CREATE TABLE user_profiles (
  -- Core identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- Language learning preferences
  target_language TEXT NOT NULL DEFAULT 'en',
  native_language TEXT NOT NULL DEFAULT 'es',
  level user_level NOT NULL DEFAULT 'beginner',
  speaking_speed REAL NOT NULL DEFAULT 1.0 CHECK (speaking_speed BETWEEN 0.5 AND 2.0),
  voice_preference TEXT DEFAULT 'default',
  topics_of_interest TEXT[] DEFAULT '{}',

  -- User metadata (for analytics)
  timezone TEXT,
  country_code TEXT,  -- ISO 3166-1 alpha-2
  signup_source TEXT,  -- Where they came from (utm_source, referral, etc.)
  signup_campaign TEXT,  -- utm_campaign
  signup_medium TEXT,  -- utm_medium
  referral_code TEXT,  -- If referred by another user
  referred_by_user_id UUID REFERENCES user_profiles(id),

  -- Device info (first device used)
  first_device_type TEXT,  -- mobile, tablet, desktop
  first_browser TEXT,
  first_os TEXT,

  -- Engagement metrics (aggregated for performance)
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_speaking_time_seconds INTEGER NOT NULL DEFAULT 0,
  total_words_spoken INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  last_conversation_at TIMESTAMPTZ,

  -- Gamification
  xp_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  badges JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',

  -- GDPR & Consent (CRITICAL - separate flags for granular control)
  gdpr_consent_at TIMESTAMPTZ,  -- NULL = no consent given
  gdpr_consent_ip TEXT,  -- IP at time of consent
  gdpr_consent_version TEXT DEFAULT '1.0',  -- Version of privacy policy accepted

  -- Specific consent flags (all default false until explicit consent)
  data_retention_consent BOOLEAN NOT NULL DEFAULT false,
  analytics_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  third_party_sharing_consent BOOLEAN NOT NULL DEFAULT false,  -- For data brokers etc.
  voice_data_storage_consent BOOLEAN NOT NULL DEFAULT false,  -- Store actual audio
  improvement_consent BOOLEAN NOT NULL DEFAULT false,  -- Use data to improve AI

  -- Account status
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_reason TEXT,
  deleted_at TIMESTAMPTZ,  -- Soft delete for GDPR data export window

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_country ON user_profiles(country_code);
CREATE INDEX idx_user_profiles_signup_source ON user_profiles(signup_source);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_last_conversation ON user_profiles(last_conversation_at DESC);
CREATE INDEX idx_user_profiles_referral ON user_profiles(referral_code) WHERE referral_code IS NOT NULL;

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
