# 34. A changed Figma variable type deletes and recreates the variable

Package: `packages/tokens`

Date: 2026-11-02

Status: Accepted

## Context

Line-height tokens are stored as the unitless multiplier `1.5`, but Figma shows line height as a
percentage, `"150%"`. A Figma `FLOAT` variable cannot carry the `%` symbol, so the Figma side had to
move from `FLOAT` to `STRING`. Figma cannot change a variable's `resolvedType` after creation, and
[ADR-0011](0011-figma-variable-identity-key.md) makes the `variableId` the identity key.

## Decision

The Figma Sync Action compares each already-synced token's Figma `resolvedType` with the type it now
expects. On a mismatch it deletes the token's Figma variable(s) in a dedicated first request and then
treats the token as new: it gets a fresh `variableId`, which the existing backfill commit
([ADR-0017](0017-direct-commit-variableid-backfill.md)) writes back. A composite token (typography)
is recreated as a whole, because its sub-variables that still match would otherwise collide by name
with their recreated siblings. This is permanent behavior, not a one-off script.

## Consequences

- Any future type change migrates itself on the next run, with no manual step or ordering risk.
- Anything in Figma bound to a recreated variable (styles, components, other files) breaks once and
  must be rebound. The recreated variable has the same name but a new identity.
- The deletion is not gated by a confirmation, same trade-off as
  [ADR-0019](0019-pull-auto-deletes-figma-variables.md).
- The old ids drop out of the sync baseline as stale entries, so the conflict check never reads the
  recreate as a deletion.
