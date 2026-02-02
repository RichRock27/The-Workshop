#!/bin/bash
# DEPLOY_FIXED.sh
# Deploys The Workshop updates to the PERMANENT Production URL (v30+).
# Usage: ./DEPLOY_FIXED.sh "Description of change"

DEPLOY_ID="AKfycbz2_GM5YGFsrotIauZUGWcTgbbzu-UjsA4gvr1mnKE5ubX-q8EMzTk09b7o5zOQ5gwXOA"

if [ -z "$1" ]; then
  echo "Error: Please provide a deployment description."
  echo "Usage: ./DEPLOY_FIXED.sh \"Description\""
  exit 1
fi

echo "Deploying to FIXED ID: $DEPLOY_ID"
clasp push
clasp deploy -i "$DEPLOY_ID" --description "$1"
echo "✅ Deployed. URL remains unchanged."
