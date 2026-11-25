---
name: ds-validate-tokens
description: Verify token changes landed — references hit the right layer, Style Dictionary builds, variables appear in Base and brand CSS. Use after token changes or when a var() resolves to nothing.
---

# ds-validate-tokens

Prove a token change is real. A definition in `Base.tokens.json` that never reaches the
generated CSS does not exist as far as any component is concerned.

**Never report a token as shipped without the generated-CSS line that proves it.**

## Phase 1: Check references before building

In `Base.tokens.json` and each brand file:

- Every `{reference}` resolves to a token that exists.
- No layer violation — a token references only layers to its **left**
  (`Global → Alias → Device → Component`). An Alias pointing at a Component token is
  backwards and will build fine while being architecturally wrong.
- Every token carrying `$extensions.com.helvetia.responsive` sits in Device.
- Colors carry the full value shape (`colorSpace`, `components`, `alpha`, `hex`), not a bare
  string.

## Phase 2: Build

```bash
pnpm tokens
```

Style Dictionary compiles `tsc` then runs `dist/out-tsc`. An unresolved reference usually
fails the build — but a _silently dropped_ token often does not, which is why Phase 3 exists.

Typography has its own guard (`src/validate-typography.ts`); a typography failure is a real
defect, not a nuisance.

## Phase 3: Verify the output

Grep the generated CSS for each token you expect — do not assume the build emitted it:

```bash
grep -n -- '--ds-<token-name>' packages/tokens/dist/css/base.tokens.css
```

Check **all four outputs per brand**, because a brand that fails to merge still produces a
valid-looking Base file:

| File                   | Scope                    |
| ---------------------- | ------------------------ |
| `base.tokens.css`      | `:host, :root`           |
| `base.override.css`    | `[data-theme="base"]`    |
| `<brand>.tokens.css`   | `:host, :root`           |
| `<brand>.override.css` | `[data-theme="<brand>"]` |

Both files for a brand carry the **identical full token set** — they are self-sufficient, not
diffs (ADR-0030). A token present in `base.tokens.css` but missing from
`orange-vacations.tokens.css` is a merge failure, not an expected difference.

Confirm too that a removed token is **gone from every output**, and that a renamed one no
longer appears under its old name anywhere.

## Phase 4: Check the consumers

- `grep -rn 'var(--ds-<old-name>' packages/` — no component still references a renamed or
  removed token.
- No component references a token that exists in a brand file but not in Base.
- Run the visual suites for affected components and report the diff. **Never accept a new
  snapshot** — re-baselining is `ds-update-screenshots`, user-invoked.

## Report

- Commands run, with output
- Tokens verified present, per output file
- Build result, including typography validation
- Unresolved references, missing variables, or brand/Base mismatches
- Visual diffs, with the components affected
- What was not verified, and why
