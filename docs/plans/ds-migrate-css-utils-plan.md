# Plan: CSS utils step in `ds-migrate-from-baloise`

## Context

The skill menu lists **CSS utils** as "coming soon". Init already loads the Helvetia utilities
beside the Baloise ones, and PR #152 (`fix/init-keep-legacy-utilities`) keeps the Baloise
utilities line in place with a TODO comment above it. The CSS utils step rewrites the legacy
utility classes in the consumer's markup and, once none is left, deletes that line and its TODO.

The step follows the **Assets** pattern: a mapping file in `shared/`, a scanner in `scripts/`,
a rule file in `shared/`, and a section in `SKILL.md` that runs scan, confirm, rewrite, report.

Reference material: `SKILL.md` (Assets section), `shared/icons.md` and `shared/icon-name-map.json`
(groups `renamed`, `approximated`, `lost`, idempotency rule), `shared/legacy-config.md`
(delete-once-nothing-is-left rule), `scripts/scan-icon-imports.mjs` (file arguments, `unmatched`),
`scripts/source-scan.mjs` (walk and masking), `scripts/detect-baloise.mjs` (finds the Baloise
import lines), `docs/plans/ds-migrate-scope-batch-plan.md` (file arguments on every scanner).

## Facts from the class comparison

Source: `@baloise/ds-styles` 19.11.0 `css/utilities/all.css` against
`packages/styles/dist/css/utilities.css` and `design-system.css`.

| Group                                             | Classes |
| ------------------------------------------------- | ------- |
| Baloise utility classes                           | 3116    |
| Same name in Helvetia                             | 1725    |
| Baloise only                                      | 1391    |
| Baloise only, without a variant prefix            | 163     |

Almost every Baloise-only class is a variant (`hover:`, `tablet:`, ...) of one of the 163 base
classes. The curated map is small. Of the 1725 shared names, 268 differ only in the token they
reference, not in the value. One exception is a Helvetia bug: `w-auto` and `h-auto` emit
`auto-content`, which is invalid CSS (tracked separately, fix in `packages/styles`).

Breakpoints are identical in value: `widescreen` is 1280px like `desktop-lg`, `high-definition`
is 1440px like `desktop-xl`, `fullhd` is 1920px like `desktop-2xl`. `mobile`, `tablet`,
`desktop`, `touch`, `tablet-only`, `desktop-only`, `hover`, `active` and `focus` exist on both
sides. `widescreen-only` and `high-definition-only` have no Helvetia variant.

The v19 grid is `.grid` / `.col` with `is-*` modifiers. Helvetia ships `.ds-grid` / `.ds-col` /
`.ds-container` in `design-system.css` with the same modifier names, including the responsive
ones (`.ds-col.widescreen`, `.ds-col.fullhd`). `columns` / `column` are not in the v19
utilities; they are legacy classes from `basic.css` and `core.css`.

## Decisions

- **Variant prefixes are renamed, never approximated.** `widescreen:` becomes `desktop-lg:`,
  `high-definition:` becomes `desktop-xl:`, `fullhd:` becomes `desktop-2xl:`. The values are
  identical, so this changes nothing visually. `widescreen-only:` and `high-definition-only:`
  go to the report as lost.
- **Grid is a class rename, not a component migration.** `grid` becomes `ds-grid`, `col`
  becomes `ds-col`, `container` becomes `ds-container`. Every `is-*` and responsive modifier
  stays. The map has a `structure` group for this so the report can name it separately.
- **Value-changing renames are rewritten and reported.** `radius-normal` to `radius-md`,
  `radius-large` to `radius-lg`, `shadow-small` / `shadow-normal` to `shadow`, `shadow-large`
  to `shadow-elevated`, and the rest of that kind go into `approximated`, exactly like the icon
  map. The migration may change the look; the report says where.
- **Spacing aliases stay.** `mb-small`, `p-normal`, `gap-x-large` and the other aliases are
  emitted by `packages/styles/src/preset/rules/spacing.ts` on purpose. They are identical
  classes and are not touched. Normalising to `sm` / `base` / `xl` is not part of the migration.
- **Hover and pressed colour classes are renamed.** Baloise `border-primary-hovered` and
  `text-danger-pressed` become Helvetia `border-primary-hover` and `text-danger-active`. The
  generator proposes these from the suffix pattern, the curated map confirms them.
- **The map is curated, the diff is generated.** A script produces the diff (identical,
  Baloise only, Helvetia only, proposed renames). A human sorts the Baloise-only classes into
  the groups and commits `shared/css-utils-map.json`. A test keeps map and stylesheets in sync.
  Every class not listed in the map is identical and stays. The idempotency rule of the icon map
  applies: no mapped value is itself a key.
