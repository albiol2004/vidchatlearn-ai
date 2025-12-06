# VidChatLearn AI

AI-powered voice conversation app for language learning.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State**: TanStack Query (server), Zustand (client)
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Real-time Voice**: LiveKit, Deepgram (STT), Cartesia (TTS)
- **Payments**: Stripe
- **CI/CD**: GitHub Actions, Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI (optional, for local dev)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
pnpm dev
```

### Available Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm typecheck    # TypeScript type checking
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format code with Prettier
pnpm test         # Run tests
```

## GitHub Setup

### 1. Create Repository

```bash
# Create a new repo on GitHub, then:
git remote add origin git@github.com:YOUR_USERNAME/vidchatlearn-ai.git
git push -u origin main
```

### 2. Add Repository Secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_LIVEKIT_URL` | LiveKit WebSocket URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### 3. Create Vercel Project

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project (follow prompts)
vercel link

# Get project/org IDs for secrets
cat .vercel/project.json
```

### 4. Configure Branch Protection (Recommended)

Go to **Settings > Branches > Add rule**:
- Branch name: `main`
- Require status checks: `Lint & Typecheck`, `Test`, `Build`
- Require pull request before merging

## Project Structure

See [STRUCTURE.md](./STRUCTURE.md) for detailed architecture documentation.

```
src/
├── app/              # App shell, providers, routes
├── components/       # Shared UI components
├── features/         # Feature modules
│   ├── auth/         # Authentication
│   ├── chat/         # Voice chat
│   ├── conversations/# History & transcripts
│   ├── billing/      # Stripe integration
│   └── settings/     # User preferences
├── lib/              # External service clients
├── hooks/            # Shared hooks
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── utils/            # Utilities

supabase/
├── migrations/       # Database migrations (9 files)
├── functions/        # Edge Functions
└── config.toml       # Local config
```

## Database

The database schema includes comprehensive tracking for:
- User profiles with GDPR consent management
- Conversations with detailed metrics
- Transcripts with sentiment analysis
- Learning tips and vocabulary tracking
- Usage records and billing
- Analytics events (with consent)
- Daily/weekly progress snapshots

### Migrations

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
pnpm db:generate-types
```

## External Services Setup

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Enable Google OAuth in Authentication settings
3. Run migrations via CLI or SQL editor

### LiveKit

1. Create account at [livekit.io](https://livekit.io)
2. Create a project
3. Get API key and secret for agent

### Deepgram (STT)

1. Sign up at [deepgram.com](https://deepgram.com)
2. Create API key
3. Use Nova-3 model for best results

### Cartesia (TTS)

1. Sign up at [cartesia.ai](https://cartesia.ai)
2. Create API key
3. Use Sonic model for low latency

### Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get publishable and secret keys
3. Set up webhook endpoint

## License

Private - All rights reserved
