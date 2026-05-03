#!/usr/bin/env bash
# Interactive video demo: press Enter to run each HiveClaw CLI step (no OpenClaw).
# Uses node apps/hiveclaw-cli/dist/cli.js (same as pnpm run doctor) with per-role .env
# files for different chain wallets. Shared memory is read with the same hive key (all roles).
#
# Prereqs: from repo root, pnpm run build; fill demo/rbv/env/researcher.env and reviewer.env;
# optional: root .env for HIVECLAW_RPC_URL, HIVECLAW_HIVE_REGISTRY_CONTRACT, etc. (see .env.example).
#
# Usage:
#   bash demo/rbv/scripts/interactive-cli-demo.sh
#   bash demo/rbv/scripts/interactive-cli-demo.sh --auto   # no Enter prompts (CI / verification)
#   RUN_ID=custom-id bash demo/rbv/scripts/interactive-cli-demo.sh
#   HIVE_ID=42 bash demo/rbv/scripts/interactive-cli-demo.sh
set -euo pipefail

die() {
  echo "interactive-cli-demo.sh: $*" >&2
  exit 1
}

DEMO_AUTO=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto | -y) DEMO_AUTO=1 ;;
    -h | --help)
      sed -n '1,20p' "$0" | sed -n '/^#/p'
      exit 0
      ;;
    *) die "unknown option: $1 (use --auto for non-interactive run)" ;;
  esac
  shift
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

HIVECLAW_CLI="${HIVECLAW_CLI:-$REPO_ROOT/apps/hiveclaw-cli/dist/cli.js}"
GATEWAY_JSON="${GATEWAY_JSON:-$REPO_ROOT/demo/rbv/gateways/researcher.openclaw.json}"
RUN_ID="${RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
SEG="demo/runs/${RUN_ID}/findings"

[[ -f "$HIVECLAW_CLI" ]] || die "missing $HIVECLAW_CLI — run: pnpm run build (from repo root)"

HIVE_ID="${HIVE_ID:-}"
if [[ -z "$HIVE_ID" ]]; then
  if command -v jq >/dev/null 2>&1; then
    HIVE_ID="$(jq -r '.plugins.entries.hiveclaw.config.defaultHiveId // empty' "$GATEWAY_JSON" 2>/dev/null || true)"
  fi
  if [[ -z "$HIVE_ID" || "$HIVE_ID" == "null" ]]; then
    HIVE_ID="$(
      sed -n 's/.*"defaultHiveId"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$GATEWAY_JSON" | head -1
    )"
  fi
fi
[[ -n "$HIVE_ID" ]] || die "set HIVE_ID or fix defaultHiveId in $GATEWAY_JSON"

# Fill RPC / registry / bootstrap / indexer from gateway JSON when not set in .env (CLI reads env only).
fill_chain_env_from_gateway() {
  local gj="$1"
  [[ -f "$gj" ]] || return 0
  local rpc reg boot idx
  if command -v jq >/dev/null 2>&1; then
    rpc="$(jq -r '.plugins.entries.hiveclaw.config.rpcUrl // empty' "$gj" 2>/dev/null)"
    reg="$(jq -r '.plugins.entries.hiveclaw.config.hiveRegistryContract // empty' "$gj" 2>/dev/null)"
    boot="$(jq -r '.plugins.entries.hiveclaw.config.bootstrapContract // empty' "$gj" 2>/dev/null)"
    idx="$(jq -r '.plugins.entries.hiveclaw.config.indexerUrl // empty' "$gj" 2>/dev/null)"
  else
    rpc="$(sed -n 's/.*"rpcUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$gj" | head -1)"
    reg="$(sed -n 's/.*"hiveRegistryContract"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$gj" | head -1)"
    boot="$(sed -n 's/.*"bootstrapContract"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$gj" | head -1)"
    idx="$(sed -n 's/.*"indexerUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$gj" | head -1)"
  fi
  [[ -z "${HIVECLAW_RPC_URL:-}" && -n "$rpc" ]] && HIVECLAW_RPC_URL="$rpc"
  [[ -z "${HIVECLAW_HIVE_REGISTRY_CONTRACT:-}" && -n "$reg" ]] && HIVECLAW_HIVE_REGISTRY_CONTRACT="$reg"
  [[ -z "${HIVECLAW_BOOTSTRAP_CONTRACT:-}" && -n "$boot" ]] && HIVECLAW_BOOTSTRAP_CONTRACT="$boot"
  [[ -z "${HIVECLAW_INDEXER_URL:-}" && -n "$idx" ]] && HIVECLAW_INDEXER_URL="$idx"
}

