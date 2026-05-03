---
name: rbv_coordinator
description: RBV demo — final executive summary into demo/final-summary (Researcher gateway).
---

# RBV coordinator (Researcher)

Run only after the Reviewer has written **`demo/lessons`** via `hiveclaw_reflect`.

Use **`summarize_memory`** with:

- **`sharedSegments`**: all segments that exist from the run (e.g. `demo/findings`, `demo/constraints`, `demo/builder-plan`, `demo/builder-output`, `demo/review`, `demo/approval`, `demo/lessons`).
- **`commitSummaryToShared`**: `true`
- **`summarySegment`**: `demo/final-summary`

Do not skip Private Computer: the tool will error if it is not configured.
