---
name: hiveclaw_memory
description: Operating guide for the HiveClaw OpenClaw plugin — 0G hive memory, HiveRegistry, Private Computer summarization.
---

# HiveClaw (plugin tools)

This skill ships with the **hiveclaw** tool plugin. These tools add **encrypted hive memory** on 0G + on-chain provenance via **HiveRegistry**. They are **not** a replacement for OpenClaw’s default **`memory-core`** slot (local SQLite); both can be active. Call HiveClaw tools when you need **shared ciphertext across hive members**, **registry commits**, or **summaries** backed by Private Computer.

## Before mutating memory

1. Run **`hiveclaw_ping`** — verifies RPC, bootstrap/HiveRegistry reachability, and storage path when keys are set.
2. Ensure **`chainPrivateKey`**, **`storagePrivateKey`**, and hive symmetric keys are configured (env `HIVECLAW_*` or plugin config). Memory writes require **hive membership** on-chain.
3. Optionally **`hiveclaw_list_my_hives`** if the hive id is unknown (otherwise use `defaultHiveId` / `hiveId` on each tool).

## Tool reference (when to use which)

| Tool | Use case |
|------|----------|
| `hiveclaw_ping` | Health check; run first in a session or after errors. |
| `hiveclaw_list_my_hives` | Enumerate hive ids for the plugin wallet. |
| `remember_shared` | Write plaintext → encrypt with hive key → upload → `commitMemory` under **`shared/<segment>`**. |
| `recall_shared` | Read latest shared segment (after registry lookup + decrypt). |
| `remember_private` | Same pipeline under **`private/<your-address>/<segment>`** (policy separation, not crypto isolation from other members). |
| `recall_private` | Read latest private segment for your wallet. |
| `summarize_memory` | Fetch shared/private segments by path → Private Computer summarize → optional commit to **`shared/<summarySegment>`**. Requires **`privateComputerBaseUrl`**. |
| `hiveclaw_reflect` | Reflection loop: recall listed segments → summarize → encrypt → commit to **`shared/<summarySegment>`**. Requires Private Computer. |

## Parameters (typical)

- **`segment`**: Path **without** the `shared/` or `private/.../` prefix in the parameter — e.g. `findings/round1` or `demo/findings` under shared.
- **`hiveId`**: Usually inherited from config; pass if multiple hives.
- **`sharedSegments` / `privateSegments`**: Arrays of segment strings for summarize/reflect.

## Operational discipline

- **Cost / side effects**: commits touch chain and storage; batch meaningful updates, avoid tight loops.
- **Private lane**: treat as **namespace + policy**, not strong confidentiality against malicious hive members.
- **Private Computer**: reflection and summarization fail fast if `privateComputerBaseUrl` (or `HIVECLAW_PRIVATE_COMPUTER_URL`) is unset.

For install and config keys, see the repo plugin documentation and `HiveclawPluginConfig` / `loadHiveclawConfig`.
