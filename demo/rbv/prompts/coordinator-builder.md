# Coordinator (alternate) — Builder gateway

Same as **`coordinator-researcher.md`**, but run on the **Builder** gateway so the implementer “closes the loop.”

Use **`summarize_memory`** with:

- **`sharedSegments`**: `demo/findings`, `demo/constraints`, `demo/builder-plan`, `demo/builder-output`, `demo/review`, `demo/approval`, `demo/lessons` (omit missing segments)
- **`commitSummaryToShared`**: `true`
- **`summarySegment`**: `demo/final-summary`

Optional: `attachAttestationToMetadataUri: true`.
