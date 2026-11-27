---
name: ds-validate-documentation
description: Verify docs match the source and build — props/events/slots exist, examples work, storyIds resolve, Storybook builds. Use after changing any Storybook page, story or guide.
---

# ds-validate-documentation

Prove the documentation is true and that it builds.

Documentation fails differently from code: a wrong page builds perfectly and ships. So
accuracy is checked by reading, and the build only catches the rest.

**Never report a page as correct without naming the source you checked it against.**

## Phase 1: Technical accuracy

This is the part no command covers. For each page changed:

- **Every prop, event, method, slot and part named in prose exists** in the component's
  `.tsx`. Read it — do not trust the previous version of the page.
- **Every code example runs against the current API.** No removed props, no renamed events,
  no `ds-` tag that doesn't exist. An example is a promise.
- **No hand-written API table** where a block (`ComponentLead`, `ComponentPublicMethods`,
  `ComponentParts`, `ComponentCssVariables`, `ComponentPageObject`) should be binding to
  `components.json`. A hand-written table is a future lie.
- **Accessibility claims come from the a11y-expert's verified criteria**, never from the page
  author. If no verification exists, the page says what is unverified.

## Phase 2: Wiring

- Every `doc-config.ts` storyId resolves to an exported story.
- Every MDX meta title is a **string literal** — a computed title breaks Storybook's indexer.
- Every story the pages reference still exists under that export name.
- Imports are limited to blocks actually used.

## Phase 3: Build

```bash
node scripts/build-docs.mjs                              # regenerate components.json et al
pnpm --filter @helvetia-design/storybook lint
pnpm spell
pnpm docs:preview                                        # full build, then serves apps/storybook/dist
```

`build-docs.mjs` regenerates the data the blocks bind to — run it **before** judging a block
that renders empty. An empty `ComponentParts` usually means missing JSDoc in the component,
which is a finding for the component-engineer, not a documentation bug.

Pipe long build output to a file and read the tail rather than dumping it into context.

## Phase 4: Render

A page that builds can still be broken. For anything changed, open it and confirm:

- The page renders, and every canvas on it renders.
- Controls appear and are wired to args — a story with hardcoded template attributes shows
  controls that do nothing.
- Both the `🧩` web-component and `🌍` HTML/CSS variants render, where the component has both.

A story that throws takes down the page that embeds it, so a green build is not sufficient
evidence.

## Report

- Pages checked, and the source file each claim was verified against
- Commands run, with outcome
- Inaccuracies found and fixed
- Findings belonging to another owner — missing JSDoc, a wrong token, an unverified a11y
  claim — raised, not fixed here
- What was not verified, and why
