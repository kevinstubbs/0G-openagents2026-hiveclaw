#!/usr/bin/env bash
# Start selected RBV OpenClaw gateways, open Control UI tabs, and print copy/paste prompts
# for the ~2-minute shared-memory demo (run-scoped segments via RUN_ID).
#
# Usage:
#   bash demo/rbv/scripts/preopen-demo.sh
#   bash demo/rbv/scripts/preopen-demo.sh --roles researcher,reviewer
#   RUN_ID=my-run-1 bash demo/rbv/scripts/preopen-demo.sh
#   bash demo/rbv/scripts/preopen-demo.sh --run-id my-run-1 --dry-run
#
# Requires: openclaw on PATH; env files demo/rbv/env/<role>.env per started role.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

ROLES_ARG=""
RUN_ID="${RUN_ID:-}"
START_GATEWAYS=1
OPEN_BROWSER=1
DRY_RUN=0

usage() {
  sed -n '1,80p' "$0" | sed -n '/^#/p' | head -20
}

die() {
  echo "preopen-demo.sh: $*" >&2
  exit 1
}

port_for_role() {
  case "$1" in
    researcher) echo 18789 ;;
    builder) echo 18790 ;;
    reviewer) echo 18791 ;;
    *) echo "" ;;
  esac
}

valid_role() {
  case "$1" in
    researcher | builder | reviewer) return 0 ;;
    *) return 1 ;;
  esac
}

open_urls() {
  local url
  for url in "$@"; do
    if command -v open >/dev/null 2>&1; then
      open "$url" || true
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url" || true
    else
      echo "(Install 'open' or 'xdg-open' to auto-open browser; URL: $url)"
    fi
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --roles)
      ROLES_ARG="${2:-}"
      shift 2
      ;;
    --run-id)
      RUN_ID="${2:-}"
      shift 2
      ;;
    --no-start)
      START_GATEWAYS=0
      shift
      ;;
    --no-open)
      OPEN_BROWSER=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      START_GATEWAYS=0
      OPEN_BROWSER=0
      shift
      ;;
    *)
      die "unknown option: $1 (try --help)"
      ;;
  esac
done

if [[ -z "$ROLES_ARG" ]]; then
  ROLES_ARG="researcher,reviewer"
fi

