#!/bin/bash
# Workshop Deployment Script with Auto-Cleanup
# Usage: ./DEPLOY.sh

set -e

echo "🚀 WORKSHOP DEPLOYMENT SCRIPT"
echo "=============================="
echo ""

# Step 1: Check and cleanup deployments
echo "🧹 Step 1: Checking deployment count..."
DEPLOY_COUNT=$(clasp deployments 2>/dev/null | grep -c "^- AKfycb" || echo "0")
echo "   Found $DEPLOY_COUNT deployments (max: 20)"

if [ "$DEPLOY_COUNT" -ge 18 ]; then
    echo "   ⚠️  Near limit! Auto-cleaning old deployments..."
    # Get deployment IDs (excluding @HEAD) sorted by version, take oldest 5
    clasp deployments | grep -E "@[0-9]+" | tail -5 | grep -oE "AKfycb[a-zA-Z0-9_-]+" | while read ID; do
        echo "   Deleting $ID..."
        clasp undeploy "$ID" 2>/dev/null || true
    done
    echo "   ✅ Cleanup complete!"
fi
echo ""

# Step 2: Push code
echo "📤 Step 2: Pushing code..."
clasp push
echo "✅ Code pushed!"
echo ""

# Step 3: Create deployment
echo "📦 Step 3: Creating new deployment..."
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
DEPLOY_OUTPUT=$(clasp deploy --description "Deploy $TIMESTAMP")
DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE 'AKfycb[a-zA-Z0-9_-]+' | head -1)
echo ""

# Step 4: Results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🆕 NEW URL (Works NOW):"
echo "https://script.google.com/macros/s/$DEPLOY_ID/exec"
echo ""
echo "🔖 @HEAD URL (Works in 5 min):"
echo "https://script.google.com/macros/s/AKfycbzoOXUoE8sB1WRhU4fp5N1p0NJ88Ef5SMTDreQrDMMa/exec"
echo ""
echo "⚠️  CACHE: New URL works NOW | @HEAD works in 3-5 min"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
