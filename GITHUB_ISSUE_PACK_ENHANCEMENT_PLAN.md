# Enterprise Enhancement Plan - GitHub Issue Pack

Repository: `teams-tech/vector` (Mia)  
Branch: `cursor/vector-code-review-31f0`

This document contains:
- 1 master tracking issue (epic)
- 24 child issues (one incremental step each)
- no forward dependencies (every issue is deploy-safe on its own)

---

## 0) Master Tracking Issue (Epic)

**Title:** Epic: Enterprise hardening + performance + reliability plan (deploy-safe incremental path)

**Body:**

```md
## Goal
Deliver incremental, deploy-safe improvements across performance, architecture, security, reliability, and domain correctness.
Each child issue is independently shippable and has no forward dependency.

## Global Definition of Done (applies to every child issue)
- [ ] `npm ci` passes
- [ ] `npm run build` passes
- [ ] `npm audit --omit=dev --audit-level=high` passes
- [ ] Smoke tests pass:
  - [ ] `/` loads
  - [ ] Voice widget connect/disconnect works
  - [ ] Text chat send/receive works
  - [ ] PIN prompt/verify path works
  - [ ] Mobile chat open/close/input works

## Ordered checklist
- [ ] 01 - Perf baseline + budget report
- [ ] 02 - Extract ChatWidget CSS module
- [ ] 03 - Extract MiaWidget CSS module
- [ ] 04 - Extract Home page CSS module
- [ ] 05 - Lazy-load widgets on home page
- [ ] 06 - Cap in-memory transcript size
- [ ] 07 - Replace index keys with stable message IDs
- [ ] 08 - Optimize scroll behavior for constrained devices
- [ ] 09 - Centralize env/config validation
- [ ] 10 - Shared chat request/response contract
- [ ] 11 - Decompose `/api/chat` route into layers
- [ ] 12 - Extract `useChatSession` hook
- [ ] 13 - Extract `useMiaConversation` hook
- [ ] 14 - Enforce server-side strict 6-digit PIN schema
- [ ] 15 - Implement server-side PIN lockout policy
- [ ] 16 - Add API rate limiting (IP + identifier/session)
- [ ] 17 - Fail-closed origin validation + allowlist
- [ ] 18 - Replace client console logging with telemetry wrapper
- [ ] 19 - Add CI quality gates (build/typecheck/lint)
- [ ] 20 - Add minimal automated test suite
- [ ] 21 - Pin gitleaks image digest (CI determinism)
- [ ] 22 - Request IDs + structured logs + `/api/health`
- [ ] 23 - Correct floor-plan terminology (FPC vs lender)
- [ ] 24 - Add domain glossary lint check in CI
```

---

## 1) Issue 01

**Title:** Perf baseline + build budget report (no runtime change)  
**Labels:** `perf`, `ci`  
**Depends on:** none

```md
## Summary
Add a baseline performance report so future optimization work is measurable and gated.

## File targets
- `package.json`
- `scripts/perf-baseline.mjs` (new)
- `README.md` or `docs/perf.md` (new/update)

## Tasks
- [ ] Add script to parse Next build output and produce JSON baseline
- [ ] Add `npm run perf:baseline`
- [ ] Document baseline usage and threshold policy

## Acceptance criteria
- [ ] `npm run perf:baseline` produces deterministic report artifact
- [ ] No app runtime behavior changes

## Test cases
- [ ] Run `npm run build && npm run perf:baseline`
- [ ] Verify report includes route-level stats and total client JS
```

## 2) Issue 02

**Title:** Extract `ChatWidget` inline styles into CSS module  
**Labels:** `perf`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/app/ChatWidget.tsx`
- `src/app/ChatWidget.module.css` (new)

## Tasks
- [ ] Move `<style>{...}</style>` CSS into module file
- [ ] Replace className usage to module references
- [ ] Preserve existing responsive/mobile behavior

## Acceptance criteria
- [ ] Visual parity with current widget on desktop/mobile
- [ ] `ChatWidget.tsx` contains no embedded `<style>` block

## Test cases
- [ ] Open/close widget
- [ ] Send message + PIN flow
- [ ] iOS keyboard and scrolling behavior still works
```

