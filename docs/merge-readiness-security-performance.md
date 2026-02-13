# Merge Readiness Checklist: Security + Performance Hardening

Use this checklist before merging `cursor/security-performance-audit-6053` to `main`.

## 1) Scope included in this branch

- Chat proxy hardening:
  - Allowlisted, fail-closed origin enforcement
  - Strict server-side 6-digit PIN validation
  - Server-side PIN lockout policy (3 failures / 15 minutes)
  - Chat rate limiting with retry semantics (`429` + `Retry-After`)
- Observability:
  - Request IDs and structured server logs for `/api/chat`
  - `/api/health` endpoint
- Client security hygiene:
  - Replaced direct client console logging with redacted telemetry helpers
- Performance improvements:
  - Widget lazy-loading restored
  - Large inline styles moved to CSS modules
  - Transcript message caps and stable keys
  - Scroll behavior optimizations
- CI hardening:
  - Added quality gates workflow (typecheck/lint/build)
  - Pinned gitleaks image to immutable digest

## 2) Required environment configuration

Confirm these are set in all target environments:

- `CHAT_API_URL` (absolute `http(s)` URL to upstream chat service)
- `CHAT_ALLOWED_ORIGINS` (comma-separated browser origins, explicit values only)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

Fail-closed behavior is expected if required vars are missing or invalid.

## 3) Pre-merge verification

- [ ] Branch CI green:
  - Security Gates
  - Quality Gates
- [ ] Local checks pass:
  - `npm ci`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm audit --omit=dev --audit-level=high`
- [ ] No unexpected diff outside intended files.

## 4) Functional smoke tests after deploy

- [ ] Normal chat flow works end-to-end through `/api/chat`
- [ ] Cross-origin request from a non-allowlisted origin returns `403`
- [ ] Invalid JSON/content type rejected (`400`/`415`)
- [ ] PIN flow:
  - valid 6-digit PIN accepted
  - malformed PIN rejected
  - lockout triggered after 3 failures and returns retry info
- [ ] Rate limit behavior:
  - excessive requests return `429`
  - `Retry-After` and rate-limit headers are present
- [ ] `/api/health` returns success response

## 5) Monitoring and rollback notes

- Monitor:
  - 4xx/5xx rates on `/api/chat`
  - `429` volume and lockout frequency
  - chat latency (`Server-Timing`, `X-Chat-Proxy-Total-Ms`)
- If elevated failures occur:
  - verify env vars first (`CHAT_API_URL`, `CHAT_ALLOWED_ORIGINS`)
  - validate upstream chat availability
  - rollback by redeploying prior production commit if needed

## 6) Residual follow-up (not blocked by this merge)

- Add explicit request body-size guard before `request.json()` parsing.
- Add baseline security response headers (CSP/frame/referrer/permissions/HSTS at edge).
- Ensure microphone permission probe immediately releases tracks when possible.
