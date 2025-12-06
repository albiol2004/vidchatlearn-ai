-- =============================================================================
-- Migration 00006: Usage Records & Subscriptions
-- Billing and usage tracking
-- =============================================================================

-- Usage records (per billing period)
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage metrics
  stt_minutes REAL NOT NULL DEFAULT 0,
  tts_minutes REAL NOT NULL DEFAULT 0,
  llm_input_tokens INTEGER NOT NULL DEFAULT 0,
  llm_output_tokens INTEGER NOT NULL DEFAULT 0,

  -- Conversation stats
  conversations_count INTEGER NOT NULL DEFAULT 0,
  total_speaking_time_minutes REAL NOT NULL DEFAULT 0,
  total_words_spoken INTEGER NOT NULL DEFAULT 0,

  -- Cost tracking (in cents)
  stt_cost_cents INTEGER NOT NULL DEFAULT 0,
  tts_cost_cents INTEGER NOT NULL DEFAULT 0,
  llm_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, period_start DESC);

-- Subscriptions (synced with Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan details
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Limits (copied from plan for quick access)
  monthly_minutes_limit INTEGER,  -- NULL = unlimited
  monthly_conversations_limit INTEGER,

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Payment
  default_payment_method TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Payment history
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe data
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,

  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Status
  status TEXT NOT NULL,  -- paid, failed, refunded

  -- Details
  description TEXT,
  invoice_pdf_url TEXT,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);

-- RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