## 3) Issue 03

**Title:** Extract `MiaWidget` inline styles into CSS module  
**Labels:** `perf`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/app/MiaWidget.tsx`
- `src/app/MiaWidget.module.css` (new)

## Tasks
- [ ] Move style block to CSS module
- [ ] Keep voice control/scratchpad layout unchanged

## Acceptance criteria
- [ ] Visual parity for connected/disconnected/muted states
- [ ] No inline `<style>` in `MiaWidget.tsx`

## Test cases
- [ ] Connect session, send/receive transcript
- [ ] Toggle mute
- [ ] Disconnect and reconnect
```

## 4) Issue 04

**Title:** Extract homepage inline styles from `page.tsx`  
**Labels:** `perf`, `frontend`, `maintainability`  
**Depends on:** none

```md
## File targets
- `src/app/page.tsx`
- `src/app/page.module.css` (new)

## Tasks
- [ ] Move large home-page style block into CSS module
- [ ] Preserve existing card, hero, and security section styles

## Acceptance criteria
- [ ] No inline `<style>` in `page.tsx`
- [ ] Homepage layout and responsiveness unchanged

## Test cases
- [ ] Compare desktop/mobile screenshots before/after
- [ ] Validate sticky header and sections render correctly
```

## 5) Issue 05

**Title:** Lazy-load ChatWidget and MiaWidget  
**Labels:** `perf`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/app/page.tsx`
- `src/app/WidgetSkeleton.tsx` (new, optional)

## Tasks
- [ ] Use dynamic import for `ChatWidget` and `MiaWidget`
- [ ] Add minimal fallback skeleton/loading UI

## Acceptance criteria
- [ ] Initial route JS payload reduced
- [ ] Widgets still function once loaded

## Test cases
- [ ] Cold load `/` and verify deferred widget loading
- [ ] Confirm chat/voice functionality after interaction
```

## 6) Issue 06

**Title:** Cap in-memory transcript length in both widgets  
**Labels:** `perf`, `scalability`  
**Depends on:** none

```md
## File targets
- `src/app/ChatWidget.tsx`
- `src/app/MiaWidget.tsx`
- `src/lib/constants.ts` (new, optional)

## Tasks
- [ ] Add max message count cap (example: 200)
- [ ] Drop oldest messages when cap exceeded

## Acceptance criteria
- [ ] Message arrays never exceed configured cap
- [ ] User-visible behavior remains normal

## Test cases
- [ ] Simulate >250 messages and verify cap enforcement
- [ ] Ensure latest messages remain visible and scroll works
```

## 7) Issue 07

**Title:** Replace index keys with stable message IDs  
**Labels:** `frontend`, `reliability`  
**Depends on:** none

```md
## File targets
- `src/app/ChatWidget.tsx`
- `src/app/MiaWidget.tsx`

## Tasks
- [ ] Add `id` field to message model
- [ ] Use deterministic key (`msg.id`) in list rendering

## Acceptance criteria
- [ ] No `key={i}` usages remain for message lists
- [ ] Rendering stability improves on rapid updates

## Test cases
- [ ] Rapid message append and verify no visual flicker/reorder
- [ ] React warnings absent in dev console
```

## 8) Issue 08

**Title:** Optimize auto-scroll behavior for constrained devices  
**Labels:** `perf`, `mobile`  
**Depends on:** none

