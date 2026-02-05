#!/bin/bash

# MASTER DIRECTORY DEPLOYMENT SCRIPT
# Forces updates to the PERMANENT Deployment ID so the URL never changes.
# URL: https://script.google.com/macros/s/AKfycbzwArfpLNQnQIOgwuBKFeeCbdmc4m39kksuNL7TDF6_ljgGKdGoHgOGbEWuku8jbAdZag/exec

DEPLOYMENT_ID="AKfycbzwArfpLNQnQIOgwuBKFeeCbdmc4m39kksuNL7TDF6_ljgGKdGoHgOGbEWuku8jbAdZag"

echo "🚀 Deploying to MASTER DIRECTORY (Permanent Link)..."
clasp push --force
clasp deploy -i "$DEPLOYMENT_ID" --description "Master Directory Update $(date +'%Y-%m-%d %H:%M')"
echo "✅ Deployment Complete."
echo "🔗 Permanent Link: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
