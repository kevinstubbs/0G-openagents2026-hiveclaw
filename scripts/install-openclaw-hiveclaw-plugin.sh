#!/usr/bin/env bash
# Build and register the HiveClaw OpenClaw plugin for the current user.
# Run once per machine (or after plugin code changes). All gateway processes
# (e.g. three demo instances) share this install — not one install per port.
#
# OpenClaw's installer scans node_modules; pnpm workspaces symlink hiveclaw-core
# outside the package, which fails that scan. We stage a copy with a stripped
# package.json and fresh npm install (only @sinclair/typebox); hiveclaw-core is
# bundled into dist via tsup.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="${REPO_ROOT}/packages/openclaw-plugin-hiveclaw"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "openclaw: CLI not on PATH — skipped plugin install. Install OpenClaw, then: pnpm run openclaw:plugin" >&2
  exit 0
fi

cd "$REPO_ROOT"
pnpm --filter openclaw-plugin-hiveclaw run build

STAGE="$(mktemp -d "${TMPDIR:-/tmp}/hiveclaw-openclaw-plugin.XXXXXX")"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

tar -C "${PLUGIN_DIR}" --exclude=node_modules -cf - . | tar -C "${STAGE}" -xf -
node "${REPO_ROOT}/scripts/strip-openclaw-plugin-package-json.mjs" "${STAGE}/package.json"

(
  cd "$STAGE"
  npm install --omit=dev
)

openclaw plugins install "${STAGE}"
echo "OpenClaw plugin 'hiveclaw' installed (one per user; all gateways on this host use it)."