```md
## File targets
- `src/app/ChatWidget.tsx`
- `src/app/MiaWidget.tsx`
- `src/app/globals.css` (optional)

## Tasks
- [ ] Throttle/debounce scroll-to-bottom actions
- [ ] Respect reduced motion settings for smooth scrolling
- [ ] Avoid redundant scroll calls while loading bursts

## Acceptance criteria
- [ ] Reduced scroll jank in long conversations
- [ ] Accessibility motion preference respected

## Test cases
- [ ] Run long chat sequence on mobile viewport
- [ ] Confirm no scroll jumping during rapid message updates
```

## 9) Issue 09

**Title:** Centralize env/config validation (fail-closed)  
**Labels:** `security`, `architecture`  
**Depends on:** none

```md
## File targets
- `src/lib/config.ts` (new)
- `src/app/api/chat/route.ts`
- `src/app/MiaWidget.tsx` (public config usage only)
- `.env.example`

## Tasks
- [ ] Add typed config loader with strict validation
- [ ] Fail closed for missing required server env
- [ ] Keep public env usage explicit and minimal

## Acceptance criteria
- [ ] Config errors are deterministic and actionable
- [ ] Missing `CHAT_API_URL` behavior remains controlled

## Test cases
- [ ] Start/build with missing env and confirm expected failure path
- [ ] Start/build with valid env and confirm normal behavior
```

## 10) Issue 10

**Title:** Add shared chat request/response contract schemas  
**Labels:** `architecture`, `security`  
**Depends on:** none

```md
## File targets
- `src/lib/chat-contract.ts` (new)
- `src/app/api/chat/route.ts`
- `src/app/ChatWidget.tsx` (types/adapters)

## Tasks
- [ ] Define chat request/response schema and constants centrally
- [ ] Reuse constants for max lengths and field validation

## Acceptance criteria
- [ ] API and client use same schema definitions
- [ ] Duplicate validation constants removed from route

## Test cases
- [ ] Valid payload accepted
- [ ] Invalid payloads rejected (empty message, oversize, bad pin)
```

## 11) Issue 11

**Title:** Refactor `/api/chat` into layered modules  
**Labels:** `architecture`, `maintainability`  
**Depends on:** none

```md
## File targets
- `src/app/api/chat/route.ts`
- `src/lib/chat/guards.ts` (new)
- `src/lib/chat/validation.ts` (new)
- `src/lib/chat/upstream.ts` (new)
- `src/lib/chat/response.ts` (new)

## Tasks
- [ ] Split guard/validation/upstream/response concerns
- [ ] Keep external API behavior unchanged

## Acceptance criteria
- [ ] Route remains compatible with current frontend
- [ ] Logic is modular and testable per layer

## Test cases
- [ ] Success path response unchanged
- [ ] Error statuses/messages remain consistent
```

## 12) Issue 12

**Title:** Extract `useChatSession` hook from ChatWidget  
**Labels:** `architecture`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/hooks/useChatSession.ts` (new)
- `src/app/ChatWidget.tsx`

## Tasks
- [ ] Move transport/state logic into hook
- [ ] Keep ChatWidget as presentational + event wiring

## Acceptance criteria
- [ ] User behavior unchanged for chat + PIN flow
- [ ] ChatWidget file size/complexity reduced

## Test cases
- [ ] Send/receive message path
- [ ] PIN verify success/failure path
- [ ] Network error path
```

## 13) Issue 13

**Title:** Extract `useMiaConversation` hook from MiaWidget  
**Labels:** `architecture`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/hooks/useMiaConversation.ts` (new)
- `src/app/MiaWidget.tsx`

## Tasks
- [ ] Move ElevenLabs session lifecycle and transcript logic to hook
- [ ] Keep UI rendering in component

## Acceptance criteria
- [ ] Voice widget behavior unchanged
- [ ] Component complexity reduced

## Test cases
- [ ] Connect/disconnect cycle
- [ ] Mute toggle behavior
- [ ] Permission denied error handling
```

## 14) Issue 14

**Title:** Enforce strict 6-digit PIN server-side  
**Labels:** `security`, `domain`  
**Depends on:** none

