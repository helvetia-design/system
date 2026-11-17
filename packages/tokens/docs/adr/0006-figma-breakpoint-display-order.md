# 6. Figma breakpoint variable creation order is desktop-first, independent of JSON order

Date: 2026-11-03

## Status

Accepted

## Context

Every responsive Device token carries `$extensions.com.helvetia.responsive` with
keys always written `mobile → tablet → desktop`, matching the mobile-first CSS
cascade (`formatter.ts` hardcodes this same order when generating media
queries, independent of JSON key order). This mobile-first order is correct
for code and stays unchanged.

UX designers work desktop-first. When the Token Sync Plugin's Phase 2 (Pull:
GitHub → Figma) creates the three per-breakpoint Figma Variables for a
responsive token (`createVariable` calls for mobile/tablet/desktop), creating
them in JSON order would surface them to designers as mobile → tablet →
desktop in the Figma Variables panel — backwards for how UX people think
about and scan the collection.

## Decision

Phase 2's variable-creation step uses an explicit, hardcoded order constant —
`desktop, tablet, mobile` — when creating the three per-breakpoint Variables
for a responsive token, instead of iterating the token's
`com.helvetia.responsive` object in its own key order. This affects only
Figma Variable creation order in Phase 2; it does not touch:

- `Base.tokens.json` / brand file key order (stays `mobile, tablet, desktop`)
- CSS/SCSS build output order (`formatter.ts` already hardcodes its own order,
  unaffected either way)
- The diff table, `DiffEngine`, or any other part of the sync engine
- The hand-maintained Figma file in use before the plugin exists (out of
  scope — not touched by this decision)

## Consequences

- Figma's Variables panel shows Desktop → Tablet → Mobile for every
  responsive token once Phase 2 populates it, matching how UX people work.
- Code and data stay mobile-first everywhere else — the divergence is
  isolated to one explicit constant in the variable-creation step, not an
  implicit side effect of JSON order.
- A future reader of the sync plugin code who notices Figma variables appear
  in the opposite order from the JSON they came from has this ADR to explain
  why, instead of assuming it's a bug.
