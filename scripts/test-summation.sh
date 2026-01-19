#!/bin/bash
# Test script for running unbarrelify against the Summation web-app
#
# NOTES:
# - This is an existing clone, so we just reset git status
# - Uses yarn as package manager
# - Uses path aliases (~/* -> ./app/*)
# - Extension auto-detection should preserve no-extension imports
# - Files outside --cwd are never deleted (e.g., shared-types package)
#
# Verification: Uses `yarn build` which succeeds on clean repo.
# (yarn typecheck has pre-existing errors due to Node version mismatch)

set -e

SUMMATION_DIR="/Users/lars/p/summation/code"
WEB_APP_DIR="$SUMMATION_DIR/js/apps/web-app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== unbarrelify Summation Web-App Test Script ==="
echo ""

# Step 1: Reset git status in summation repo
echo "Step 1: Resetting git status..."
git -C "$SUMMATION_DIR" checkout -- js/

# Step 2: Verify build passes BEFORE unbarrelify
echo "Step 2: Verifying build passes before unbarrelify..."
pushd "$WEB_APP_DIR" > /dev/null
yarn build
popd > /dev/null

# Step 3: Run unbarrelify (dry-run first)
echo "Step 3: Running unbarrelify (dry-run)..."
npx tsx "$PROJECT_DIR/src/cli.ts" --cwd "$WEB_APP_DIR/app" -g "**/*.ts" -g "**/*.tsx"

# Step 4: Run unbarrelify with write
echo "Step 4: Running unbarrelify (write mode)..."
npx tsx "$PROJECT_DIR/src/cli.ts" --cwd "$WEB_APP_DIR/app" -g "**/*.ts" -g "**/*.tsx" --write

# Step 5: Verify build still passes AFTER unbarrelify
echo "Step 5: Verifying build passes after unbarrelify..."
pushd "$WEB_APP_DIR" > /dev/null
yarn build
popd > /dev/null

echo ""
echo "=== SUCCESS: Summation web-app builds correctly after unbarrelify ==="
