-- =============================================================================
-- Migration 00009: GDPR Helper Functions
-- Data export and deletion functions
-- =============================================================================

-- Export all user data (GDPR Article 20 - Right to data portability)
CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verify caller is the user or has admin rights
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only export own data';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', NOW(),
    'user_id', target_user_id,
    'profile', (SELECT row_to_json(p) FROM user_profiles p WHERE id = target_user_id),
    'conversations', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM conversations c WHERE user_id = target_user_id
    ),
    'transcripts', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM transcript_entries t
      JOIN conversations c ON c.id = t.conversation_id
      WHERE c.user_id = target_user_id
    ),
    'tips', (
      SELECT COALESCE(jsonb_agg(row_to_json(tip)), '[]'::jsonb)
      FROM conversation_tips tip
      JOIN conversations c ON c.id = tip.conversation_id
      WHERE c.user_id = target_user_id
    ),
    'vocabulary', (
      SELECT COALESCE(jsonb_agg(row_to_json(v)), '[]'::jsonb)
      FROM vocabulary_items v WHERE user_id = target_user_id
    ),
    'usage_records', (
      SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      FROM usage_records u WHERE user_id = target_user_id
    ),
    'subscription', (
      SELECT row_to_json(s) FROM subscriptions s WHERE user_id = target_user_id
    ),
    'payment_history', (
      SELECT COALESCE(jsonb_agg(row_to_json(ph)), '[]'::jsonb)
      FROM payment_history ph WHERE user_id = target_user_id
    ),
    'daily_progress', (
      SELECT COALESCE(jsonb_agg(row_to_json(dp)), '[]'::jsonb)
      FROM daily_progress dp WHERE user_id = target_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Anonymize user data (soft delete - keeps aggregated data for analytics)
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is the user
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only anonymize own data';
  END IF;

  -- Anonymize profile
  UPDATE user_profiles SET
    email = 'deleted_' || target_user_id || '@deleted.local',
    display_name = 'Deleted User',
    avatar_url = NULL,
    timezone = NULL,
    country_code = NULL,
    signup_source = NULL,
    signup_campaign = NULL,
    first_device_type = NULL,
    first_browser = NULL,
    first_os = NULL,
    referral_code = NULL,
    referred_by_user_id = NULL,
    deleted_at = NOW()
  WHERE id = target_user_id;

  -- Delete sensitive session data
  UPDATE user_sessions SET
    ip_address = NULL,
    city = NULL
  WHERE user_id = target_user_id;

  -- Delete transcript content (keep metadata for aggregates)
  UPDATE transcript_entries SET
    content = '[DELETED]',
    audio_url = NULL
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE user_id = target_user_id
  );

  -- Delete vocabulary
  DELETE FROM vocabulary_items WHERE user_id = target_user_id;
END;
$$;

-- Complete deletion (GDPR Article 17 - Right to erasure)
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is the user
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete own data';
  END IF;

  -- Delete from auth.users triggers cascade delete on user_profiles
  -- which cascades to all related tables
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Log consent changes
CREATE TABLE consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- No FK to allow logging after deletion

  consent_type TEXT NOT NULL,  -- gdpr, marketing, analytics, etc.
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,

  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_audit_log_user_id ON consent_audit_log(user_id);

-- Function to update consent with audit
CREATE OR REPLACE FUNCTION update_consent(
  consent_type TEXT,
  new_value BOOLEAN,
  client_ip TEXT DEFAULT NULL,
  client_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_val BOOLEAN;
BEGIN
  -- Get current value
  EXECUTE format(
    'SELECT %I FROM user_profiles WHERE id = $1',
    consent_type || '_consent'
  ) INTO old_val USING auth.uid();

  -- Update profile
  EXECUTE format(
    'UPDATE user_profiles SET %I = $1, updated_at = NOW() WHERE id = $2',
    consent_type || '_consent'
  ) USING new_value, auth.uid();

  -- If this is GDPR consent, also update timestamp
  IF consent_type = 'gdpr' AND new_value = true THEN
    UPDATE user_profiles SET
      gdpr_consent_at = NOW(),
      gdpr_consent_ip = client_ip
    WHERE id = auth.uid();
  END IF;

  -- Log the change
  INSERT INTO consent_audit_log (user_id, consent_type, old_value, new_value, ip_address, user_agent)
  VALUES (auth.uid(), consent_type, old_val, new_value, client_ip, client_user_agent);
END;
$$;
