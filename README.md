# HiveClaw (Phase 1)

pnpm monorepo: **contracts** (Foundry bootstrap), **`hiveclaw-core`**, **OpenClaw plugin**, **CLI**, **Next dashboard**.

## Quickstart

```bash
cp .env.example .env
pnpm install
pnpm run build
pnpm doctor
```

- **Dashboard:** `pnpm --filter hiveclaw-dashboard dev` → [http://localhost:3040/status](http://localhost:3040/status) (same env as CLI).
- **OpenClaw:** `pnpm --filter openclaw-plugin-hiveclaw run build`, then `openclaw plugins install ./packages/openclaw-plugin-hiveclaw`. Merge `examples/openclaw-plugins-hiveclaw.json` into your gateway config as needed and allow tool `hiveclaw_ping` / plugin id per OpenClaw docs.

## Phase 1 exit checks

1. `cd contracts && forge test`
2. Deploy bootstrap to testnet; set `HIVECLAW_BOOTSTRAP_CONTRACT` in `.env` (see `.env.example`).
3. `pnpm doctor` exits 0 with chain + storage skipped or OK.
4. `/status` matches CLI when using the same env.
5. OpenClaw: plugin loads; `hiveclaw_ping` runs in an agent session.

Storage smoke needs a **funded** testnet key in `HIVECLAW_STORAGE_PRIVATE_KEY`. Faucet: [https://faucet.0g.ai](https://faucet.0g.ai).
