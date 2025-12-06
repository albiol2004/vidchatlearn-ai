# Complete Setup Guide - API Keys & Services

This guide walks you through setting up all external services for VidChatLearn AI.

---

## Table of Contents

1. [LiveKit (Real-time Communication)](#1-livekit-real-time-communication)
2. [Deepgram (Speech-to-Text)](#2-deepgram-speech-to-text)
3. [Cartesia (Text-to-Speech)](#3-cartesia-text-to-speech)
4. [LLM Provider (OpenAI or Anthropic)](#4-llm-provider)
5. [Stripe (Payments)](#5-stripe-payments)
6. [Vercel (Hosting)](#6-vercel-hosting)
7. [Environment Variables Summary](#7-environment-variables-summary)

---

## 1. LiveKit (Real-time Communication)

LiveKit handles WebRTC audio/video streaming. It's **fully open-source** with two options:

### Option A: LiveKit Cloud (Recommended for starting)

**Pros**: No server management, free tier, global edge network
**Cons**: Costs at scale

#### Steps:

1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Sign up with GitHub or email
3. Create a new project (e.g., "vidchatlearn-prod")
4. Go to **Settings > Keys**
5. Copy:
   - **WebSocket URL**: `wss://your-project-xxxxx.livekit.cloud`
   - **API Key**: `APIxxxxxxxx`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

#### Free Tier (until Jan 2026):
- 500 participant-minutes/month free
- No credit card required initially

#### Pricing After Free Tier:
- ~$0.004/participant-minute
- Bandwidth: ~$0.10/GB egress

---

### Option B: Self-Hosted on Your VPS

**Pros**: Full control, potentially cheaper at scale
**Cons**: You manage infrastructure

#### Requirements:
- VPS with 2+ CPU cores, 4GB+ RAM
- Docker installed
- Domain with SSL (Let's Encrypt)
- Ports: 443 (HTTPS), 7881 (TCP), 50000-60000 (UDP for WebRTC)

#### Steps:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Docker if not installed
curl -fsSL https://get.docker.com | sh

# Create directory
mkdir -p ~/livekit && cd ~/livekit

# Generate keys
docker run --rm livekit/livekit-server generate-keys
# Save the output! You'll get API_KEY and API_SECRET

# Create config file
cat > livekit.yaml << 'EOF'
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
redis:
  address: localhost:6379
keys:
  YOUR_API_KEY: YOUR_API_SECRET
EOF

# Run with Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped

  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-60000:50000-60000/udp"
    volumes:
      - ./livekit.yaml:/livekit.yaml
    command: --config /livekit.yaml
    depends_on:
      - redis
EOF

docker compose up -d
```

#### Add SSL with Caddy (reverse proxy):

```bash
# Install Caddy
sudo apt install -y caddy

# Configure
sudo tee /etc/caddy/Caddyfile << EOF
livekit.yourdomain.com {
    reverse_proxy localhost:7880
}
EOF

sudo systemctl restart caddy
```

Your WebSocket URL will be: `wss://livekit.yourdomain.com`

---

## 2. Deepgram (Speech-to-Text)

Deepgram provides real-time transcription with <300ms latency.

### Steps:

1. Go to [console.deepgram.com](https://console.deepgram.com)
2. Sign up (Google, GitHub, or email)
3. Verify email
4. Go to **API Keys** in the left sidebar
5. Click **Create a New API Key**
   - Name: `vidchatlearn-prod`
   - Permissions: Select specific permissions or "Member" for full access
   - Expiration: No expiration (or set one for security)
6. Copy the key immediately (shown only once!)

### Free Tier:
- **$200 credit** on signup (good for ~46,000 minutes of transcription)
- No credit card required
- Credits expire after 12 months if unused

### Pricing After Credits:
| Model | Real-time | Batch |
|-------|-----------|-------|
| Nova-2 | $0.0059/min | $0.0043/min |
| Nova-3 | $0.0077/min | $0.0056/min |

### Recommended Model:
Use **Nova-3** for best accuracy. In your LiveKit agent config:
```python
model="nova-3"
language="en"  # or "es", "fr", etc.
```

---

## 3. Cartesia (Text-to-Speech)

Cartesia provides ultra-low latency TTS (~40ms time-to-first-audio).

### Steps:

1. Go to [cartesia.ai](https://cartesia.ai)
2. Click **Get Started** or **Sign Up**
3. Sign up with email
4. Go to **Dashboard > API Keys**
5. Click **Create API Key**
6. Copy the key

### Free Tier:
- **20,000 characters/month** free
- Good for testing (~30-40 minutes of speech)

### Paid Plans:
| Plan | Price | Characters | Notes |
|------|-------|------------|-------|
| Free | $0 | 20K/mo | Personal use only |
| Pro | $5/mo | 100K/mo | Commercial use, voice cloning |
| Scale | Custom | Custom | Enterprise features |

### Voice Selection:
Cartesia has preset voices. For language learning, consider:
- Clear, neutral voices for beginners
- Native-speaker voices for each target language

Check available voices at: [play.cartesia.ai](https://play.cartesia.ai)

---

## 4. LLM Provider

Choose ONE of the following:

### Option A: DeepSeek (Recommended - Cheapest)

DeepSeek offers the best price-to-performance ratio, ~90% cheaper than competitors.

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up with email or Google
3. Go to **API Keys** in the dashboard
4. Click **Create API Key**
5. Copy the key
6. **Add credits**: Top up with as little as $5

#### Pricing:
| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| deepseek-chat | $0.14/1M | $0.28/1M | **Recommended** - extremely cheap |
| deepseek-reasoner | $0.55/1M | $2.19/1M | Complex reasoning tasks |

#### Why DeepSeek:
- **~10x cheaper** than GPT-4o-mini
- Quality comparable to GPT-4
- Fast response times
- OpenAI-compatible API (easy to switch)

#### API Endpoint:
```
Base URL: https://api.deepseek.com
```

---

### Option B: OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** (left sidebar or Settings)
4. Click **Create new secret key**
   - Name: `vidchatlearn`
5. Copy the key (starts with `sk-`)
6. **Add billing**: Settings > Billing > Add payment method

#### Pricing:
| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| gpt-4o-mini | $0.15/1M | $0.60/1M | Budget option |
| gpt-4o | $2.50/1M | $10/1M | Higher quality |

---

### Option C: Anthropic Claude

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up with email
3. Verify email and phone
4. Go to **API Keys**
5. Click **Create Key**
6. Copy the key (starts with `sk-ant-`)
7. **Add billing**: Settings > Plans & Billing

#### Pricing:
| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| claude-3-haiku | $0.25/1M | $1.25/1M | Fast & cheap |
| claude-3.5-sonnet | $3/1M | $15/1M | Best quality |

---

## 5. Stripe (Payments)

Stripe handles subscriptions and payments.

### Steps:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up with email
3. Verify email
4. **Don't activate live mode yet** - use test mode first

### Get Test Keys:

1. Make sure **Test mode** is toggled ON (top right)
2. Go to **Developers > API keys**
3. Copy:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click to reveal)

### Set Up Webhook:

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-supabase-project.functions.supabase.co/stripe-webhook`
   (You'll create this Edge Function later)
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret**: `whsec_...`

### Create Products (Test Mode):

1. Go to **Products**
2. Create products for your plans:

| Product | Price | Billing |
|---------|-------|---------|
| Starter | $9/month | Recurring |
| Pro | $29/month | Recurring |
| Unlimited | $49/month | Recurring |

3. Copy each **Price ID** (starts with `price_`)

### Going Live:
When ready for real payments:
1. Complete Stripe account activation (business info, bank account)
2. Switch to **Live mode**
3. Create live products/prices
4. Get live API keys
5. Update webhook with live signing secret

---

## 6. Vercel (Hosting)

Vercel deploys your React frontend.

### Steps:

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (easiest)
3. **Get API Token**:
   - Go to **Settings > Tokens**
   - Click **Create Token**
   - Name: `github-actions`
   - Scope: Full Account
   - Copy the token

4. **Create Project** (via CLI):
```bash
# Install Vercel CLI
pnpm add -g vercel

# In your project directory
cd /path/to/vidchatlearn-ai
vercel login
vercel link
# Follow prompts to create/link project
```

5. **Get Project/Org IDs**:
```bash
cat .vercel/project.json
```
Output:
```json
{
  "orgId": "team_xxxxx",
  "projectId": "prj_xxxxx"
}
```

6. **Add Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all `VITE_*` variables for Production

### Free Tier:
- Unlimited deployments for personal projects
- 100GB bandwidth/month
- Automatic HTTPS

---

## 7. Environment Variables Summary

### For `.env.local` (local development):

```bash
# Supabase (you already have these)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# LiveKit
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=xxxxx

# AI Services (for LiveKit Agent - server-side)
DEEPGRAM_API_KEY=xxxxx
CARTESIA_API_KEY=xxxxx
OPENAI_API_KEY=sk-xxxxx
# OR
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### For GitHub Secrets:

| Secret Name | Value |
|-------------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_LIVEKIT_URL` | LiveKit WebSocket URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |

### For Supabase Edge Functions:

Store these as Supabase secrets:
```bash
supabase secrets set LIVEKIT_API_KEY=xxx
supabase secrets set LIVEKIT_API_SECRET=xxx
supabase secrets set DEEPGRAM_API_KEY=xxx
supabase secrets set CARTESIA_API_KEY=xxx
supabase secrets set OPENAI_API_KEY=xxx
supabase secrets set STRIPE_SECRET_KEY=xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=xxx
```

---

## Cost Estimation

For **100 active users, 30 min/day average**:

| Service | Monthly Usage | Cost |
|---------|---------------|------|
| Deepgram (Nova-3) | ~1,500 hrs | ~$70 |
| Cartesia | ~1,500 hrs | ~$45 |
| OpenAI (gpt-4o-mini) | ~90M tokens | ~$15 |
| LiveKit Cloud | ~90,000 mins | ~$360 (or free until 2026) |
| Supabase Pro | - | $25 |
| Vercel | - | $0 (free tier) |
| Stripe | 2.9% + $0.30/txn | Variable |
| **Total** | | **~$155-515/mo** |

Self-hosting LiveKit on a $20-50/mo VPS saves significantly at scale.

---

## Quick Start Checklist

- [ ] LiveKit: Get WebSocket URL + API Key + Secret
- [ ] Deepgram: Get API Key ($200 free credit)
- [ ] Cartesia: Get API Key (20K chars free)
- [ ] OpenAI: Get API Key + add billing
- [ ] Stripe: Get test keys + create webhook
- [ ] Vercel: Get token + project/org IDs
- [ ] Update `.env.local` with all keys
- [ ] Add GitHub secrets
- [ ] Add Supabase secrets for Edge Functions
