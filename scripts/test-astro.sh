#!/bin/bash
# Test script for running unbarrelify against the Astro monorepo
# This script clones Astro, installs deps, builds, runs our tool, and verifies the build still works
#
# NOTES:
# - Astro uses pnpm workspaces, so we MUST use pnpm (not npm)
# - Node 24+ has native TypeScript support via --experimental-strip-types
# - We ignore node_modules and dist directories in glob patterns
# - Dynamically imported barrels are preserved (not deleted)

set -e

ASTRO_DIR="/tmp/astro"
ASTRO_PKG="$ASTRO_DIR/packages/astro"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== unbarrelify Astro Test Script ==="
echo ""

# Step 1: Clean up any previous test
echo "Step 1: Cleaning up previous test..."
rm -rf "$ASTRO_DIR"

# Step 2: Clone Astro at specific version
echo "Step 2: Cloning Astro v4.11.0..."
git clone --depth 1 --branch astro@4.11.0 git@github.com:withastro/astro.git "$ASTRO_DIR" 2>&1

# Step 3: Install dependencies with pnpm (Astro uses pnpm workspaces)
echo "Step 3: Installing dependencies with pnpm..."
pnpm install --dir "$ASTRO_DIR"

# Step 4: Build all packages
echo "Step 4: Building Astro packages..."
pnpm --dir "$ASTRO_DIR" run build

# Step 5: Verify astro package builds before our changes
echo "Step 5: Verifying astro package builds before unbarrelify..."
pnpm --dir "$ASTRO_PKG" run build

# Step 6: Run unbarrelify
echo "Step 6: Running unbarrelify..."
cd "$PROJECT_DIR"
# Node 24+ has native TypeScript support via --experimental-strip-types
# Note: --ext is now optional - extension is auto-detected from original imports
node --experimental-strip-types src/cli.ts --cwd "$ASTRO_PKG" --write

# Step 7: Verify astro package still builds after our changes
echo "Step 7: Verifying astro package builds after unbarrelify..."
pnpm --dir "$ASTRO_PKG" run build

echo ""
echo "=== SUCCESS: Astro builds correctly after unbarrelify ==="