IFS=',' read -r -a ROLES <<<"$ROLES_ARG"
if [[ ${#ROLES[@]} -lt 2 ]]; then
  die "--roles must list at least two roles (comma-separated), e.g. researcher,reviewer"
fi

for r in "${ROLES[@]}"; do
  r="$(echo "$r" | tr -d '[:space:]')"
  if ! valid_role "$r"; then
    die "invalid role '$r' (use researcher, builder, or reviewer)"
  fi
done

ROLE_A="${ROLES[0]}"
ROLE_B="${ROLES[1]}"

PORT_A="$(port_for_role "$ROLE_A")"
PORT_B="$(port_for_role "$ROLE_B")"
[[ -n "$PORT_A" && -n "$PORT_B" ]] || die "internal: port lookup failed"

if [[ -z "$RUN_ID" ]]; then
  RUN_ID="$(date +%Y%m%d-%H%M%S)"
fi

# Segment paths must stay filesystem-ish safe; disallow slashes.
case "$RUN_ID" in
  *[/\\]* | '') die "RUN_ID must be non-empty and must not contain '/' or '\\'" ;;
esac

LOG_DIR="$REPO_ROOT/demo/rbv/.openclaw-state/logs"
mkdir -p "$LOG_DIR"

cd "$REPO_ROOT"

if [[ "$DRY_RUN" -eq 0 ]] && [[ "$START_GATEWAYS" -eq 1 ]]; then
  if ! command -v openclaw >/dev/null 2>&1; then
    die "openclaw not found on PATH (install OpenClaw CLI)"
  fi

  for role in "${ROLES[@]}"; do
    role="$(echo "$role" | tr -d '[:space:]')"
    env_file="demo/rbv/env/${role}.env"
    [[ -f "$env_file" ]] || die "missing $env_file — copy from ${env_file}.example and fill secrets (see demo/rbv/README.md)"

    pid_file="demo/rbv/.openclaw-state/${role}.gateway.pid"
    port="$(port_for_role "$role")"
    if command -v lsof >/dev/null 2>&1; then
      if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
        echo "Warning: something already listens on port $port ($role). Skip starting this gateway or stop the other process." >&2
      fi
    fi

    log_file="$LOG_DIR/${role}.log"
    echo "Starting gateway: role=$role port=$port log=$log_file"
    (
      set -a
      # shellcheck disable=SC1090
      source "$REPO_ROOT/$env_file"
      set +a
      export OPENCLAW_CONFIG_PATH="$REPO_ROOT/demo/rbv/gateways/${role}.openclaw.json"
      export OPENCLAW_STATE_DIR="$REPO_ROOT/demo/rbv/.openclaw-state/${role}"
      mkdir -p "$OPENCLAW_STATE_DIR"
      exec >>"$log_file" 2>&1
      exec openclaw gateway
    ) &
    gateway_pid=$!
    echo "$gateway_pid" >"$REPO_ROOT/$pid_file"
    echo "  pid=$gateway_pid (saved $pid_file)"
  done
fi

URLS=()
for role in "${ROLES[@]}"; do
  role="$(echo "$role" | tr -d '[:space:]')"
  p="$(port_for_role "$role")"
  URLS+=("http://127.0.0.1:${p}/")
done

if [[ "$OPEN_BROWSER" -eq 1 ]] && [[ "$DRY_RUN" -eq 0 ]]; then
  echo ""
  echo "Opening Control UI tabs..."
  open_urls "${URLS[@]}"
fi

SEG_FINDINGS="demo/runs/${RUN_ID}/findings"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2-minute shared memory demo — copy/paste prompts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "RUN_ID=$RUN_ID"
echo "Segment (shared): $SEG_FINDINGS"
echo "Gateway A: $ROLE_A → http://127.0.0.1:${PORT_A}/"
echo "Gateway B: $ROLE_B → http://127.0.0.1:${PORT_B}/"
echo ""
echo "Paste gateway token in each tab: Overview → Gateway Access (same OPENCLAW_GATEWAY_TOKEN in each env file)."
echo ""
echo "--- Message 1 → $ROLE_A (writer) — paste into chat ---"
cat <<EOF
Use RUN_ID=${RUN_ID}. Write exactly 2 bullets about local multi-gateway coordination into shared segment ${SEG_FINDINGS}, then stop. Use HiveClaw memory tools (remember_shared). Echo RUN_ID=${RUN_ID} in your reply.
EOF
echo ""
echo "--- Message 1 → $ROLE_B (recall) — paste after A finishes ---"
cat <<EOF
Use RUN_ID=${RUN_ID}. Recall shared segment ${SEG_FINDINGS}. Return: (1) the exact recalled bullets, (2) echo RUN_ID=${RUN_ID}, (3) one sentence stating this came from shared memory via recall_shared, then stop.
EOF
echo ""
echo "--- Optional message 2 → $ROLE_A (only if bullets unclear) ---"
cat <<EOF
Rewrite ${SEG_FINDINGS} as exactly 2 short bullets; include RUN_ID=${RUN_ID}; then stop.
EOF
echo ""
echo "--- Optional message 2 → $ROLE_B (only if attribution unclear) ---"
cat <<EOF
Repeat recall for ${SEG_FINDINGS}; echo segment name and RUN_ID=${RUN_ID}; confirm recall_shared; then stop.
EOF
echo ""
echo "Logs (copy paths):"
for role in "${ROLES[@]}"; do
  r="$(echo "$role" | tr -d '[:space:]')"
  echo "  $r → $LOG_DIR/${r}.log"
done
echo ""
echo "PID files:"
for role in "${ROLES[@]}"; do
  r="$(echo "$role" | tr -d '[:space:]')"
  echo "  $r → $REPO_ROOT/demo/rbv/.openclaw-state/${r}.gateway.pid"
done
echo ""
echo "Stop gateways (copy one line per role; omit if you did not start via this script):"
for role in "${ROLES[@]}"; do
  r="$(echo "$role" | tr -d '[:space:]')"
  echo "kill \$(cat \"$REPO_ROOT/demo/rbv/.openclaw-state/${r}.gateway.pid\")"
done
echo "(Or close the terminals where you ran openclaw gateway manually.)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
