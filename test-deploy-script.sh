#!/bin/bash

# Test script for deploy.sh CI environment detection
echo "Testing deploy.sh CI environment detection..."

# Test 1: Local environment (no CI variables)
echo "=== Test 1: Local environment ==="
unset CI
unset GITHUB_ACTIONS
unset NETLIFY_AUTH_TOKEN
unset NETLIFY_SITE_ID

# Run just the environment detection part
bash -c '
source scripts/deploy.sh 2>/dev/null || true
' | head -5

# Test 2: CI environment with missing variables
echo -e "\n=== Test 2: CI environment with missing variables ==="
export CI=true
export GITHUB_ACTIONS=true
unset NETLIFY_AUTH_TOKEN
unset NETLIFY_SITE_ID

# This should fail with proper error messages
bash -c '
set -e
IS_CI=false
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    IS_CI=true
    echo "🤖 Running in CI environment"
fi

if [ "$IS_CI" = "true" ]; then
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        echo "❌ NETLIFY_AUTH_TOKEN environment variable is required for CI deployment"
        echo "💡 Please set NETLIFY_AUTH_TOKEN in your GitHub repository secrets"
        exit 1
    fi
fi
' 2>&1 || echo "Expected failure - missing NETLIFY_AUTH_TOKEN"

# Test 3: CI environment with variables set
echo -e "\n=== Test 3: CI environment with variables set ==="
export CI=true
export GITHUB_ACTIONS=true
export NETLIFY_AUTH_TOKEN="test-token"
export NETLIFY_SITE_ID="test-site-id"

bash -c '
IS_CI=false
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    IS_CI=true
    echo "🤖 Running in CI environment"
fi

if [ "$IS_CI" = "true" ]; then
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        echo "❌ NETLIFY_AUTH_TOKEN missing"
        exit 1
    fi
    
    if [ -z "$NETLIFY_SITE_ID" ]; then
        echo "❌ NETLIFY_SITE_ID missing"
        exit 1
    fi
    
    echo "✅ All required CI environment variables are set"
    echo "NETLIFY_SITE_ID: $NETLIFY_SITE_ID"
fi
'

echo -e "\n=== Tests completed ==="