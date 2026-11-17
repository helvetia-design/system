# Cross-phase conventions — code → Figma

Rules and topic files that apply across several phases of the `ds-code-to-figma` skill. Prop-to-
variant mapping and the 500-variant check are **not** here — they live in
[`PHASE-2-PROPOSE.md`](PHASE-2-PROPOSE.md) (step 1 table, step 3). This file (and its
`conventions/*.md` topic files) are only ever changed by the skill _proposing_ an addition and the
user _approving_ it — never auto-appended.

## Index

- **Cross-phase rules** (below) — category pages and fixed category copy, "never lock a node",
  "no attribute is ever assumed".
- [`conventions/tokens-and-props.md`](conventions/tokens-and-props.md) — resolving design tokens
  (Phase 1), and verifying a claimed value/behavior before trusting it (Phase 1).
- [`conventions/content-selection-and-mitigations.md`](conventions/content-selection-and-mitigations.md)
  — the wrapper + Instance Swap pattern for open-ended content props and the 500-variant
  threshold's mitigations (Phase 2, conditional; Phase 3).
- [`conventions/page-structure.md`](conventions/page-structure.md) — category pages, the
  one-documentation-frame-per-component invariant, the `inverted`-axis handling (Phase 3).
- [`conventions/component-set-rendering.md`](conventions/component-set-rendering.md) — Component
  Set axis labeling, sizing/grid mechanics, screenshot reliability for this section (Phase 3).
- [`conventions/document-sections.md`](conventions/document-sections.md) — `Section` / `Preview` /
  `Title` mechanics for the Copy me, Anatomy and Measurements sections (Phases 6–8).
- [`conventions/measurements.md`](conventions/measurements.md) — which sizes Measurements shows (groups, triage rules)
  and how each one is drawn (kinds, line styles, section layout) (Phases 1 and 8).
- [`conventions/families.md`](conventions/families.md) — documentation owner and sub-components:
  family resolution, lockstep phases, parent-set props, slots, anatomy and measurements (every phase).
- [`conventions/build-mechanics.md`](conventions/build-mechanics.md) — general Figma Plugin API
  gotchas that apply across any phase: platform limits, variant-set mechanics, auto-layout
  sizing, vector import, color/paint, focus states.

## Glossary

Use these terms, and only these, in every phase and topic file.

