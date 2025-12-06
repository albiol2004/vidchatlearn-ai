# VidChatLearn AI - Project Structure

## Overview

A voice-based AI language learning application with real-time conversation capabilities.

## Tech Stack

### Frontend
| Technology | Purpose | Why |
|------------|---------|-----|
| **Vite + React 18** | Build & UI | Fastest build tool, excellent DX |
| **TypeScript** | Type safety | Catch errors early, better IDE support |
| **TanStack Query** | Server state | Caching, background sync, optimistic updates |
| **Zustand** | Client state | Minimal boilerplate, TypeScript-first |
| **Tailwind CSS** | Styling | Utility-first, fast iteration |
| **shadcn/ui** | Components | Accessible, customizable, not a dependency |
| **React Router v7** | Routing | File-based routing, loaders/actions |

### Backend & Services
| Service | Purpose | Why |
|---------|---------|-----|
| **Supabase** | Auth, DB, Storage | All-in-one, PostgreSQL, Row Level Security |
| **LiveKit** | Real-time voice | WebRTC abstraction, agents framework |
| **Deepgram** | STT | Best real-time accuracy, <300ms latency |
| **Cartesia** | TTS | Fastest TTFA (40-90ms), speed control |
| **OpenAI/Anthropic** | LLM | Conversation engine |
| **Stripe** | Billing | Industry standard, good React integration |

### DevOps
| Tool | Purpose |
|------|---------|
| **pnpm** | Package management |
| **GitHub Actions** | CI/CD |
| **Vercel** | Frontend hosting (free tier) |
| **Docker** | LiveKit agent containerization |

---

## Project Structure

