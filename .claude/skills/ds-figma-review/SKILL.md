---
name: ds-figma-review
description: Check a built Figma component against the code it mirrors — variant axes against props, token bindings against the SCSS cascade, nested components against their own sets, header and layout against the template. Writes a pass/fail/blocked verdict report and repairs the failures. Use after building a Figma component, or when code has changed since.
---

# ds-figma-review

Verify the Figma component still tells the truth about the code.

**Mechanics live in [`PHASE-4-VALIDATE.md`](../ds-code-to-figma/PHASE-4-VALIDATE.md) (the check
list and report format) and [`PHASE-5-REPAIR.md`](../ds-code-to-figma/PHASE-5-REPAIR.md) (the
repair loop).** Read those; this skill is the contract.

Load `figma-use` once, before the first `use_figma` call (skip if already loaded this run).

## Two reasons to run

1. **After a build** — did `ds-figma-component-set` produce what the plan specified?
2. **After the code changed** — a new prop, a new enum value, a renamed token or a removed part
   silently makes the Figma component a lie. Nothing else catches this: Figma has no test suite.

The second case is the one worth scheduling. A Figma library that drifts is worse than no
library, because designers trust it.

## Phase 1: Read both sides

Read-only. The code (`<name>.tsx`, `.interfaces.ts`, `.host.scss`), the mapping file
(`<name>.figma.md`), and the live Figma nodes — **as data first**: one `use_figma` call that
returns every variant's properties, size, bound variable ids and instance sources as JSON.
Screenshot each set once at most, only for checks data cannot answer (layout, labels).

## Phase 2: Check

Per `PHASE-4-VALIDATE.md`. The checks that matter most, and what each catches:

| Check                                                       | Catches                                                |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| Every enum value in `.interfaces.ts` is a variant value     | a value added in code, missing in Figma                |
| Every Figma variant value exists in `.interfaces.ts`        | a value removed in code, stale in Figma                |
| Every styled value binds to a variable, none hardcoded      | a hardcode that will not follow a token change         |
| Each bound variable is the one the SCSS cascade resolves to | bound to the wrong layer, or another component's token |
| Nested/sub-components are instances of their own sets       | a forked copy that won't follow its master             |
| Each icon slot has exactly one `INSTANCE_SWAP`              | a baked-in icon                                        |
| `@part` tags match the Anatomy legend                       | a part renamed in code                                 |
| Header fields and set layout match the template             | drift from the library's own conventions               |

**Comparing the two enum directions separately is the point.** "Figma has every code value" and
"code has every Figma value" fail on different changes — an addition versus a removal — and a
single bidirectional check reports neither clearly.

## Phase 3: Verdict

Write `<name>.figma-validation.md` with `pass` / `fail` / `blocked` per check and overall.

- `fail` — verified wrong, with what Figma has and what the code says
- `blocked` — could not verify; say why. Never report an unverified check as `pass`.

## Phase 4: Repair

Fix every `fail` **in place**, append a repair log, then re-run Phase 2. **Maximum 3
iterations**, then hard stop and report what is unresolved — a check that fails the same way
three times is not going to be fixed by a fourth attempt, and the loop is burning a human's
Figma file.

**Repair Figma, not code.** If the review shows the _code_ is wrong — a token-layer violation, a
missing `@part`, an enum value that shouldn't exist — that is a finding for the
component-engineer or token-engineer. Report it; do not "fix" Figma to match a bug.

## Deliver

- `<name>.figma-validation.md` with the verdict and repair log
- Code-side findings, routed by owner
- Unresolved failures after 3 iterations

Never commit.
