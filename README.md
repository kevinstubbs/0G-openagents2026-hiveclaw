# HiveClaw (Phase 1)

pnpm monorepo: **contracts** (Foundry bootstrap), **`hiveclaw-core`**, **OpenClaw plugin**, **CLI**, **Next dashboard**.

## Quickstart

```bash
cp .env.example .env
pnpm install
pnpm run build
pnpm run doctor
```

`pnpm run build` rebuilds the **`/docs`** static site (Docusaurus → `apps/hiveclaw-dashboard/public/docs`) before building every workspace package (see root `docs:build` script).

Use `pnpm run doctor` (or `pnpm healthcheck`): bare **`pnpm doctor`** is [pnpm’s own diagnostic](https://pnpm.io/cli/doctor), not this repo’s HiveClaw check, so it usually prints nothing useful here.

## Deploying contracts (testnet)

Copy `.env.example` to `.env` if you have not already. Put your funded deployer secret in **`.env`** as `PRIVATE_KEY` or `HIVECLAW_CHAIN_PRIVATE_KEY` (never commit it). `pnpm deploy:testnet` runs [`dotenv-cli`](https://www.npmjs.com/package/dotenv-cli) to load `.env`, then runs Foundry’s orchestrated script [`contracts/script/DeployHiveClaw.s.sol`](contracts/script/DeployHiveClaw.s.sol), which deploys `HiveClawBootstrap` and `HiveRegistry` and prints addresses you can paste back into `.env`.

```bash
pnpm deploy:testnet
```

Equivalent without pnpm: `dotenv -e .env -- bash contracts/deploy-testnet.sh`. For ad‑hoc `forge script` commands, prefix with `dotenv -e .env --` so the key is not passed on the shell command line (see `.env.example`). RPC defaults to `HIVECLAW_RPC_URL` or 0G Galileo testnet.

### Deployed contracts (reference)

Hackathon deployment on **0G Galileo testnet** (chain id **16602**). Use these in `.env` if you are connecting to this deployment instead of rolling your own.

| Contract | Address |
|----------|---------|
| `HiveClawBootstrap` | [`0x4e6A80653B419777d281622249bd49Dc35131005`](https://chainscan-galileo.0g.ai/address/0x4e6A80653B419777d281622249bd49Dc35131005) |
| `HiveRegistry` | [`0x496A34251Da57a3C1907325884323147D549626A`](https://chainscan-galileo.0g.ai/address/0x496A34251Da57a3C1907325884323147D549626A) |

```bash
HIVECLAW_BOOTSTRAP_CONTRACT=0x4e6A80653B419777d281622249bd49Dc35131005
HIVECLAW_HIVE_REGISTRY_CONTRACT=0x496A34251Da57a3C1907325884323147D549626A
NEXT_PUBLIC_HIVECLAW_BOOTSTRAP_CONTRACT=0x4e6A80653B419777d281622249bd49Dc35131005
NEXT_PUBLIC_HIVECLAW_HIVE_REGISTRY_CONTRACT=0x496A34251Da57a3C1907325884323147D549626A
```

- **Dashboard:** `pnpm --filter hiveclaw-dashboard dev` → marketing site at `/`, app routes like [http://localhost:3040/status](http://localhost:3040/status), docs at [http://localhost:3040/docs/](http://localhost:3040/docs/) (same env as CLI).

  **Documentation (Docusaurus)** lives under [`apps/hiveclaw-dashboard/docs`](apps/hiveclaw-dashboard/docs) and is built into `apps/hiveclaw-dashboard/public/docs` for `/docs`. Set **`DOCUSAURUS_URL`** at build time for canonical URLs (see [`.env.example`](.env.example)); it defaults to `http://localhost:3040` when unset.

  - **Preview docs + Next together:** run `pnpm --filter hiveclaw-dashboard docs:build`, then `pnpm --filter hiveclaw-dashboard dev`. Edit MDX, then run `docs:build` again to refresh `/docs` (static until rebuilt).
  - **Docs-only live reload:** `pnpm --filter hiveclaw-dashboard docs:dev` runs Docusaurus on port **3041** (fast iteration; use the full-site flow above when you need `/status` and `/hive` alongside `/docs`).
  - **E2E:** `pnpm --filter hiveclaw-dashboard exec playwright install chromium` once, then `pnpm --filter hiveclaw-dashboard test:e2e` (starts production server via Playwright after `pnpm run build` inside the dashboard package, unless something is already listening on port 3040).
- **OpenClaw:** `pnpm --filter openclaw-plugin-hiveclaw run build`, then `openclaw plugins install ./packages/openclaw-plugin-hiveclaw`. Merge `examples/openclaw-plugins-hiveclaw.json` into your gateway config as needed and allow tool `hiveclaw_ping` / plugin id per OpenClaw docs.
- **Three-gateway demo (Researcher → Builder → Reviewer):** step-by-step setup, prompts, and gateway templates live under [`demo/rbv/README.md`](demo/rbv/README.md).

## Phase 1 exit checks

1. `cd contracts && forge test`
2. Deploy to testnet (`pnpm deploy:testnet` loads `.env` via dotenv-cli); paste printed addresses into `.env` (see `.env.example`).
3. `pnpm run doctor` exits 0 with chain + storage skipped or OK.
4. `/status` matches CLI when using the same env.
5. OpenClaw: plugin loads; `hiveclaw_ping` runs in an agent session.

Storage smoke needs a **funded** testnet key in `HIVECLAW_STORAGE_PRIVATE_KEY`. Faucet: [https://faucet.0g.ai](https://faucet.0g.ai).