- **The scanner reads class strings from the raw text.** `source-scan.mjs` blanks every string
  literal, which hides exactly the places where classes live. The CSS scanner reuses the walk
  and the comment masking, but locates class contexts on the text and uses the mask only to
  skip comments.
- **Only known class contexts are rewritten.** `class` and `className` attributes, `[class]`,
  `[ngClass]` and `[class.<name>]` bindings, `classList.add` / `remove` / `toggle` / `contains`,
  Angular `host: { class: '…' }`, and the static parts of a `className` template literal.
  Everything else that merely contains a mapped class name as a word, such as a string in a
  constants file or a `${…}` substitution, is reported as dynamic and left unchanged.
- **The step builds on PR #152.** The deletion rule removes the Baloise utilities line and the
  TODO comment that #152 inserts. On the current `main` the line has already been replaced, so
  the rule finds nothing and reports nothing. Merge #152 first.
- **Component migrations do not rewrite classes.** CSS utils stays its own menu item that
  covers the whole project or a path list. Coupling it to every `migration.md` like icons is a
  later option once the batch plan lands.

## Work items

### 1. Diff generator and curated map

- New `scripts/diff-css-utils.mjs <baloise-utilities.css> <helvetia-utilities.css> [<helvetia-design-system.css>]`.
  It extracts class selectors from both files, splits variant prefixes, and prints JSON with
  `identical`, `baloiseOnly`, `helvetiaOnly` and `proposed` (suffix renames `-hovered` to
  `-hover`, `-pressed` to `-active`, the three variant renames, the three structure renames,
  and `title` to `heading`). The Baloise file comes from
  `npm pack @baloise/ds-styles@19 --pack-destination <tmp>`; no new dependency.
- New `shared/css-utils-map.json`:

  ```json
  {
    "source": { "baloise": "19.11.0" },
    "variants": {
      "renamed": { "widescreen": "desktop-lg", "high-definition": "desktop-xl", "fullhd": "desktop-2xl" },
      "lost": ["widescreen-only", "high-definition-only"]
    },
    "structure": { "grid": "ds-grid", "col": "ds-col", "container": "ds-container" },
    "renamed": { "font-family-title": "font-family-heading", "border-primary-hovered": "border-primary-hover" },
    "approximated": { "radius-normal": "radius-md", "shadow-normal": "shadow" },
    "lost": ["is-sr-only", "text-black", "opacity-30"]
  }
  ```

  The example entries are illustrative; the generator output decides the real content. Expected
  size: about 130 renamed, about 20 approximated, about 15 lost, plus the structure and variant
  groups.
- New `test/css-utils-map.spec.ts`: every key is absent from the Helvetia utilities, every value
  is present in the Helvetia utilities or `design-system.css`, no value is a key, no class
  appears in two groups. Helvetia CSS comes from `@helvetia-design/styles` as a workspace
  devDependency, the way `scan-icon-imports.spec.ts` uses `@helvetia-design/assets`. The
  Baloise class list is a fixture `test/fixtures/css-utils/baloise-19.11.0-classes.txt`
  generated by the diff script, so the test does not need the npm package.

### 2. Scanner

- New `scripts/scan-css-utils.mjs <project-root> [<file> ...]`. Extensions as in the icon scan.
  Path arguments and `unmatched` as in `scan-icon-imports.mjs`.
- Output keeps the `{ total, files: [{ file, findings: [{ line, snippet }] }] }` shape so the
  Confirm flow of `SKILL.md` works unchanged. Each finding adds `classes: [{ from, to, group }]`
  with `group` one of `variant`, `structure`, `renamed`, `approximated`, `lost`. A top-level
  `dynamic` list holds the places that were only detected (template substitutions, concatenated
  strings, string literals outside a class context that contain a mapped name).
- Tokenising: split a class string on whitespace, split the variant prefix at the first `:`
  when the prefix is a known variant, map prefix and base separately, and rejoin.
- New `test/scan-css-utils.spec.ts` with inline fixtures per framework: HTML `class`, Angular
  `[ngClass]` object keys and arrays, `[class.mb-small]`, React `className` string and template
  literal with a `${…}` part, `classList.add('…', '…')`, a class inside an HTML comment and a
  `//` comment (ignored), a plain string `'mb-small'` in a constants file (reported as dynamic),
  a `widescreen:mb-small` token, `class="grid is-multiline"` with a `col is-half` child, an
  unknown path producing `unmatched`, and a second run on the rewritten output producing no
  finding.

