#!/usr/bin/env bash
# Streak — one-line installer for macOS / Linux.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/kranthi0003/streak/main/install.sh | bash
#
# What this does:
#   1. Clones (or updates) the Streak repo into ~/Documents/Streak-source
#   2. Runs `npm install` (one-time, ~30 s)
#   3. Builds the Chrome and Firefox extensions
#   4. Copies the unpacked Chrome build to ~/Streak-Extension  (visible folder)
#   5. Tries to open chrome://extensions for you
#
# What you still need to do (Chrome's security forbids skipping):
#   * Toggle "Developer mode" ON in chrome://extensions
#   * Click "Load unpacked"
#   * Pick the folder: ~/Streak-Extension

set -euo pipefail

REPO_URL="https://github.com/kranthi0003/streak.git"
SOURCE_DIR="${HOME}/Documents/Streak-source"
INSTALL_DIR="${HOME}/Streak-Extension"

# ---- pretty output -----------------------------------------------------------
cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }

cyan ""
cyan "  ╔═══════════════════════════════════════╗"
cyan "  ║   Streak — One-line installer         ║"
cyan "  ╚═══════════════════════════════════════╝"
cyan ""

# ---- check dependencies ------------------------------------------------------
need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    red "Missing required tool: $1"
    case "$1" in
      git)
        echo "  Install: https://git-scm.com/download"
        ;;
      node)
        echo "  Install: https://nodejs.org/  (or 'brew install node' on macOS)"
        echo "  Streak needs Node 18 or newer."
        ;;
      npm)
        echo "  npm ships with Node.js. Reinstall Node."
        ;;
    esac
    exit 1
  fi
}
need git
need node
need npm

# Check Node version is >= 18
node_major=$(node -p "process.versions.node.split('.')[0]")
if [ "$node_major" -lt 18 ]; then
  red "Node.js 18 or newer is required. You have: $(node -v)"
  echo "  Upgrade: https://nodejs.org/"
  exit 1
fi

# ---- clone / update ----------------------------------------------------------
if [ -d "$SOURCE_DIR/.git" ]; then
  cyan "→ Updating existing source in $SOURCE_DIR"
  git -C "$SOURCE_DIR" pull --quiet --ff-only || {
    red "git pull failed. Delete $SOURCE_DIR and run the installer again."
    exit 1
  }
else
  cyan "→ Cloning Streak into $SOURCE_DIR"
  mkdir -p "$(dirname "$SOURCE_DIR")"
  git clone --quiet "$REPO_URL" "$SOURCE_DIR"
fi

cd "$SOURCE_DIR"

# ---- install deps ------------------------------------------------------------
cyan "→ Installing dependencies (this can take ~30 seconds the first time)"
npm install --silent --no-fund --no-audit

# ---- build -------------------------------------------------------------------
cyan "→ Building Chrome extension"
npm run build --silent
cyan "→ Building Firefox extension"
npm run build:firefox --silent

# ---- copy to install dir -----------------------------------------------------
cyan "→ Copying build to $INSTALL_DIR"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -R dist/chrome-mv3 "$INSTALL_DIR/Chrome"
cp -R dist/firefox-mv2 "$INSTALL_DIR/Firefox"

# ---- finish ------------------------------------------------------------------
green ""
green "✓ Streak is built and ready to install."
green ""
yellow "  Next steps (one-time setup, Chrome forces this):"
echo "    1. Open Chrome"
echo "    2. Visit:  chrome://extensions"
echo "    3. Toggle 'Developer mode' ON  (top-right of that page)"
echo "    4. Click 'Load unpacked'"
echo "    5. Select this folder:  $INSTALL_DIR/Chrome"
echo "    6. Pin the Streak icon to your toolbar"
echo ""
yellow "  For Firefox:  about:debugging → Load Temporary Add-on → $INSTALL_DIR/Firefox/manifest.json"
echo ""

# Try to open Chrome at the extensions page (best-effort, doesn't fail if Chrome isn't installed)
if [ "$(uname)" = "Darwin" ]; then
  if open -Ra "Google Chrome" 2>/dev/null; then
    open -a "Google Chrome" "chrome://extensions" 2>/dev/null || true
    green "  → Opened chrome://extensions for you."
  fi
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "chrome://extensions" >/dev/null 2>&1 || true
fi

cyan ""
cyan "  After install, click the Streak icon to see your streak."
cyan "  Enable Strict Mode in Settings to lock protection for N days."
cyan ""
