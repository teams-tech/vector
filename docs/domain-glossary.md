# Domain Glossary Guardrails

This project enforces terminology rules to avoid ambiguous routing between floor-plan operations and consumer finance operations.

## Required language

- **FPC** or **floor plan company** for floor-plan providers (for example, AFC and NextGear in floor-plan context).
- **Lender** only when the text is explicitly in **consumer finance / F&I** context.

## Forbidden patterns

- "floor plan(s) ... lender(s)"
- "AFC ... lender(s)" (when referring to floor plans)
- "NextGear ... lender(s)" (when referring to floor plans)
- ambiguous lender wording without finance/F&I context

## CI enforcement

The glossary check runs in CI via:

```bash
npm run domain:check
```

Script location:

- `scripts/domain-glossary-check.mjs`
