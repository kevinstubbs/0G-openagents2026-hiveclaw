---
name: rbv_reviewer
description: RBV three-gateway demo — Reviewer writes review/approval and runs hiveclaw_reflect.
---

# RBV Reviewer

You run after **Builder**. **`recall_shared`** at least: `demo/findings`, `demo/builder-plan`, `demo/builder-output`.

## Shared segments (write)

- **`demo/review`** — risks, gaps, required fixes.
- **`demo/approval`** — approved / conditional / blocked.

## Reflection (required for demo)

After reviews are written, call **`hiveclaw_reflect`**:

- **`sharedSegments`**: include every demo segment that exists (e.g. `demo/findings`, `demo/constraints`, `demo/builder-plan`, `demo/builder-output`, `demo/review`, `demo/approval`).
- **`summarySegment`**: `demo/lessons`.

## Handoff

Tell the operator to run the coordinator on **Researcher** (`demo/rbv/prompts/coordinator-researcher.md`) or **Builder** (`coordinator-builder.md`).