```
vidchatlearn-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, typecheck, test on PR
│       ├── deploy-preview.yml     # Deploy preview on PR
│       └── deploy-production.yml  # Deploy on main merge
│
├── public/
│   ├── locales/                   # i18n translation files
│   │   ├── en.json
│   │   └── es.json
│   └── audio/
│       └── hello-cached/          # Pre-recorded greeting audio files
│           ├── en-beginner.mp3
│           ├── en-intermediate.mp3
│           └── ...
│
├── src/
│   ├── app/                       # App shell & providers
│   │   ├── App.tsx
│   │   ├── providers.tsx          # All context providers wrapped
│   │   └── routes.tsx             # Route definitions
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── features/                  # Feature modules (domain-driven)
│   │   │
│   │   ├── auth/                  # Authentication & account
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   └── AccountSettings.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── SignupPage.tsx
│   │   │   │   └── AccountPage.tsx
│   │   │   └── index.ts           # Public exports
│   │   │
│   │   ├── chat/                  # Voice chat feature
│   │   │   ├── components/
│   │   │   │   ├── ChatRoom.tsx           # Main chat container
│   │   │   │   ├── VoiceControls.tsx      # Mic, speaker controls
│   │   │   │   ├── TranscriptDisplay.tsx  # Live transcript
│   │   │   │   ├── AIAvatar.tsx           # Simple animated avatar
│   │   │   │   └── SpeedControl.tsx       # Adaptive speed UI
│   │   │   ├── hooks/
│   │   │   │   ├── useLiveKit.ts          # LiveKit connection
│   │   │   │   ├── useVoiceActivity.ts    # VAD detection
│   │   │   │   ├── useTranscript.ts       # Real-time transcript
│   │   │   │   └── useCachedGreeting.ts   # Play cached hello
│   │   │   ├── lib/
│   │   │   │   ├── livekit-client.ts      # LiveKit setup
│   │   │   │   └── audio-utils.ts         # Audio processing
│   │   │   ├── pages/
│   │   │   │   └── ChatPage.tsx
│   │   │   ├── store/
│   │   │   │   └── chatStore.ts           # Zustand store
│   │   │   └── index.ts
│   │   │
│   │   ├── conversations/         # Past conversations
│   │   │   ├── components/
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ConversationCard.tsx
│   │   │   │   ├── TranscriptViewer.tsx
│   │   │   │   ├── TipsPanel.tsx
│   │   │   │   └── ContinueButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useConversations.ts
│   │   │   │   └── useConversationTips.ts
│   │   │   ├── pages/
│   │   │   │   ├── ConversationsPage.tsx
│   │   │   │   └── ConversationDetailPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── billing/               # Stripe billing
│   │   │   ├── components/
│   │   │   │   ├── PricingTable.tsx
│   │   │   │   ├── SubscriptionStatus.tsx
│   │   │   │   ├── UsageDisplay.tsx
│   │   │   │   └── PaymentHistory.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSubscription.ts
│   │   │   │   └── useUsage.ts
│   │   │   ├── pages/
│   │   │   │   └── BillingPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── settings/              # User preferences
│   │       ├── components/
│   │       │   ├── LanguageSelector.tsx
│   │       │   ├── LevelSelector.tsx
│   │       │   ├── VoicePreferences.tsx
│   │       │   └── PrivacySettings.tsx
│   │       ├── hooks/
│   │       │   └── useUserPreferences.ts
│   │       ├── pages/
│   │       │   └── SettingsPage.tsx
│   │       └── index.ts
│   │
│   ├── lib/                       # External service clients
│   │   ├── supabase/
│   │   │   ├── client.ts          # Supabase client init
│   │   │   ├── auth.ts            # Auth helpers
│   │   │   ├── database.ts        # DB query helpers
│   │   │   └── storage.ts         # File storage helpers
│   │   ├── stripe/
│   │   │   └── client.ts          # Stripe.js init
│   │   └── analytics/
│   │       └── client.ts          # Privacy-compliant analytics
│   │
│   ├── hooks/                     # Shared hooks
│   │   ├── useMediaDevices.ts     # Mic/speaker selection
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── stores/                    # Global Zustand stores
│   │   ├── userStore.ts           # User preferences, level
│   │   └── uiStore.ts             # UI state (sidebar, modals)
│   │
│   ├── types/                     # TypeScript types
│   │   ├── database.ts            # Generated from Supabase
│   │   ├── api.ts                 # API response types
│   │   ├── chat.ts                # Chat-related types
│   │   └── index.ts
│   │
│   ├── utils/                     # Pure utility functions
│   │   ├── format.ts              # Date, time formatting
│   │   ├── validation.ts          # Form validation
│   │   ├── gdpr.ts                # GDPR consent helpers
│   │   └── constants.ts           # App constants
│   │
│   ├── styles/
│   │   └── globals.css            # Tailwind imports, CSS vars
│   │
│   ├── main.tsx                   # Entry point
│   └── vite-env.d.ts
│
├── supabase/                      # Supabase local development
│   ├── migrations/                # Database migrations
│   │   ├── 00001_create_users_profile.sql
│   │   ├── 00002_create_conversations.sql
│   │   ├── 00003_create_transcripts.sql
│   │   ├── 00004_create_tips.sql
│   │   └── 00005_create_usage_tracking.sql
│   │
│   ├── functions/                 # Edge Functions
│   │   ├── generate-tips/         # Async tip generation
│   │   │   └── index.ts
│   │   ├── livekit-token/         # Generate LiveKit tokens
│   │   │   └── index.ts
│   │   ├── stripe-webhook/        # Handle Stripe events
│   │   │   └── index.ts
│   │   └── usage-tracking/        # Track API usage
│   │       └── index.ts
│   │
│   ├── seed.sql                   # Development seed data
│   └── config.toml                # Supabase local config
│
├── livekit-agent/                 # LiveKit Agent (Python)
│   ├── agent.py                   # Main agent logic
│   ├── prompts/
│   │   ├── system.txt             # System prompt
│   │   └── levels/                # Per-level instructions
│   │       ├── beginner.txt
│   │       ├── intermediate.txt
│   │       └── advanced.txt
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── scripts/                       # Development scripts
│   ├── generate-types.sh          # Generate TS types from Supabase
│   ├── seed-dev.sh                # Seed development data
│   └── setup.sh                   # Initial project setup
│
├── tests/                         # Test files
│   ├── setup.ts
│   ├── components/
│   └── features/
│
├── .env.example                   # Environment variables template
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── docker-compose.yml             # Local Supabase + LiveKit
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## Database Schema

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  target_language TEXT NOT NULL DEFAULT 'en',
  native_language TEXT NOT NULL DEFAULT 'es',
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  speaking_speed REAL NOT NULL DEFAULT 1.0 CHECK (speaking_speed BETWEEN 0.5 AND 2.0),
  voice_preference TEXT DEFAULT 'default',
  gdpr_consent_at TIMESTAMPTZ,
  data_retention_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations (chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT,                          -- Auto-generated from first exchange
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  duration_seconds INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transcript entries (each exchange)
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,               -- The spoken text
  audio_url TEXT,                      -- Optional: stored audio file
  duration_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tips (generated after conversation)
CREATE TABLE conversation_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('grammar', 'vocabulary', 'pronunciation', 'fluency', 'general')),
  content TEXT NOT NULL,
  examples JSONB,                      -- Example corrections
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage tracking (for billing)
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stt_minutes REAL DEFAULT 0,
  tts_minutes REAL DEFAULT 0,
  llm_tokens INTEGER DEFAULT 0,
  conversations_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Subscriptions (synced from Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'unlimited')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX idx_transcript_entries_conversation_id ON transcript_entries(conversation_id);
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, period_start);
```

