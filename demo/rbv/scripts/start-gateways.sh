#!/usr/bin/env bash
# Prints commands to run three OpenClaw gateways in separate terminals.
# Usage: bash demo/rbv/scripts/start-gateways.sh
set -euo pipefail

# start-gateways.sh lives at demo/rbv/scripts/ — repo root is three levels up.
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$REPO_ROOT"

echo "Repository root: $REPO_ROOT"
echo ""
echo "This script only prints commands; it does not read or write .env files."
echo "Create env files from templates if missing (never overwrites existing):"
echo "  test -f demo/rbv/env/researcher.env  || cp demo/rbv/env/researcher.env.example demo/rbv/env/researcher.env"
echo "  test -f demo/rbv/env/builder.env     || cp demo/rbv/env/builder.env.example demo/rbv/env/builder.env"
echo "  test -f demo/rbv/env/reviewer.env   || cp demo/rbv/env/reviewer.env.example demo/rbv/env/reviewer.env"
echo ""
echo "=== Terminal 1 — Researcher (port 18789) ==="
cat <<EOF
cd $REPO_ROOT
set -a && source demo/rbv/env/researcher.env && set +a
export OPENCLAW_CONFIG_PATH="\$PWD/demo/rbv/gateways/researcher.openclaw.json"
export OPENCLAW_STATE_DIR="\$PWD/demo/rbv/.openclaw-state/researcher"
mkdir -p "\$OPENCLAW_STATE_DIR"
openclaw gateway
EOF
echo ""
echo "=== Terminal 2 — Builder (port 18790) ==="
cat <<EOF
cd $REPO_ROOT
set -a && source demo/rbv/env/builder.env && set +a
export OPENCLAW_CONFIG_PATH="\$PWD/demo/rbv/gateways/builder.openclaw.json"
export OPENCLAW_STATE_DIR="\$PWD/demo/rbv/.openclaw-state/builder"
mkdir -p "\$OPENCLAW_STATE_DIR"
openclaw gateway
EOF
echo ""
echo "=== Terminal 3 — Reviewer (port 18791) ==="
cat <<EOF
cd $REPO_ROOT
set -a && source demo/rbv/env/reviewer.env && set +a
export OPENCLAW_CONFIG_PATH="\$PWD/demo/rbv/gateways/reviewer.openclaw.json"
export OPENCLAW_STATE_DIR="\$PWD/demo/rbv/.openclaw-state/reviewer"
mkdir -p "\$OPENCLAW_STATE_DIR"
openclaw gateway
EOF
