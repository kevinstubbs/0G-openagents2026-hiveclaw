# `openclaw-plugin-hiveclaw`

**Do not run** `openclaw plugins install ./packages/openclaw-plugin-hiveclaw` from the monorepo. OpenClaw’s installer will fail on **`node_modules/hiveclaw-core`** (pnpm workspace symlink outside the install root) and on **static heuristics** in the bundle: the plugin legitimately reads `HIVECLAW_*` from the environment and uses the network for RPC and storage, which the CLI can report as “credential harvesting.”

From the **repo root**, use:

```bash
pnpm run openclaw:plugin
```

That script builds the plugin, stages a copy with a clean `npm install` (no workspace symlinks), and runs `openclaw plugins install` on the staging tree.

See the root [README.md](../../README.md#quickstart) and [OpenClaw plugin doc](../../apps/hiveclaw-dashboard/docs/docs/openclaw/plugin.mdx).
