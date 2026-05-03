# Researcher → Builder → Reviewer (three OpenClaw gateways)

This demo runs **three separate OpenClaw gateway processes**, each with its own `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, and **distinct chain wallet** (`HIVECLAW_CHAIN_PRIVATE_KEY`). All three share one **hive** on 0G Galileo testnet and one **symmetric hive key** so `remember_shared` / `recall_shared` work across agents. Storage uploads use **one funded** `HIVECLAW_STORAGE_PRIVATE_KEY` for all three (simplest setup).

For tool reference, see the [OpenClaw plugin doc](../../apps/hiveclaw-dashboard/docs/docs/openclaw/plugin.mdx) and package [`openclaw-plugin-hiveclaw`](../../packages/openclaw-plugin-hiveclaw).

### Skills: plugin vs workspace

With **`hiveclaw`** enabled, the plugin package ships a bundled skill (**`hiveclaw_memory`**) via **`skills`** in [`openclaw.plugin.json`](../../packages/openclaw-plugin-hiveclaw/openclaw.plugin.json) ([OpenClaw docs](https://docs.openclaw.ai/tools/skills)). That guide loads on every gateway where the plugin is installed—no copying required.

OpenClaw also merges **[workspace skills](https://docs.openclaw.ai/tools/creating-skills)** from **`workspace/skills/<skill-id>/SKILL.md`**. Precedence is **workspace above plugin**: if a workspace skill uses the **same `name:`** as a bundled skill, the workspace copy wins.

Generic HiveClaw usage (**`hiveclaw_memory`**) comes only from the **plugin**—there is no duplicated hive-wide skill in each workspace.

This demo adds **workspace-only** skills (different `name:` values so they stack with `hiveclaw_memory`):

| Path | Purpose |
|------|---------|
| `workspaces/*/skills/rbv-demo-role/SKILL.md` | Role-specific segments and handoffs. |
| `workspaces/researcher/skills/rbv-coordinator/SKILL.md` | Final `summarize_memory` → `demo/final-summary`. |
| `workspaces/builder/skills/rbv-coordinator/SKILL.md` | Alternate coordinator closing step on Builder. |

Paste prompts from [`prompts/`](prompts/) still help; skills reduce reliance on the operator remembering tool names.

## Prerequisites

- Node/pnpm per repo root; open **`shell`** from monorepo root for paths below.
- `openclaw` CLI installed (see [OpenClaw docs](https://docs.openclaw.ai)).
- Funded **0G testnet** ETH for three wallets + storage uploads ([faucet](https://faucet.0g.ai)).
- **Private Computer** — configure `privateComputerBaseUrl` (defaults to `https://pc.0g.ai` in gateway JSON); reflection and executive summary require it.

## 1. Build and install the HiveClaw plugin

From repo root:

```bash
pnpm install
pnpm run build
pnpm --filter openclaw-plugin-hiveclaw run build
openclaw plugins install ./packages/openclaw-plugin-hiveclaw
```

Allow HiveClaw tools for your gateway (`hiveclaw_ping`, `remember_shared`, `recall_shared`, `hiveclaw_reflect`, `summarize_memory`, etc.) per OpenClaw’s plugin/tool policy.

## 2. Configure secrets (env files)

`demo/rbv/scripts/start-gateways.sh` does **not** modify env files; it only prints gateway commands. Copy templates yourself once:

```bash
test -f demo/rbv/env/researcher.env  || cp demo/rbv/env/researcher.env.example demo/rbv/env/researcher.env
test -f demo/rbv/env/builder.env     || cp demo/rbv/env/builder.env.example demo/rbv/env/builder.env
test -f demo/rbv/env/reviewer.env   || cp demo/rbv/env/reviewer.env.example demo/rbv/env/reviewer.env
```

These commands skip the copy if the `.env` file already exists, so they do not overwrite filled-in secrets.

Fill in:

| Variable | Notes |
|----------|--------|
| `HIVECLAW_CHAIN_PRIVATE_KEY` | **Different** hex key per role file (three wallets). |
| `HIVECLAW_STORAGE_PRIVATE_KEY` | **Same** funded storage key in all three files (demo default). |
| `HIVECLAW_HIVE_KEYS_JSON` | **Identical** JSON in all three files: `{ "<hiveId>": "0x<64 hex chars>" }`. Generate a random 32-byte hex key per hive. |

Never commit `researcher.env`, `builder.env`, or `reviewer.env`.

## 3. On-chain hive setup (creator wallet)

Use the **Researcher** wallet as hive creator (simplest): load **only** `HIVECLAW_CHAIN_PRIVATE_KEY` / registry env from repo `.env` **or** point tools at the same values as `researcher.env`.

From **monorepo root** after `pnpm run build`, use the bundled CLI as `node apps/hiveclaw-cli/dist/cli.js` (same entry as root `pnpm run doctor`).

```bash
# Load researcher wallet + registry/RPC from repo .env or export these:
# HIVECLAW_HIVE_REGISTRY_CONTRACT, HIVECLAW_RPC_URL (see ../../.env.example)
set -a && source demo/rbv/env/researcher.env && set +a
node apps/hiveclaw-cli/dist/cli.js hive create demo-rbv
# Note printed hiveId (or query with `hive show <id>` / dashboard).
```

Add **Builder** and **Reviewer** addresses as members (creator-only). Top-level CLI command is **`member`**, not `hive member`:

```bash
# Derive addresses from the other private keys (example with cast):
# cast wallet address --private-key "$BUILDER_PK"
# cast wallet address --private-key "$REVIEWER_PK"

node apps/hiveclaw-cli/dist/cli.js member add <hiveId> <builderAddress>
node apps/hiveclaw-cli/dist/cli.js member add <hiveId> <reviewerAddress>
```

Verify:

```bash
node apps/hiveclaw-cli/dist/cli.js member check <hiveId> <address>
```

### Align gateway config with your hive

Edit **all three** files under [`gateways/`](gateways/):

- Set `"defaultHiveId"` in each `hiveclaw` plugin `config` to your **`hiveId`** (must match keys in `HIVECLAW_HIVE_KEYS_JSON`).

Contract addresses in those JSON files match canonical testnet values from [`.env.example`](../../.env.example); override if you deploy your own registry.

## 4. Run three gateways (three terminals)

OpenClaw isolates instances with `OPENCLAW_CONFIG_PATH` and `OPENCLAW_STATE_DIR` ([docs](https://docs.openclaw.ai/gateway/multiple-gateways)). **Working directory must be the monorepo root** so `workspace` paths in the gateway JSON resolve (`demo/rbv/workspaces/...`).

**Terminal A — Researcher (port 18789)**

```bash
cd /path/to/openagents2026
set -a && source demo/rbv/env/researcher.env && set +a
export OPENCLAW_CONFIG_PATH="$PWD/demo/rbv/gateways/researcher.openclaw.json"
export OPENCLAW_STATE_DIR="$PWD/demo/rbv/.openclaw-state/researcher"
mkdir -p "$OPENCLAW_STATE_DIR"
openclaw gateway
```

**Terminal B — Builder (port 18790)**

```bash
cd /path/to/openagents2026
set -a && source demo/rbv/env/builder.env && set +a
export OPENCLAW_CONFIG_PATH="$PWD/demo/rbv/gateways/builder.openclaw.json"
export OPENCLAW_STATE_DIR="$PWD/demo/rbv/.openclaw-state/builder"
mkdir -p "$OPENCLAW_STATE_DIR"
openclaw gateway
```

**Terminal C — Reviewer (port 18791)**

```bash
cd /path/to/openagents2026
set -a && source demo/rbv/env/reviewer.env && set +a
export OPENCLAW_CONFIG_PATH="$PWD/demo/rbv/gateways/reviewer.openclaw.json"
export OPENCLAW_STATE_DIR="$PWD/demo/rbv/.openclaw-state/reviewer"
mkdir -p "$OPENCLAW_STATE_DIR"
openclaw gateway
```

See [`scripts/start-gateways.sh`](scripts/start-gateways.sh) for copy-paste blocks. Use **three terminals** (or tmux panes); each gateway is a long-running process.

Add `demo/rbv/.openclaw-state/` to personal ignore if needed; it is created locally.

## 5. Demo story (prompt order)

**User task (paste once to Researcher):**

> Design and implement a local multi-gateway coordination plugin for OpenClaw.

1. **Researcher** — paste [`prompts/researcher.md`](prompts/researcher.md).
2. **Builder** — paste [`prompts/builder.md`](prompts/builder.md).
3. **Reviewer** — paste [`prompts/reviewer.md`](prompts/reviewer.md) (includes **`hiveclaw_reflect`** → `demo/lessons`).
4. **Coordinator** — on **Researcher** (default), paste [`prompts/coordinator-researcher.md`](prompts/coordinator-researcher.md).  
   **Or** on **Builder**, paste [`prompts/coordinator-builder.md`](prompts/coordinator-builder.md).

### Shared segment map

| Segment | Typical writer |
|---------|----------------|
| `demo/findings` | Researcher |
| `demo/constraints` | Researcher (optional) |
| `demo/builder-plan` | Builder |
| `demo/builder-output` | Builder |
| `demo/review` | Reviewer |
| `demo/approval` | Reviewer |
| `demo/lessons` | Reviewer (`hiveclaw_reflect`) |
| `demo/final-summary` | Coordinator (`summarize_memory` + commit) |

## Troubleshooting

- **`hiveclaw_ping`** fails — check RPC, funded keys, registry address, and storage key on testnet.
- **`commitMemory` reverts** — wallet is not a hive member; re-run `hive member add`.
- **Cannot decrypt** — `HIVECLAW_HIVE_KEYS_JSON` mismatch or wrong `hiveId` vs `defaultHiveId`.
- **Reflection / coordinator fails** — set `privateComputerBaseUrl` (in gateway JSON) and optional `HIVECLAW_PRIVATE_COMPUTER_API_KEY` in env.

## Optional: CLI parity

With one role’s env sourced (registry + keys):

```bash
node apps/hiveclaw-cli/dist/cli.js hive my
node apps/hiveclaw-cli/dist/cli.js memory get <hiveId> --scope shared --segment demo/final-summary
```

Reflection equivalent to `hiveclaw_reflect`:

```bash
node apps/hiveclaw-cli/dist/cli.js reflect <hiveId> \
  --shared demo/findings --shared demo/builder-output --shared demo/review \
  --summary-segment demo/lessons
```

(Adjust `--shared` list to match segments you actually wrote.)

## Threat model note

Hive members share one symmetric key for ciphertext. **Private** segments are namespaced by address but are **not** cryptographic isolation from other members—policy/trust only.
