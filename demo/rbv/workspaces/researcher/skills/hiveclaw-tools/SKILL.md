---
name: hiveclaw_tools
description: HiveClaw plugin tool usage guide for RBV workspaces. Use when the task requires shared/private hive memory, ping checks, or reflection summaries.
---

# HiveClaw tools (RBV)

Use plugin tools directly; do not use shell commands for HiveClaw operations.

## Tool checklist

1. Call `hiveclaw_ping` once at session start.
2. If ping fails or `hiveclaw_ping` is unavailable, return an error JSON and stop immediately.
3. Prefer shared segments for cross-agent handoffs, private segments for scratch notes.

## Failure mode (mandatory)

- If `hiveclaw_ping` is missing from the tool registry, return exactly:
  `{"ok":false,"error":"hiveclaw_ping tool is unavailable in this session"}`
- Do not call `exec`, `process`, `read`, `web_search`, or other diagnostic tools in that case.
- Do not attempt plugin installation, config inspection, polling loops, or shell fallbacks.
- Stop after the single error response.

## Core tools

- `hiveclaw_ping` - health check (RPC + registry + storage smoke).
- `hiveclaw_list_my_hives` - verify accessible hive ids.
- `remember_shared` / `recall_shared` - cross-agent memory lanes.
- `remember_private` / `recall_private` - private lane under your address.
- `summarize_memory` - summarize selected segments; optional commit.
- `hiveclaw_reflect` - recall + summarize + commit to shared summary segment.

## Segment discipline for RBV demo

- Use explicit segment names (for example `demo/findings`, `demo/builder-plan`, `demo/review`).
- Do not overwrite unrelated segments unless explicitly asked.
- When handing off, mention exactly which segment names were written.