### 3. Rule file `shared/css-utils.md`

- **Scan**: run the scanner, show findings grouped by file with the class moves, end with the
  totals per group and the dynamic list.
- **Rewrite**: per finding, replace each `from` with `to` inside the class context only. Keep
  order, whitespace and the other classes on the element. Variants first, then base. Leave `lost`
  classes and dynamic places unchanged.
- **Legacy utilities line**: after the rewrite, run the scanner again on the whole project. When
  it reports no `lost` class and no dynamic place, find the Baloise utilities line(s) with
  `detect-baloise.mjs` (`@baloise/ds-styles/css/utilities/all`, a category file, or the
  bundled `css/all` form from #152) and delete the line and the TODO comment directly above it
  that Init inserted. When a category file remains for another reason, report it. When a `lost`
  class or a dynamic place remains, leave the line and say why.
- **Report**: per file, every `approximated` move, every `lost` class left and where, every
  dynamic place, every `structure` rename, and whether the utilities line was deleted or why it
  stays.

### 4. `SKILL.md`, specs and docs

- Replace the "CSS utils (coming soon)" menu item and section with a section modelled on
  **Assets**: optional path list, scan, one yes/no, rewrite, utilities line rule, report, stop.
- `src/cli.spec.ts`: expect `CSS utils` without "coming soon", `shared/css-utils.md`,
  `shared/css-utils-map.json` and `scripts/scan-css-utils.mjs` in the copied payload.
- `packages/skills/CONTEXT.md`: new section "CSS utils: curated map, raw-text scanner, legacy
  utilities line", regenerate instructions for the map, and the menu check in "Menu (Claude)".
- `docs/SKILLS.md`: replace the line that says CSS utils and Assets report "coming soon" (Assets
  is already implemented today).

### 5. Changeset

Minor bump for `@helvetia-design/skills`: CSS utils menu item, scanner, map.

## Order and delegation

1. Item 1 first. The generated diff fixes the real group sizes and the exact rename list.
2. Item 2 in parallel with item 3 once the map shape is fixed. The scanner is mechanical and can
   be delegated; the rule file needs the Assets and icons wording and stays in the main thread.
3. Item 4 last, after #152 is merged, so the utilities line rule can be tested end to end.

## Verification

- `pnpm --filter @helvetia-design/skills test` and `lint` green. Build `packages/styles` first
  so the map test can read `dist/css/utilities.css`.
- Scratch CLI per `packages/skills/CONTEXT.md`, then in the scratch project:
  - HTML project with `widescreen:mb-small`, `radius-normal`, `border-primary-hovered`,
    `grid is-multiline` and an `is-sr-only`. Done when the first four are rewritten, the report
    names `radius-normal` as approximated and `is-sr-only` as lost, and the utilities line stays
    with that reason.
  - Same project after replacing `is-sr-only` by hand. Done when the second run deletes the
    Baloise utilities line and the TODO comment from #152 and leaves the Helvetia line.
  - Angular project with `[ngClass]="{ 'mb-small': cond, 'widescreen:flex': wide }"` and a
    `classList.add('radius-large')` in the class file. Done when both are rewritten.
  - React project with `` className={`mb-small ${extra}`} `` and a constant
    `const spacing = 'mt-normal'`. Done when `mb-small` is left untouched (identical), the
    template literal is reported as dynamic, and the constant is reported, not rewritten.
- Run the scanner twice on the rewritten scratch project. Done when the second run reports
  nothing but the lost and dynamic entries.

## Conflicts and how the plan handles them

- Both utility stylesheets loaded at once (state after Init and #152): Helvetia loads last and
  wins where names collide, so the migration order does not change the look until the Baloise
  line goes. Value changes come only from `approximated`, which the report lists.
- `w-auto` / `h-auto` are broken in Helvetia: identical names, so the migration leaves them. The
  fix belongs in `packages/styles` and is tracked separately.
- A class name used as a plain word (`'flex'`, `'grid'`): only class contexts are rewritten,
  other string literals are reported. `grid` and `col` are renamed only inside class contexts.
- Baloise `columns` / `column` from `core.css`: not utilities, not in this map. They stay until
  `core.css` is removed and are listed as lost when found so the user sees them.
- Dynamic class composition: reported with path and line, never guessed.

## Out of scope

- SCSS files that `@extend` a utility class, and `@apply`-style usage.
- Normalising spacing aliases to the short names.
- Running CSS rules inside component migrations or the batch orchestrator.
- The `w-auto` / `h-auto` fix in `packages/styles`.
- Legacy `columns` / `column` grid classes from `core.css` and `basic.css`.
