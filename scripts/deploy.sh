#!/bin/bash
# ===========================================
# VidChatLearn AI - Deployment Script
# ===========================================
# Usage: ./scripts/deploy.sh
# Or via git: ssh to VPS and run: cd /root/vidchat && git pull && pnpm build && ./scripts/deploy-vps.sh

set -e

# Configuration
VPS_USER="root"
VPS_HOST="alejandrogarcia.blog"
VPS_REPO="/root/vidchat"
VPS_WWW="/var/www/vidchat"
SSH_TARGET="${VPS_USER}@${VPS_HOST}"

echo "=========================================="
echo "  VidChatLearn AI - Deployment"
echo "=========================================="

# Step 1: Pull latest code on VPS
echo ""
echo "[1/4] Pulling latest code on VPS..."
ssh ${SSH_TARGET} "cd ${VPS_REPO} && git pull"

# Step 2: Install dependencies and build on VPS
echo ""
echo "[2/4] Building on VPS..."
ssh ${SSH_TARGET} "cd ${VPS_REPO} && source ~/.nvm/nvm.sh && pnpm install && pnpm build"

# Step 3: Copy dist to web root
echo ""
echo "[3/4] Deploying to web root..."
ssh ${SSH_TARGET} "rm -rf ${VPS_WWW}/* && cp -r ${VPS_REPO}/dist/* ${VPS_WWW}/ && chown -R www-data:www-data ${VPS_WWW}"

# Step 4: Restart nginx
echo ""
echo "[4/4] Restarting nginx..."
ssh ${SSH_TARGET} "systemctl restart nginx"

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "=========================================="
echo ""
echo "  App URL: http://${VPS_HOST}:3001"
echo "  LiveKit: ws://${VPS_HOST}:7880"
echo ""
