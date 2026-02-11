# Performance Baseline Report

This repository includes a deterministic build performance report script:

```bash
npm run perf:baseline
```

It performs a production build, reads `.next` manifests, and writes:

- `reports/perf-baseline.json`

## What the report contains

- Total client-side JavaScript bytes (all `.js/.mjs` in `.next/static`)
- Shared client runtime bytes (`rootMainFiles` + `polyfillFiles`)
- Route-level client JavaScript estimates for non-API routes
- Largest client chunks (top 25)

## Budget thresholds (optional)

Budget checks are opt-in by environment variable. If set, the script exits non-zero on failure.

- `PERF_BUDGET_TOTAL_CLIENT_JS_BYTES`
- `PERF_BUDGET_MAX_ROUTE_CLIENT_JS_BYTES`

Example:

```bash
PERF_BUDGET_TOTAL_CLIENT_JS_BYTES=350000 \
PERF_BUDGET_MAX_ROUTE_CLIENT_JS_BYTES=250000 \
npm run perf:baseline:report
```

## CI integration pattern

1. Run `npm run perf:baseline`
2. Upload `reports/perf-baseline.json` as a CI artifact
3. Set budget env vars in CI once initial baseline is accepted

## Notes

- The route-level value is an estimate derived from Next build manifests.
- Next build-id-specific file names are normalized in the report to reduce churn between equivalent builds.
- This step does not change runtime behavior; it adds measurement and optional budget enforcement only.
