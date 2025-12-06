-- =============================================================================
-- Migration 00007: Analytics Events
-- Comprehensive user behavior tracking (requires analytics_consent)
-- =============================================================================

-- User sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,  -- NULL for anonymous

  -- Session identification
  session_token TEXT UNIQUE NOT NULL,

  -- Device info
  device_type TEXT,  -- mobile, tablet, desktop
  device_brand TEXT,
  device_model TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_width INTEGER,
  screen_height INTEGER,

  -- Location (approximate, from IP)
  country_code TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,

  -- Network
  connection_type TEXT,  -- wifi, 4g, 3g, etc.
  ip_address TEXT,  -- Store only if consent given

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  landing_page TEXT,

  -- Session metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views_count INTEGER NOT NULL DEFAULT 0,
  events_count INTEGER NOT NULL DEFAULT 0,
  is_bounce BOOLEAN,  -- Single page view, no interaction

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_utm_source ON user_sessions(utm_source) WHERE utm_source IS NOT NULL;

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,

  -- Event details
  event_type event_type NOT NULL,
  event_name TEXT NOT NULL,  -- More specific event name

  -- Context
  page_path TEXT,
  page_title TEXT,
  component TEXT,  -- Which UI component triggered this

  -- Event data
  properties JSONB DEFAULT '{}',  -- Flexible event-specific data

  -- Timing
  client_timestamp TIMESTAMPTZ,  -- From client
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For conversation events
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_properties ON analytics_events USING gin(properties);

-- Page views (separate for performance)
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,

  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer_path TEXT,

  -- Time on page
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  time_on_page_seconds INTEGER,

  -- Scroll depth
  scroll_depth_percent INTEGER,  -- 0-100

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_page_path ON page_views(page_path);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);

-- Error logs
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Error details
  error_type TEXT NOT NULL,  -- js_error, api_error, stt_error, tts_error
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Context
  page_path TEXT,
  component TEXT,
  action TEXT,  -- What was user trying to do

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- User impact
  is_fatal BOOLEAN DEFAULT false,
  user_saw_error BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- RLS (service role for inserts, user can read own data)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own page views" ON page_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);