```md
## File targets
- `src/lib/chat-contract.ts`
- `src/app/api/chat/route.ts`
- `src/app/ChatWidget.tsx` (error messaging only if needed)

## Tasks
- [ ] Validate `pin` as exactly 6 digits server-side
- [ ] Reject non-numeric and wrong-length PIN values

## Acceptance criteria
- [ ] API rejects malformed PIN regardless of client behavior
- [ ] UI still supports standard 6-digit flow

## Test cases
- [ ] PIN values: `123456` accepted; `12345`, `abcdef`, `1234567` rejected
```

## 15) Issue 15

**Title:** Implement server-side PIN lockout policy (3 failures / 15 min)  
**Labels:** `security`, `reliability`  
**Depends on:** none

```md
## File targets
- `src/lib/security/pinLockoutStore.ts` (new)
- `src/app/api/chat/route.ts`

## Tasks
- [ ] Track failed PIN attempts
- [ ] Lock principal for 15 minutes after 3 failures
- [ ] Return explicit locked response

## Acceptance criteria
- [ ] Policy is enforced server-side
- [ ] Lockout state survives within app process lifetime

## Test cases
- [ ] 3 failed attempts => locked response
- [ ] Locked request before expiry remains blocked
- [ ] Request after expiry allowed
```

## 16) Issue 16

**Title:** Add `/api/chat` rate limiting (IP + identifier/session)  
**Labels:** `security`, `scalability`  
**Depends on:** none

```md
## File targets
- `src/lib/security/rateLimit.ts` (new)
- `src/app/api/chat/route.ts`

## Tasks
- [ ] Add rate limiter utility
- [ ] Apply limits before upstream fetch
- [ ] Return 429 with retry semantics

## Acceptance criteria
- [ ] Bursts beyond threshold are throttled
- [ ] Normal traffic unaffected

## Test cases
- [ ] Burst over limit returns 429
- [ ] Sustained normal rate returns success
```

## 17) Issue 17

**Title:** Fail-closed origin validation with explicit allowlist  
**Labels:** `security`  
**Depends on:** none

```md
## File targets
- `src/lib/config.ts`
- `src/app/api/chat/route.ts`
- `.env.example`

## Tasks
- [ ] Add allowed origins config
- [ ] Reject missing/invalid origin by policy
- [ ] Preserve local dev support with explicit dev origin

## Acceptance criteria
- [ ] Non-allowlisted origins are blocked
- [ ] Same-origin app requests continue working

## Test cases
- [ ] Request with allowed origin succeeds
- [ ] Missing/disallowed origin fails with 403
```

## 18) Issue 18

**Title:** Replace client console logging with redacted telemetry wrapper  
**Labels:** `security`, `observability`, `frontend`  
**Depends on:** none

