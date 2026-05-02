#!/usr/bin/env bash
# Deploy HiveClawBootstrap + HiveRegistry to 0G Galileo testnet (or any RPC you pass).
#
# From repo root (loads secrets from .env — do not pass keys on the command line):
#   pnpm deploy:testnet
# Same as: dotenv -e .env -- bash contracts/deploy-testnet.sh
#
# Optional RPC override (still no key on CLI): put HIVECLAW_RPC_URL in .env or export RPC_URL for one run.
#
# Uses Foundry: one orchestrated script so later contracts can take earlier addresses
# (see script/DeployHiveClaw.s.sol). Addresses are written to contracts/deployments/<chainId>.json
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
mkdir -p deployments

# Forge scripts read PRIVATE_KEY; hiveclaw-core also accepts HIVECLAW_CHAIN_PRIVATE_KEY — align them here.
export PRIVATE_KEY="${PRIVATE_KEY:-${HIVECLAW_CHAIN_PRIVATE_KEY:-}}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "error: set PRIVATE_KEY or HIVECLAW_CHAIN_PRIVATE_KEY in .env (use dotenv-cli / pnpm deploy:testnet)." >&2
  exit 1
fi

RPC_URL="${RPC_URL:-${HIVECLAW_RPC_URL:-https://evmrpc-testnet.0g.ai}}"
echo "Using RPC_URL=$RPC_URL"

exec forge script script/DeployHiveClaw.s.sol:DeployHiveClaw \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvv \
  "$@"
