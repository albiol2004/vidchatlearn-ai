#!/bin/bash
# ===========================================
# VidChatLearn AI - Deployment Script
# ===========================================
# Usage: ./scripts/deploy.sh

set -e

# Configuration
VPS_USER="root"
VPS_HOST="69.62.122.245"
VPS_PATH="/root/vidchat"
SSH_TARGET="${VPS_USER}@${VPS_HOST}"

echo "=========================================="
echo "  VidChatLearn AI - Deployment"
echo "=========================================="

# Step 1: Build locally
echo ""
echo "[1/4] Building application..."
pnpm build

# Step 2: Sync dist folder to VPS
echo ""
echo "[2/4] Syncing dist to VPS..."
rsync -avz --delete dist/ ${SSH_TARGET}:${VPS_PATH}/dist/

# Step 3: Sync .env file (if it exists and hasn't been synced)
if [ -f ".env" ]; then
    echo ""
    echo "[3/4] Syncing .env file..."
    rsync -avz .env ${SSH_TARGET}:${VPS_PATH}/.env
else
    echo ""
    echo "[3/4] No .env file found, skipping..."
fi

# Step 4: Reload nginx (in case of config changes)
echo ""
echo "[4/4] Reloading nginx..."
ssh ${SSH_TARGET} "systemctl reload nginx"

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "=========================================="
echo ""
echo "  App URL: http://${VPS_HOST}:3001"
echo "  LiveKit: ws://${VPS_HOST}:7880"
echo ""