| Term                                          | Meaning                                                                                                                                                                                                                                                                  | Don't say                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **mapping file**                              | `<name>.figma.md` ([schema](examples/mapping-file-format.md)). _Draft_ after Phase 1, _confirmed_ after Phase 2.                                                                                                                                                         | plan, approved plan, confirmed mapping, mapping-file schema      |
| **mapping-file fields**                       | `sets:` (per set: `name`, `figmaComponentKey`, `figmaMasterNodeId`; default first), `figmaDocFrameNodeId`, `figmaPage` — by field name.                                                                                                                                  | component key/node-id, component node id, category page name     |
| **component set**                             | A Figma `COMPONENT_SET`.                                                                                                                                                                                                                                                 | variant matrix, master `COMPONENT_SET`, variant grid             |
| **variant**                                   | One `COMPONENT` child of a component set.                                                                                                                                                                                                                                | variant combination                                              |
| **default variant**                           | Every variant property at its code default, `state=default`. Always the top-left cell of its set.                                                                                                                                                                        | default/base combination, first variant, representative instance |
| **variant property** / **axis**               | A Figma variant property. Say _axis_ only for its place in the grid (rows/columns).                                                                                                                                                                                      |                                                                  |
| **labeled set**                               | The template's `Labeled Set`: component set + `Row Labels` + `Column Labels` + `Grid` (`PHASE-3-BUILD.md` → "Labeled component set").                                                                                                                                    | Component Set display                                            |
| **stack**                                     | One labeled set plus its `sub-label` (= set name) inside `Sets` — one per top-level split option.                                                                                                                                                                        |                                                                  |
| **top-level split**                           | One component set per option, only per `PHASE-2-PROPOSE.md` → "Top-level splits" rule 1 (structure), 2 (inverted) or 3 (count).                                                                                                                                          | structural split, separate top-level components                  |
| **inverted axis**                             | An `inverted` prop; its sets are `<Component>` / `<Component>Inverted`.                                                                                                                                                                                                  | dark-context axis, true `inverted` axis, `inverted`-split        |
| **family**                                    | Every `@Component` in one family folder (`<category>/<family>/`): one owner plus its sub-components (`conventions/families.md`).                                                                                                                                         | component group, compound component                              |
| **documentation owner** / **owner**           | The family member with its own Storybook page; owns the one documentation frame (`packages/core/CONTEXT.md`).                                                                                                                                                            | parent, main component                                           |
| **sub-component**                             | A family member with no Storybook page of its own; built in the owner's run, stacked in the owner's frame.                                                                                                                                                               | child component, companion                                       |
| **nested component**                          | An independent DS component from another family used inside a member (`ds-icon`); must already be in Figma.                                                                                                                                                              | child component, inner component                                 |
| **parent-set prop**                           | A sub-component prop the owner sets (`@internal`, "Set by ds-…"); recorded as `drivenBy` (`conventions/families.md` §3).                                                                                                                                                 | internal axis                                                    |
| **icon slot**                                 | A nested `ds-icon` / `ds-brand-icon` in a parent; always the glyph nested directly, with one `INSTANCE_SWAP` property (`conventions/content-selection-and-mitigations.md`).                                                                                              | exposed icon instance                                            |
| **consumer-authored text**                    | Text a consumer writes in code: a string prop rendered as text (`label`, `placeholder`, `invalidText`) or a text-only slot (`ds-button`'s label). Its counterpart is **generated text**, which the component renders itself (page numbers, counter digits): no property. | free text                                                        |
| **text property**                             | A Figma `TEXT` component property bound to a text node's `characters`; one per consumer-authored text (`PHASE-2-PROPOSE.md` → mapping table).                                                                                                                            | instance text override, text override                            |
| **wrapper + swap library**                    | The content-selection pattern (`conventions/content-selection-and-mitigations.md`). Not a top-level split.                                                                                                                                                               | wrapper + Instance Swap split                                    |
| **documentation frame**                       | `<Component> Documentation` on the category page.                                                                                                                                                                                                                        |                                                                  |
| **`Documentation` / `Component Sets` column** | The two `body` columns of the documentation frame (layer names).                                                                                                                                                                                                         | left `documentation` column, 🔒 Component Set panel              |
| **naming**                                    | Properties, option values: lowercase with spaces. Set names and `sub-label`s: flat PascalCase (`PHASE-2-PROPOSE.md` → "Naming").                                                                                                                                         | `Show icon`, `labelPosition`, `button/primary`                   |
| **default set**                               | The component set holding every split axis's code default; carries the bare name (`Button`).                                                                                                                                                                             | primary set                                                      |
| **variation**                                 | One entry in the Variations section: a variant with one `show <name>` boolean that defaults to `false` (or all of them, "all on") set to `true`, at one option of each dependent axis (`PHASE-3-BUILD.md` → "Variations").                                               | variant (for an entry), hidden-layer example, toggle example     |
| **dependent axis**                            | A variant axis that only makes a visible difference while a `show` boolean is `true` (spinner `label position` depends on `show label`).                                                                                                                                 |                                                                  |
| **table axis**                                | The axis whose options are the Measurements sizes table's columns (`conventions/measurements.md`).                                                                                                                                                                       | Variants axis                                                    |
| **checkpoint** (🟡) / **hard stop** (🛑)      | Per [`DECISIONS.md`](DECISIONS.md). Lowercase in prose.                                                                                                                                                                                                                  | HARD STOP                                                        |

## Cross-phase rules (seeded, not learned)

- **Components are grouped onto one shared Figma page per code category, not one page per
  component — `Core / <Category>`, Title Case, plural, matching the code folder name exactly.**
  The seven categories and their fixed title/lead copy for the shared
  category-page header (see `PHASE-3-BUILD.md`'s "Category pages" section) — **never
  invent category copy on the fly, this table is the source of truth**:

  | Category (folder) | Page name           | Title      | Lead                                                                                   |
  | ----------------- | ------------------- | ---------- | -------------------------------------------------------------------------------------- |
  | `indicators`      | `Core / Indicators` | Indicators | Indicators communicate status, progress, or emphasis to the user.                      |
  | `actions`         | `Core / Actions`    | Actions    | Actions let users trigger a task, submission, or navigation with a single interaction. |
  | `forms`           | `Core / Forms`      | Forms      | Forms collect, validate, and submit user input across a range of field types.          |
  | `media`           | `Core / Media`      | Media      | Media displays brand, imagery, and iconography consistently across the product.        |
  | `navigation`      | `Core / Navigation` | Navigation | Navigation helps users move between and orient themselves within views.                |
  | `overlays`        | `Core / Overlays`   | Overlays   | Overlays surface contextual content above the page without losing the user's place.    |
  | `structure`       | `Core / Structure`  | Structure  | Structure organizes and arranges content into a clear, consistent layout.              |

  If a category is ever missing from this table (e.g. a new category folder is added to
  `packages/core/CONTEXT.md`'s Usage-Category Taxonomy), stop and ask the user for title/lead
  copy before building that category's page — same hard-stop discipline as a missing design
  token, never guessed. See [`conventions/page-structure.md`](conventions/page-structure.md) for
  the one-documentation-frame-per-component invariant (including the `inverted`-axis handling).

- **Never lock any Figma node this skill builds** — no component set, no display clone,
  no documentation-frame content, nothing. The current template has no table geometry for a human
  to accidentally misalign, so locking only gets in the way of inspecting, selecting, or
  rearranging content directly in the Figma UI.

- **No visual attribute is ever assumed — every value on every Figma node needs an explicit,
  resolved design token, even if the component's own SCSS never sets that attribute at all.** A
  CSS-var binding is the common case, not the only case that counts: an attribute a component
  inherits (e.g. `color`/`font-size` on a text part that relies on Shadow DOM inheritance) still
  needs a token bound to it in Figma. Treat a missing token for _any_ attribute (inherited,
  hardcoded in `.tsx`, or CSS-var-bound) as the same hard stop: ask the user to pick an existing
  token or explicitly accept a one-off hardcode, never silently build with an assumed value. See
  [`conventions/tokens-and-props.md`](conventions/tokens-and-props.md) for resolution mechanics
  and verification techniques.