# shellcheck disable=SC1091
hive_cli() {
  local env_rel="$1"
  shift
  (
    cd "$REPO_ROOT"
    set -a
    [[ -f "$REPO_ROOT/.env" ]] && source "$REPO_ROOT/.env"
    fill_chain_env_from_gateway "$GATEWAY_JSON"
    source "$REPO_ROOT/$env_rel"
    fill_chain_env_from_gateway "$GATEWAY_JSON"
    node "$HIVECLAW_CLI" "$@"
  )
}

preview_command() {
  local env_label="$1"
  shift
  echo "  # env: $env_label"
  echo -n "  "
  printf '%q ' node "$HIVECLAW_CLI" "$@"
  echo ""
}

wait_enter() {
  if [[ "$DEMO_AUTO" -eq 1 ]]; then
    return 0
  fi
  read -r -p "Press Enter to run this step… "
}

banner() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

step() {
  local title="$1"
  local desc="$2"
  local env_label="$3"
  shift 3
  banner "$title"
  echo "$desc"
  echo ""
  preview_command "$env_label" "$@"
  echo ""
  wait_enter
  echo ""
  hive_cli "$env_label" "$@"
  echo ""
}

echo ""
echo "HiveClaw CLI interactive demo (OpenClaw not used)"
echo "Repo: $REPO_ROOT"
echo "CLI:  $HIVECLAW_CLI"
echo "RUN_ID=$RUN_ID"
echo "Segment (shared): $SEG"
echo "hiveId: $HIVE_ID"
echo ""
echo "Tip: keep this terminal full-screen for recording."
if [[ "$DEMO_AUTO" -eq 1 ]]; then
  echo "(Running with --auto: no Enter prompts.)"
fi
echo ""

step \
  "Step 1 — connectivity" \
  "Run doctor: RPC, registry, storage smoke (quick sanity check)." \
  "demo/rbv/env/researcher.env" \
  doctor

step \
  "Step 2 — list hives (Researcher wallet)" \
  "Same wallet as demo/rbv/env/researcher.env; shows hive ids this address belongs to." \
  "demo/rbv/env/researcher.env" \
  hive my

banner "Step 3 — read shared memory (before write)"
echo "Try to decrypt the latest shared segment. If nothing was committed yet, this may error — that is fine for a fresh RUN_ID."
echo ""
preview_command "demo/rbv/env/researcher.env" memory get "$HIVE_ID" --scope shared --segment "$SEG"
echo ""
wait_enter
echo ""
set +e
hive_cli "demo/rbv/env/researcher.env" memory get "$HIVE_ID" --scope shared --segment "$SEG"
get_status=$?
set -e
if [[ "$get_status" -ne 0 ]]; then
  echo ""
  echo "(Exit $get_status — no prior memory for this segment is OK.)"
fi
echo ""
if [[ "$DEMO_AUTO" -ne 1 ]]; then
  read -r -p "Press Enter for the next step… "
fi

PUT_BODY=$(
  cat <<EOF
RUN_ID=${RUN_ID}
- Bullet 1: separate gateways can share one hive via matching hive keys.
- Bullet 2: this text was written with the Researcher chain wallet using memory put.
EOF
)

step \
  "Step 4 — write shared memory (Researcher wallet)" \
  "Encrypt, upload, commit shared/${SEG} (logical path under shared/)." \
  "demo/rbv/env/researcher.env" \
  memory put "$HIVE_ID" --scope shared --segment "$SEG" --message "$PUT_BODY"

step \
  "Step 5 — read shared memory (Researcher wallet)" \
  "Download latest ciphertext, decrypt, print plaintext (same wallet as writer)." \
  "demo/rbv/env/researcher.env" \
  memory get "$HIVE_ID" --scope shared --segment "$SEG"

step \
  "Step 6 — read same segment (Reviewer wallet)" \
  "Different chain key, same HIVECLAW_HIVE_KEYS_JSON for this hive → decrypts the same shared segment." \
  "demo/rbv/env/reviewer.env" \
  memory get "$HIVE_ID" --scope shared --segment "$SEG"

banner "Done"
echo "You showed: CLI write → CLI read (same hive, two wallets) on segment $SEG"
echo "RUN_ID=$RUN_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
