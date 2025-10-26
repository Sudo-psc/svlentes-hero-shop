# Bundle Report (Automated)

This PR adds an automated **Bundle Analyzer** workflow.

## How to read the report
1. Open the PR checks → Artifacts → `bundle-report`.
2. Inspect per‑chunk sizes and duplicated deps.

## Baseline vs After
Use this table to track quick‑wins in follow‑ups.

| Route/Chunk | Baseline (KB) | After (KB) | Δ | Notes |
|---|---:|---:|---:|---|
| /planos | – | – | – | dynamic imports candidate |
| /area-assinante | – | – | – | dynamic imports candidate |
| shared vendors | – | – | – | dedupe libs |

> The first run establishes the baseline automatically; subsequent PRs will show the delta.
