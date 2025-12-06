-- =============================================================================
-- VidChatLearn AI - Database Schema
-- Migration 00001: Extensions and Enums
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE conversation_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE tip_category AS ENUM ('grammar', 'vocabulary', 'pronunciation', 'fluency', 'general');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'unlimited');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE event_type AS ENUM (
  'session_start',
  'session_end',
  'conversation_start',
  'conversation_end',
  'mic_enabled',
  'mic_disabled',
  'page_view',
  'feature_used',
  'error',
  'subscription_change',
  'settings_change'
);