```md
## File targets
- `src/lib/clientTelemetry.ts` (new)
- `src/app/ChatWidget.tsx`
- `src/app/MiaWidget.tsx`
- `.github/workflows/security-gates.yml` (optional policy update)

## Tasks
- [ ] Replace direct `console.error` in widgets
- [ ] Ensure PII redaction before client reporting
- [ ] Optionally tighten CI logging regex policy

## Acceptance criteria
- [ ] No raw error objects logged in production browser console
- [ ] Errors are still diagnosable in controlled channels

## Test cases
- [ ] Force client error and verify redacted output path
- [ ] Ensure no `console.error(` remains in target files
```

## 19) Issue 19

**Title:** Add CI quality gates (build + typecheck + lint)  
**Labels:** `ci`, `reliability`  
**Depends on:** none

```md
## File targets
- `.github/workflows/quality-gates.yml` (new)
- `package.json`
- `eslint.config.*` or `.eslintrc.*` (new if needed)

## Tasks
- [ ] Add workflow for build/typecheck/lint on PR + main push
- [ ] Add required npm scripts (`typecheck`, `lint`)

## Acceptance criteria
- [ ] CI fails on build/type/lint regressions
- [ ] Workflow runtime is stable and deterministic

## Test cases
- [ ] PR with intentional TS error fails gate
- [ ] PR with clean code passes gate
```

## 20) Issue 20

**Title:** Add minimal automated tests for critical paths  
**Labels:** `testing`, `reliability`, `security`  
**Depends on:** none

```md
## File targets
- `package.json`
- `vitest.config.ts` (new) or equivalent
- `src/lib/chat-contract.test.ts` (new)
- `src/app/api/chat/route.test.ts` (new)

## Tasks
- [ ] Add test runner + scripts
- [ ] Test payload validation, timeout/error mapping, and security guards

## Acceptance criteria
- [ ] Tests run in CI
- [ ] Critical route/security logic has baseline coverage

## Test cases
- [ ] `npm test` passes locally and in CI
- [ ] Validation and error-path assertions are deterministic
```

## 21) Issue 21

**Title:** Pin gitleaks image to immutable digest  
**Labels:** `security`, `ci`, `supply-chain`  
**Depends on:** none

```md
## File targets
- `.github/workflows/security-gates.yml`

## Tasks
- [ ] Replace `zricethezav/gitleaks:latest` with immutable digest
- [ ] Document update procedure for digest refresh

## Acceptance criteria
- [ ] Secret scan is reproducible across runs
- [ ] No behavior drift from mutable image tags

## Test cases
- [ ] Run workflow and confirm scan executes successfully
- [ ] Validate referenced image uses digest notation
```

## 22) Issue 22

**Title:** Add request correlation IDs, structured logs, and `/api/health`  
**Labels:** `observability`, `reliability`  
**Depends on:** none

```md
## File targets
- `src/app/api/chat/route.ts`
- `src/app/api/health/route.ts` (new)
- `src/lib/observability.ts` (new)

## Tasks
- [ ] Generate/request correlation ID
- [ ] Emit structured server logs with key fields (no PII)
- [ ] Add health endpoint for readiness checks

## Acceptance criteria
- [ ] Chat logs are traceable by request ID
- [ ] `/api/health` returns stable readiness payload

## Test cases
- [ ] Call `/api/chat` and verify request ID in response/logs
- [ ] Call `/api/health` and validate 200 + expected JSON
```

## 23) Issue 23

**Title:** Correct floor-plan terminology (FPC vs lender) in UI copy  
**Labels:** `domain`, `content`  
**Depends on:** none

```md
## File targets
- `src/app/page.tsx`

## Tasks
- [ ] Replace floor-plan "lender(s)" with "FPC / floor plan company" wording
- [ ] Keep consumer finance "lender" language only in F&I context

## Acceptance criteria
- [ ] Floor-plan section uses correct FPC terminology
- [ ] No ambiguous domain language in affected cards

## Test cases
- [ ] Manual content review against domain glossary
- [ ] Confirm no broken JSX/escaping in updated copy
```

## 24) Issue 24

**Title:** Add domain glossary lint check in CI (FPC vs lender guardrail)  
**Labels:** `domain`, `ci`, `quality`  
**Depends on:** none

```md
## File targets
- `scripts/domain-glossary-check.mjs` (new)
- `.github/workflows/quality-gates.yml` (or new workflow)
- `docs/domain-glossary.md` (new)

## Tasks
- [ ] Define allowed/forbidden term patterns by context
- [ ] Add CI check to fail on violations
- [ ] Document terminology rules for contributors

## Acceptance criteria
- [ ] CI fails on invalid domain wording regressions
- [ ] Rules are documented and easy to update

## Test cases
- [ ] Introduce intentional forbidden phrase and confirm CI fails
- [ ] Correct terminology and confirm CI passes
```

---

## Optional: Quick CLI Usage

You can use this file as source material for `gh issue create` calls.  
Recommended flow:
1. Create the master epic first.
2. Create issues 01-24 in order.
3. Link each issue back to the epic checklist.

