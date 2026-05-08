#!/bin/bash
# Overworld Online: Build → Deploy → Verify
# Usage: ./deploy.sh [--skip-build] [--skip-check]

set -e

UNITY="/Applications/Unity/Hub/Editor/6000.0.66f2/Unity.app/Contents/MacOS/Unity"
PROJECT="/Users/drbango/wkspaces/Boo"
BUILD_OUTPUT="/Users/drbango/DrBango/world-unity"
DEPLOY_TARGET="/Users/drbango/DrBango/world/Build"
DEPLOY_URL="https://drbango.com/world"
REPO_DIR="/Users/drbango/DrBango"

SKIP_BUILD=false
SKIP_CHECK=false
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --skip-check) SKIP_CHECK=true ;;
    esac
done

echo "═══════════════════════════════════════"
echo "  OVERWORLD ONLINE — DEPLOY PIPELINE"
echo "═══════════════════════════════════════"

# ── Step 1: Build ──
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "▶ Step 1: Unity WebGL Build..."
    echo "  Project: $PROJECT"
    echo "  Output:  $BUILD_OUTPUT"
    echo ""

    "$UNITY" \
        -batchmode \
        -projectPath "$PROJECT" \
        -executeMethod CLIBuild.WebGL \
        -quit \
        -logFile - 2>&1 | tee /tmp/unity-build.log

    BUILD_EXIT=${PIPESTATUS[0]}
    if [ $BUILD_EXIT -ne 0 ]; then
        echo "🚨 BUILD FAILED (exit $BUILD_EXIT). Check /tmp/unity-build.log"
        exit 1
    fi
    echo "✅ Build succeeded."
else
    echo "▶ Step 1: Skipped (--skip-build)"
fi

# ── Step 2: Copy build to deploy target ──
echo ""
echo "▶ Step 2: Copying build artifacts..."
if [ -d "$BUILD_OUTPUT/Build" ]; then
    cp -v "$BUILD_OUTPUT/Build/"* "$DEPLOY_TARGET/"
    echo "✅ Build artifacts copied."
elif [ -d "$BUILD_OUTPUT" ]; then
    # Sometimes Unity outputs directly without Build/ subfolder
    mkdir -p "$DEPLOY_TARGET"
    cp -v "$BUILD_OUTPUT/"*.unityweb "$DEPLOY_TARGET/" 2>/dev/null || true
    cp -v "$BUILD_OUTPUT/"*.js "$DEPLOY_TARGET/" 2>/dev/null || true
    echo "✅ Build artifacts copied (flat layout)."
else
    echo "🚨 Build output not found at $BUILD_OUTPUT"
    exit 1
fi

# ── Step 3: Git commit & push ──
echo ""
echo "▶ Step 3: Deploying to GitHub Pages..."
cd "$REPO_DIR"
git add world/
git commit -m "deploy: Overworld Online WebGL build $(date '+%Y-%m-%d %H:%M')" || echo "(no changes to commit)"
git push origin main
echo "✅ Pushed to GitHub."

# ── Step 4: Wait for GitHub Pages ──
echo ""
echo "▶ Step 4: Waiting 30s for GitHub Pages to propagate..."
sleep 30

# ── Step 5: Post-deploy health check ──
if [ "$SKIP_CHECK" = false ]; then
    echo ""
    echo "▶ Step 5: Post-deploy health check..."
    if command -v npx &> /dev/null; then
        cd "$REPO_DIR/world"
        node post-deploy-check.js "$DEPLOY_URL" --wait=45
        CHECK_EXIT=$?
        if [ $CHECK_EXIT -ne 0 ]; then
            echo ""
            echo "🚨 HEALTH CHECK FAILED — deploy may be broken!"
            exit 1
        fi
    else
        echo "⚠️  npx not found — skipping health check. Install Node.js for automated verification."
    fi
else
    echo "▶ Step 5: Skipped (--skip-check)"
fi

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ DEPLOY COMPLETE"
echo "  $DEPLOY_URL"
echo "═══════════════════════════════════════"
