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

OpenClaw keeps **one plugin list per user on this machine**, not per gateway. Run from repo root **once** (or after you change the plugin package):

```bash
pnpm install
pnpm run build
pnpm run openclaw:plugin
```

That runs `openclaw plugins install` on `packages/openclaw-plugin-hiveclaw`. All three demo gateways load it automatically — **no** separate install for ports 18789 / 18790 / 18791. If `openclaw` is not on your `PATH`, the script skips install and prints a hint.

The checked-in [`gateways/*.openclaw.json`](gateways/) set **`tools.alsoAllow: ["hiveclaw"]`** so the default **`coding`** tool profile allows plugin tools (`hiveclaw_ping`, `remember_shared`, `recall_shared`, `hiveclaw_reflect`, `summarize_memory`, etc.). See [OpenClaw config-tools](https://docs.openclaw.ai/gateway/config-tools).

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
| `OPENCLAW_GATEWAY_TOKEN` | **Same** value in all three files — Control UI WebSocket auth (paste into Gateway Access per tab). Generate: `openclaw doctor --generate-gateway-token`. |
| `OPENAI_API_KEY` | **Same** key in all three files — Chat uses `agents.defaults.model` **`openai/gpt-5.4-mini`** in each gateway JSON ([model providers](https://docs.openclaw.ai/concepts/model-providers)). Override the model id in [`gateways/*.openclaw.json`](gateways/) if you use another provider or OpenAI model. |
| `HIVECLAW_CHAIN_PRIVATE_KEY` | **Different** hex key per role file (three wallets). |
| `HIVECLAW_STORAGE_PRIVATE_KEY` | **Same** funded storage key in all three files (demo default). |
| `HIVECLAW_HIVE_KEYS_JSON` | **Identical** JSON in all three files. How to generate and format: [Environment variables — Hive keys](../../apps/hiveclaw-dashboard/docs/docs/configuration/environment.mdx#hive-keys-json) (on the dashboard: `/docs/configuration/environment#hive-keys-json`). |

Checked-in [`gateways/*.openclaw.json`](gateways/) reference those secrets as **`"${HIVECLAW_CHAIN_PRIVATE_KEY}"`**, **`"${HIVECLAW_STORAGE_PRIVATE_KEY}"`**, and **`"${HIVECLAW_HIVE_KEYS_JSON}"`** under **`plugins.entries.hiveclaw.config`** so OpenClaw injects them when the gateway loads (the HiveClaw plugin does not read **`process.env`** directly).

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
- **`agents.defaults.model.primary`** is set to **`openai/gpt-5.4-mini`** (small GPT-5-class model OpenClaw documents for the GPT-5 tooling path; **`openai/gpt-5-nano`** can fail embedded / live session switching in some OpenClaw builds). Change it here if you prefer another [model id](https://docs.openclaw.ai/concepts/model-providers).

Contract addresses in those JSON files match canonical testnet values from [`.env.example`](../../.env.example); override if you deploy your own registry.

## 4. Run three gateways (three terminals)

OpenClaw isolates instances with `OPENCLAW_CONFIG_PATH` and `OPENCLAW_STATE_DIR` ([docs](https://docs.openclaw.ai/gateway/multiple-gateways)). **Working directory must be the monorepo root** so `workspace` paths in the gateway JSON resolve (`demo/rbv/workspaces/...`).

The checked-in gateway files set **`gateway.mode`** to **`"local"`** (required for `openclaw gateway`; see [gateway CLI](https://docs.openclaw.ai/cli/gateway)). Without it, startup fails with “missing gateway.mode”—alternatives are `openclaw onboard --mode local`, or **`openclaw gateway --allow-unconfigured`** for ad-hoc runs only.

**Control UI / Chat:** The gateway WebSocket requires auth ([gateway security](https://docs.openclaw.ai/gateway/security)). Config uses **`gateway.auth.mode`** **`token`** and **`token`: `"${OPENCLAW_GATEWAY_TOKEN}"`** ([env substitution](https://docs.openclaw.ai/configuration)). Put the **same** secret in all three `demo/rbv/env/*.env` files as **`OPENCLAW_GATEWAY_TOKEN`** (generate with **`openclaw doctor --generate-gateway-token`**), **`source`** that env before **`openclaw gateway`**, restart gateways, then in **each** browser tab open **Overview → Gateway Access** (or equivalent) and paste that token so the Control UI can connect. If the token in the UI does not match the running gateway, you’ll see **`unauthorized: gateway token missing`**.

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

### 2-minute shared memory demo (`preopen-demo.sh`)

Use this when you want **one command** to start the gateways you need, **open Control UI tabs**, and **print copy/paste prompts** for a short cross-agent shared-memory demo. Messaging and narration stay manual.

Prerequisites are the same as above (env files filled, `openclaw` on `PATH`, HiveClaw plugin installed per [§1](#1-build-and-install-the-hiveclaw-plugin)).

From **monorepo root**:

```bash
bash demo/rbv/scripts/preopen-demo.sh
```

Defaults:

- Starts **Researcher** (port **18789**) and **Reviewer** (port **18791**) in the background. Logs: `demo/rbv/.openclaw-state/logs/researcher.log`, `demo/rbv/.openclaw-state/logs/reviewer.log`; PID files: `demo/rbv/.openclaw-state/researcher.gateway.pid`, `demo/rbv/.openclaw-state/reviewer.gateway.pid`. The script output lists **full paths** for whatever `--roles` you pass (easy copy/paste).
- Opens `http://127.0.0.1:18789/` and `http://127.0.0.1:18791/` (macOS `open`, Linux `xdg-open` when available).
- Prints a **`RUN_ID`** (or uses yours) and prompts that write/read **`demo/runs/<RUN_ID>/findings`** only — **avoid fixed segments like `demo/findings`** so repeat runs do not mix with older hive memory.

Useful options:

| Flag | Meaning |
|------|---------|
| `--roles researcher,reviewer` | Comma-separated gateways to start (first role = writer, second = recaller). Need at least two roles. |
| `--run-id my-run-1` | Fixed segment namespace; also supported via env `RUN_ID`. |
| `--no-start` | Do not spawn gateways (e.g. you already ran them manually). Still prints prompts and can open tabs. |
| `--no-open` | Do not open browser tabs. |
| `--dry-run` | Print prompts only (no gateway start, no tabs). |

Example with Builder instead of Reviewer:

```bash
bash demo/rbv/scripts/preopen-demo.sh --roles researcher,builder
```

**Manual steps after the script runs:** paste the printed gateway token in **Overview → Gateway Access** for each tab, then paste **Message 1** to the first role and **Message 1** to the second role in order. Optional **Message 2** blocks are only if the agent output is unclear.

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

- **`Embedded agent failed` / `Live session model switch requested`** — Often an unsupported or partially integrated model id. Prefer **`openai/gpt-5.4`**, **`openai/gpt-5.4-mini`**, or **`openai/gpt-4o`** in [`gateways/*.openclaw.json`](gateways/); then restart the gateway and start a **new** chat session. Run `openclaw models list --provider openai` to see ids your OpenClaw build recognizes.
- **Chat stuck on one gateway, others fine** — Each process has its own **`OPENCLAW_STATE_DIR`** (e.g. `.openclaw-state/researcher` for port **18789**). Stop that terminal’s `openclaw gateway`, start it again, and open a **new** chat session (new session in the Control UI or a fresh URL without the old `session=`). A prior long tool run (e.g. **`hiveclaw_ping`** with storage smoke) can block that session until it finishes or the process restarts. If it still never responds, quit the gateway and rename that role’s state folder (e.g. `mv demo/rbv/.openclaw-state/researcher demo/rbv/.openclaw-state/researcher.bak`) so OpenClaw recreates it—**only** that role’s local sessions are reset.
- **`gateway name conflict`** (Bonjour / mDNS) — multiple gateways on one machine used to advertise the **same** local discovery name. Checked-in configs set **`discovery.mdns.mode`** to **`"off"`** so instances do not fight over mDNS ([disable mDNS](https://docs.openclaw.ai/gateway/security)). You lose LAN auto-discovery; use explicit **`http://127.0.0.1:<port>/`** links (fine for this demo). Alternative: `OPENCLAW_DISABLE_BONJOUR=1` in the environment.
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
