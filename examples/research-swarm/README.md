# Research swarm example

Two OpenClaw agents share a **hive** on 0G testnet: Agent **A** publishes **shared** findings; Agent **B** **recalls** shared context and writes **private** synthesis rows.

## Prerequisites

- Deployed `HiveRegistry` + env from repo root `.env.example`
- Funded `HIVECLAW_CHAIN_PRIVATE_KEY` + `HIVECLAW_STORAGE_PRIVATE_KEY`
- Shared **hive symmetric key** (`HIVECLAW_HIVE_KEYS_JSON` or `HIVECLAW_HIVE_KEY_HEX`)
- Plugin installed once per machine: `pnpm run openclaw:plugin` (from monorepo root)

## Configure OpenClaw (`openclaw.json`)

Point the plugin at RPC, registry, keys, and optional `defaultHiveId`:

```json
{
  "plugins": {
    "entries": {
      "hiveclaw": {
        "enabled": true,
        "config": {
          "hiveRegistryContract": "<from .env>",
          "storagePrivateKey": "<funded storage key>",
          "chainPrivateKey": "<member wallet>",
          "defaultHiveId": 1,
          "hiveKeysJson": "{\"1\":\"0x<64 hex chars>\"}",
          "privateComputerBaseUrl": "https://pc.0g.ai",
          "privateComputerApiKey": "<optional>"
        }
      }
    }
  }
}
```

## Prompt sketches

**Agent A (researcher)**

> You are Agent A. Call `hiveclaw_list_my_hives`, pick the hive id, then `remember_shared` with segment `findings/round1` and your bullet findings as content.

**Agent B (synthesizer)**

> Call `recall_shared` on segment `findings/round1`. Then `remember_private` with segment `synthesis/v1` capturing your merged analysis.

## Threat model (honest framing)

Hive members share one symmetric key. **Private** rows use the `private/<address>/…` namespace — **other members could decrypt** if they enumerate keys; agents agree not to by policy.

## CLI parity

```bash
pnpm exec hiveclaw hive my
pnpm exec hiveclaw memory put 1 --scope shared --segment findings/round1 --message "Finding: …"
pnpm exec hiveclaw memory get 1 --scope shared --segment findings/round1
pnpm exec hiveclaw memory put 1 --scope private --segment synthesis/v1 --message "Merged: …"
pnpm exec hiveclaw summarize 1 --shared findings/round1 --private synthesis/v1

# Optional: write the summary back to shared memory + registry (same as OpenClaw `summarize_memory` + commit)
pnpm exec hiveclaw summarize 1 --shared findings/round1 --private synthesis/v1 --commit --summary-segment summary/rolling

# Reflection loop (summarize → commit in one step)
pnpm exec hiveclaw reflect 1 --shared findings/round1 --private synthesis/v1 --summary-segment summary/rolling
```

### Scheduled reflection (cron)

Run the reflection loop on an interval so the hive keeps an up-to-date rolling summary (adjust paths and hive id):

```bash
0 * * * * cd /path/to/openagents2026 && HIVECLAW_VERBOSE=1 pnpm exec hiveclaw reflect 1 \
  --shared findings/round1 --private synthesis/v1 \
  --summary-segment summary/rolling --attestation-metadata >> /tmp/hiveclaw-reflect.log 2>&1
```

OpenClaw agents can use tool `hiveclaw_reflect` or `summarize_memory` with `commitSummaryToShared: true` for the same behavior inside a session.

Negative check: a wallet that is **not** a member gets **`commitMemory`** reverted on-chain.
