# Coordinator (default) — Researcher gateway

You are closing the loop on the demo. The Reviewer has already run **`hiveclaw_reflect`** into `demo/lessons`.

## Task

Produce a short **executive summary** of the whole run for stakeholders and persist it to shared memory.

## Tools

Use **`summarize_memory`** (not a separate recall step — it loads segments by path):

- **`sharedSegments`**: include all segments that exist from this run, for example:  
  `demo/findings`, `demo/constraints`, `demo/builder-plan`, `demo/builder-output`, `demo/review`, `demo/approval`, `demo/lessons`
- **`commitSummaryToShared`**: `true`
- **`summarySegment`**: `demo/final-summary`

Optional: `attachAttestationToMetadataUri: true` if you want attestation metadata on the commit (see plugin docs).

If Private Computer is unavailable, stop and report the error; do not invent on-chain content.

## Done

Confirm that `demo/final-summary` was committed and give the human a short verbal recap.