---

## Environment Variables

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only

# LiveKit
VITE_LIVEKIT_URL=wss://your-app.livekit.cloud
LIVEKIT_API_KEY=your-api-key                     # Server-side only
LIVEKIT_API_SECRET=your-api-secret               # Server-side only

# AI Services (server-side only, used by LiveKit Agent)
DEEPGRAM_API_KEY=your-deepgram-key
CARTESIA_API_KEY=your-cartesia-key
OPENAI_API_KEY=your-openai-key
# or ANTHROPIC_API_KEY=your-anthropic-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...                    # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...                  # Server-side only

# Analytics (optional, privacy-compliant)
VITE_PLAUSIBLE_DOMAIN=your-domain.com
```

---

## Key Architectural Decisions

### 1. Client-Side Processing
To minimize server costs and latency:
- **Audio capture**: Web Audio API in browser
- **VAD (Voice Activity Detection)**: `@ricky0123/vad-web` runs in browser
- **Audio encoding**: Opus codec client-side before sending
- **Cached greetings**: Pre-recorded MP3s served from CDN

### 2. Feature-Based Structure
Instead of flat folders, features are self-contained modules:
```
features/chat/
  ├── components/    # UI specific to chat
  ├── hooks/         # Logic specific to chat
  ├── pages/         # Route pages
  ├── store/         # Feature-specific state
  └── index.ts       # Clean public API
```
This scales better and makes code ownership clear.

### 3. State Management Strategy
| State Type | Solution |
|------------|----------|
| Server state (API data) | TanStack Query |
| Global UI state | Zustand |
| Form state | React Hook Form |
| URL state | React Router |

### 4. GDPR Compliance
- Explicit consent collection before any data storage
- Data export endpoint (`/api/gdpr/export`)
- Data deletion with cascade (`/api/gdpr/delete`)
- Minimal data collection policy
- Consent stored with timestamp in `user_profiles`
- Analytics: Plausible (cookieless, EU-hosted option)

### 5. Security
- All API keys server-side only (Supabase Edge Functions)
- Row Level Security (RLS) on all tables
- LiveKit tokens generated server-side with expiry
- Stripe webhooks verified with signature
- CORS configured for production domain only

---

## CI/CD Pipelines

### `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

### `.github/workflows/deploy-production.yml`
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "db:generate-types": "./scripts/generate-types.sh",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db reset && psql -f supabase/seed.sql"
  }
}
```

---

## Development Workflow

1. **Setup**
   ```bash
   pnpm install
   cp .env.example .env.local
   # Fill in API keys
   supabase start  # Local Supabase
   pnpm dev
   ```

2. **Database changes**
   ```bash
   # Create migration
   supabase migration new add_feature_x
   # Edit the migration file
   supabase db push
   # Regenerate TypeScript types
   pnpm db:generate-types
   ```

3. **Feature development**
   - Create feature folder under `src/features/`
   - Add components, hooks, pages
   - Export public API from `index.ts`
   - Add route to `src/app/routes.tsx`

---

## Future Considerations (Post-MVP)

- [ ] React Native port (shared business logic via feature modules)
- [ ] Offline mode with service worker
- [ ] Voice cloning for custom AI voices
- [ ] Gamification (streaks, achievements)
- [ ] Group conversation mode
- [ ] Teacher dashboard for classroom use
