# CONTEXT — packages/skills (Consumer Claude Code Skills)

This document captures domain language, architectural patterns, and key concepts specific to the published skills package.

## Overview

**packages/skills** (`@helvetia-design/skills`) ships Claude Code skills that consuming applications install into their own repo. It is not a design-system runtime package — there are no web components, tokens, or styles here. Consumers run `npx @helvetia-design/skills add`, which copies a skill folder into `<cwd>/.claude/skills/`.

The first (and currently only) skill is **ds-migrate-from-baloise**: a menu-driven helper for migrating an app from the Baloise Design System (`bal-*`, `@baloise/ds-*`) to the Helvetia Design System (`ds-*`, `@helvetia-design/*`). The menu itself lives in the copied `SKILL.md`; this file documents package conventions, not the menu copy.

## Core Concepts

### Compiled CLI vs. self-contained payload

The package has two parts that must not be confused:

- **Compiled CLI** — `src/cli.ts`, swc-compiled to `dist/cli.js`, exposed as `bin.skills`. Its only job is the `add` subcommand: copy the skill payload into the consumer's `.claude/skills/` directory (creating parents, overwriting on re-run). Re-running `add` is how a consumer updates the skill. The CLI has no other subcommands until a second skill exists.
- **Self-contained payload** — `skills/ds-migrate-from-baloise/`, plain uncompiled Markdown and dependency-free Node scripts. Copied verbatim. After copy, the skill must run inside the consumer's repo with **zero runtime dependency** back on `@helvetia-design/skills` or this monorepo — no script imports from `node_modules/@helvetia-design/*`.

The compiled CLI is a delivery mechanism. The payload is the product.

### Skill payload, not a plugin

Distribution is `npx @helvetia-design/skills add`. There is no Claude Code plugin manifest and no marketplace registration.

### One `migration.md` per component

**Components** offers two paths. **Manual** lists `components/*.md` and `components/*/migration.md` by the first heading. **Detect** runs `scripts/scan-migratable.mjs` and suggests only used `bal-*` components with a matching `components/<name>/migration.md`. Both paths dispatch to that migration file.

### Adding the next component

Paths below are inside `skills/ds-migrate-from-baloise/`.

1. Add `components/<name>/migration.md`. The first heading is the menu title.
2. Write the confirm-then-rewrite steps and the prop mapping in that file. When the component needs a finder, add a dependency-free `scripts/scan-bal-<name>.mjs` that prints JSON findings and does not edit files, and invoke it from the migration file.
3. When the legacy component has child tags, add an entry per child to `CHILD_SLUGS` in `scripts/scan-migratable.mjs`. Without it **Detect** reports the child as its own unmigratable component, when the parent migration already covers it.
4. Stop there. **Manual** lists the new file automatically. **Detect** suggests it automatically when the consumer project uses the matching component.

Accordion is the template: `components/accordion/migration.md` (heading `accordion`) and `scripts/scan-bal-accordion.mjs`. It is the richest case — child tags, two legacy shapes, renamed events, removed methods, and props with no replacement. Spinner is the minimal case: one tag, one prop table, nothing lost. The agent rewrites matches after one bulk confirmation. The script does not edit files.

Conventions that hold across every component:

- **The scanner stays flat.** It prints `{ total, files: [{ file, findings: [{ line, snippet }] }] }` and nothing else. Reach comes from widening the single `USAGE_RE`, not from adding fields — toast matches `balToastController`, accordion matches the four `BalAccordion*` bindings and `BalAccordionBundle`.
- **Never put a shared event name in a component regex.** `balChange` alone is emitted by 26 legacy components, so it would report checkbox, input, and dropdown usages as findings for whichever component you are migrating.
- **`CHILD_SLUGS` stays explicit.** Never fold by prefix: `bal-input-slider` becomes `ds-slider`, a separate component, not part of the input migration.
- **Anything with no `ds-*` equivalent is reported, never commented into the consumer's code.** The migration file's final step enumerates each loss for the summary. See `components/tooltip/migration.md` and `components/accordion/migration.md`.
- **When the component has methods or events, the migration file carries the sibling-file rule.** Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls `present()` or handles an event without ever naming the tag, so the scan cannot see it. The migration file tells the agent to open the same-basename `.ts` beside every `.html` finding. See `components/accordion/migration.md`.
- **The directory is always the legacy slug**, because Detect derives it from the `bal-*` tag. When the component is renamed, the first heading names both sides so the Manual menu stays readable: `components/app/migration.md` opens with `# app → root`.
- **Fixtures are written inline in the spec** with the local `write()` helper. `test/fixtures/` predates that and serves spinner only; do not extend it.

Done when **Components** lists the new heading and choosing it follows that file.

### Fixed-group versioning

This package publishes as `@helvetia-design/skills`, inside the `@helvetia-design/*` fixed group in `.changeset/config.json`. A changeset bumps it in lockstep with every other package in that group, not on its own version track.

### The skill never commits

The copied skill edits the consumer's files and leaves everything unstaged. It never runs `git add` or `git commit`. That is the same "leave changes for the user" rule this monorepo uses, applied to a stranger's production codebase.

## Key Constraints

- **CLI surface is `add` only** — no arguments, no `list`, no per-skill selection.
- **Payload stays uncompiled** — Markdown and dependency-free JS only. Do not import from this package's `dist/` or from other workspace packages.
- **Overwrite is the update path** — `add` replaces the destination folder; do not add a separate `update` command.
- **Coming-soon menu items report "coming soon" and stop** — they exist to show eventual scope, not as errors.

## Testing

Do **not** run `add` from this monorepo root — it would copy the skill into this repo's `.claude/skills/`. Always use a scratch directory.

### Unit tests and lint

```bash
nvm use
pnpm --filter @helvetia-design/skills test
pnpm --filter @helvetia-design/skills lint
```

Done when every spec under `test/` passes and eslint exits 0. That is the CLI specs,
`test/detect-baloise.spec.ts`, `test/scan-migratable.spec.ts`, and one
`test/scan-bal-<component>.spec.ts` per supported component.

Adding a component adds its own spec file; it does not change this paragraph. Do not
enumerate the spec files here — the list goes stale and every parallel migration branch
collides on the same line.

### Scratch CLI

```bash
nvm use
pnpm --filter @helvetia-design/skills build

SCRATCH=$(mktemp -d)
cd "$SCRATCH"
node /absolute/path/to/packages/skills/dist/cli.js add
```

Done when:

1. stdout is `Copied ds-migrate-from-baloise to <scratch>/.claude/skills/ds-migrate-from-baloise`
2. that folder contains `SKILL.md` with the 4-item menu (Init / Components / CSS utils (coming soon) / Assets (coming soon)) and the line that the skill never runs `git add` or `git commit`
3. `node …/dist/cli.js` with no args, or with `list`, prints `Usage: skills add` and exits 1
4. after writing a stale `SKILL.md` and `stale.txt` into the destination, a second `add` restores `SKILL.md` and removes `stale.txt`

### Menu (Claude)

In the scratch directory, invoke `/ds-migrate-from-baloise`. Done when Init runs `scripts/detect-baloise.mjs`, Components offers **Manual** and **Detect**, Manual lists exactly one entry per `components/*/migration.md` (named after its first heading, e.g. `app → root`) and nothing else, Detect suggests a component only when the project uses it and that migration exists, and CSS utils / Assets report "coming soon" and stop.

Against a project with no `@baloise/ds-*` dependency and no CSS/JS import, Init says "no Baloise Design System installation detected, nothing to migrate" and does not edit files. Against a project that has both, Init adds the `@helvetia-design/*` packages from the script JSON, runs that JSON's `installCommand`, inserts the new import beside the untouched `@baloise/*` import, and leaves the result unstaged.

Spinner: `node <skill>/scripts/scan-bal-spinner.mjs <project>` prints JSON findings (`total`, then `files` with `line` and `snippet`) and does not edit files. After one yes, the agent rewrites from `components/spinner/migration.md` and leaves the result unstaged.

Accordion: `node <skill>/scripts/scan-bal-accordion.mjs <project>` prints the same JSON shape and does not edit files. The regex covers `bal-accordion` and its `bal-accordion-summary`, `bal-accordion-trigger`, and `bal-accordion-details` children, plus the `BalAccordion*` bindings and `BalAccordionBundle`. After one yes, the agent rewrites from `components/accordion/migration.md` and leaves the result unstaged.

App: `node <skill>/scripts/scan-bal-app.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches `initializeBaloiseDesignSystem` and `useBaloiseDesignSystem`, so the startup file that holds the language and region is found even though it never names the tag. After one yes, the agent rewrites from `components/app/migration.md` and leaves the result unstaged.

Badge: `node <skill>/scripts/scan-bal-badge.mjs <project>` prints the same JSON shape and does not edit files. After one yes, the agent rewrites from `components/badge/migration.md` and leaves the result unstaged.

Close: `node <skill>/scripts/scan-bal-close.mjs <project>` prints the same JSON shape and does not edit files. There are no child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/close/migration.md` (`size` `small`/`medium` to `sm`/`md`, dynamic `size` bindings flagged for manual review) and reports legacy `data-testid="bal-close"` and BEM-class selectors as lost, then leaves the result unstaged.

Content: `node <skill>/scripts/scan-bal-content.mjs <project>` prints the same JSON shape and does not edit files. There are no child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/content/migration.md` (`layout` to `direction`, `space` values to the short scale, dynamic `layout` and `space` bindings flagged for manual review) and reports the lost `text-align` of `align`, the vertical centering of `direction="row"`, and legacy BEM-class selectors, then leaves the result unstaged.

Data: `node <skill>/scripts/scan-bal-data.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches the three children `bal-data-item`, `bal-data-label` and `bal-data-value` plus their `BalData*` symbols (`CHILD_SLUGS` maps all three → `data`). After one yes, the agent rewrites from `components/data/migration.md`: it hoists static `editable` and `multiline` from `bal-data-value` onto the enclosing `ds-data-item` (dynamic bindings flagged for manual review), drops `border` and the value's `disabled`, and reports the `balClick`/`balFocus`/`balBlur` handlers that no longer fire, the dropped `border` rendering differences, and legacy BEM-class and `data-testid="bal-data-value-button"` selectors as lost, then leaves the result unstaged.

Date: `node <skill>/scripts/scan-bal-date.mjs <project>` prints the same JSON shape and does not edit files. The component is renamed, so `components/date/migration.md` opens with `# date` and the tag becomes `ds-datepicker` (`BalDate` → `DsDatepicker`). The regex ends with `(?![\w-])`, so `bal-date-calendar`, `bal-date-calendar-cell` and `BalDateCallback` are not findings; `CHILD_SLUGS` folds the two internal calendar tags into `date` so Detect does not list them separately. After one yes, the agent rewrites from that file: it adds an explicit `required` false because the default flipped to true, renames `balChange`, `balInput`, `balBlur`, `balFocus` and `balInputClick` to their `ds` forms only on the migrated element, drops `triggerIcon`, `closeOnSelect` and `allowInvalidValue`, and reports `balIconClick` and the animate handlers, the missing `open`, `close`, `toggle`, `select` and `setAriaForm` methods (sibling-file rule), the `INVALID_VALUE` and `undefined` → `null` logic changes, the changed popup trigger, and legacy `bal-date__*` selectors as lost, then leaves the result unstaged.

Divider: `node <skill>/scripts/scan-bal-divider.mjs <project>` prints the same JSON shape and does not edit files. There are no child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/divider/migration.md` (`space` T-shirt names to the short scale, `color` `white` to `inverted`, `borderStyle="dashed"` to `dashed`, dynamic bindings flagged for manual review) and reports colors with no equivalent and lost slotted children, then leaves the result unstaged.

Footer: `node <skill>/scripts/scan-bal-footer.mjs <project>` prints the same JSON shape and does not edit files. The component is renamed, so `components/footer/migration.md` opens with `# footer` and the tag becomes `ds-app-footer` (`BalFooter` → `DsAppFooter`). The legacy folder has no consumer child tags, so `CHILD_SLUGS` needs no entry. After one yes, the agent rewrites from that file: it renames `hideLinks` to `disableDefaultLinks`, drops `showSocialMedia` (negating dynamic values) and adds `disableDefaultSocialLinks` when it was omitted because the default flipped to on, drops `logoBrand`, and reports `logoHref`, `logoSvg` and `overrideLinks` as manual rework. It also reports that `ds-app-footer` no longer switches the app language itself (the consumer needs a `dsLanguageChange` handler), the new legal text, and legacy `bal-footer__*` and `bal-footer-language` selectors as lost, then leaves the result unstaged.

Heading: `node <skill>/scripts/scan-bal-heading.mjs <project>` prints the same JSON shape and does not edit files. The component keeps its name, so `components/heading/migration.md` opens with `# heading` and the tag becomes `ds-heading` (`BalHeading` → `DsHeading`). The legacy folder has no child tags, so `CHILD_SLUGS` needs no entry. After one yes, the agent rewrites from that file: a `level` holding a legacy size token splits into `level` plus `visualLevel` so both the rendered tag and the font size survive, size tokens in `visualLevel` and `autoLevel` are renamed (`x-large` → `xl`), `color="info"` and `color="blue"` collapse to `primary`, `color="white"` becomes the boolean `inverted` (never `color="inverted"`, which passes validation and paints no class), and `success`, `warning` and `danger` are dropped as having no equivalent. It also reports the ambient `BalProps.BalHeading*` type references the scan cannot see, the legacy `bal-heading__*` classes and `data-testid="bal-heading"` as lost to shadow DOM, and the legacy automatic bottom margin that `ds-heading` only applies from `space`, then leaves the result unstaged.

Icon: `node <skill>/scripts/scan-bal-icon.mjs <project>` prints the same JSON shape and does not edit files. After one yes, the agent rewrites from `components/icon/migration.md` and leaves the result unstaged.

Text: `node <skill>/scripts/scan-bal-text.mjs <project>` prints the same JSON shape and does not edit files. After one yes, the agent rewrites from `components/text/migration.md` and leaves the result unstaged.

Toast: `node <skill>/scripts/scan-bal-toast.mjs <project>` prints the same JSON shape and does not edit files. After one yes, the agent rewrites from `components/toast/migration.md` and leaves the result unstaged.

Tooltip: `node <skill>/scripts/scan-bal-tooltip.mjs <project>` prints the same JSON shape and does not edit files. After one yes, the agent rewrites from `components/tooltip/migration.md` and leaves the result unstaged.

Card: `node <skill>/scripts/scan-bal-card.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches the four `BalCard*` children (`Actions`, `Button`, `Content`, `Subtitle`, `Title`) and `BalCardBundle`. After one yes, the agent rewrites from `components/card/migration.md`: it synthesizes a `ds-card-header` around a direct-child `bal-card-title`/`bal-card-subtitle`, rewrites `bal-card-button` into a `ds-button` inside `ds-card-actions` (no direct `ds-*` equivalent exists), and leaves the result unstaged.

Carousel: `node <skill>/scripts/scan-bal-carousel.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches the single `bal-carousel-item` child via the same `bal-carousel\b` word-boundary trick that card and accordion use for their own children, plus `BalCarouselItem` and `BalCarouselBundle`. After one yes, the agent rewrites from `components/carousel/migration.md`: it synthesizes a positional `name` (`item-1`, `item-2`, ...) on every `ds-carousel-item` since the legacy child had no identifier, rewrites a literal numeric `value` from a 0-based index into the matching synthesized name (flagging a non-literal `value` for manual review instead of guessing), collapses `controls`'s five values into three (`small`→`large`, `tabs` dropped) and `interface`'s four values into `variant`'s two (`card`/`product`→`tile`, `image`/omitted→`slide` default), and rewrites a `bal-carousel-item` that rendered its own `<a>`/`<button>` into a literal wrapped element in the slot plus the new `navigation` prop for the link case.

Button: `node <skill>/scripts/scan-bal-button.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches the `bal-button-group` child via the same word-boundary trick card and carousel use, plus `BalButtonGroup` and the legacy `BalButtonBundle` array (`CHILD_SLUGS` maps `button-group` → `button`). The group is bundled in because each side styles its own children by tag — legacy sizes `.bal-button` children, `ds-button-group` uses `::slotted(ds-button)` — so a half-rewritten pair silently loses its layout. After one yes, the agent rewrites from `components/button/migration.md`. The notable mappings: `color` is remapped by appearance rather than by name, because four names exist on both sides meaning different things (`tertiary`→`ghost`, `light`→`tertiary`, `info`→`secondary`, `info-light`→`info`, with `tertiary-*`→`brand-*`); `expanded`→`wide`; `position`→`align` on the group; `rounded` and `isActive` are dropped as real losses; and a button combining `element-type="submit"` with `name` or `value` is flagged, because `ds-button`'s shadow-DOM button cannot be the form's submitter and its `requestSubmit()` call passes no submitter, so the pair never reaches the form data.

Checkbox: `node <skill>/scripts/scan-bal-checkbox.mjs <project>` prints the same JSON shape and does not edit files. The regex also matches `bal-checkbox-group`/`BalCheckboxGroup` via the same word-boundary trick, and `newBalCheckboxOption` as a non-tag usage signal, the same idea as `app`'s startup-function matches. Unlike every other bundled case, the "child" here is a wrapping container, not a sub-part: `bal-checkbox-group` drives its children with `querySelectorAll('bal-checkbox')`, so it is bundled into this same migration (`CHILD_SLUGS` maps `checkbox-group` → `checkbox`) rather than deferred, to avoid rewriting the children while leaving the parent's query broken. After one yes, the agent rewrites from `components/checkbox/migration.md`: `interface="switch"` becomes a tag change to `ds-toggle` (flagged when nested in a `control`-mode group, since the group can't see a `ds-toggle`'s value), `interface="tile"` becomes the `tile` boolean, and `interface="button"` becomes `tile` + `hideTrigger` as a flagged visual approximation (no auto-width/solid-fill equivalent exists). The surrounding `bal-field`/`bal-field-label`/`bal-field-control`/`bal-field-message` wrapper (not yet its own migration) is left untouched, and `ds-checkbox-group`'s new `required` default is deliberately left alone rather than forced to `false`, to avoid rendering an orphaned "(optional)" label suffix.

File upload: `node <skill>/scripts/scan-bal-file-upload.mjs <project>` prints the same JSON shape and does not edit files. The regex matches only `bal-file-upload` and `BalFileUpload`; the legacy folder has no consumer child tags, and `BalFileUploadValueAccessor`-style names are not matched. After one yes, the agent rewrites from `components/file-upload/migration.md`: it renames the legacy drop-zone `label` to `dropZoneLabel` (the new `label` is the field label), renames the seven `bal*` events to `ds*`, leaves `subTitle` and `getInputElement()` in place and flags them for manual review since they have no equivalent, only reports uses of the `FileUploadRejectionReason` enum (now a string union), and leaves the result unstaged.

Hint: `node <skill>/scripts/scan-bal-hint.mjs <project>` prints the same JSON shape and does not edit files. The regex matches `bal-hint`, `bal-hint-title`, `bal-hint-text` and their `BalHint*` names, with a lookahead instead of `\b` so an unrelated `bal-hint-*` tag is not matched; `bal-field-hint` is a different component and is not matched (`CHILD_SLUGS` maps `hint-title` and `hint-text` → `hint`). After one yes, the agent rewrites from `components/hint/migration.md`: the three tags and their React/Angular symbols are renamed 1:1, `closeLabel` is copied, and the removed `small` prop is left in place and flagged for manual review. The legacy title and text are not folded into the new `label` prop, and the result is left unstaged.

Input: `node <skill>/scripts/scan-bal-input.mjs <project>` prints the same JSON shape and does not edit files. The regex matches `bal-input`, `bal-input-date` and their `BalInput`/`BalInputDate` names, with a lookahead instead of `\b` so `bal-input-group`, `bal-input-slider`, `bal-input-stepper` and accessor names are not matched (`CHILD_SLUGS` maps `input-date` → `input`). After one yes, the agent rewrites from `components/input/migration.md`: `bal-input` becomes `ds-input` and `bal-input-date` becomes `ds-datepicker` (`BalInput` → `DsInput`, `BalInputDate` → `DsDatepicker`), it adds an explicit `required` false because the default flipped, renames the five `bal*` events to `ds*` only on the migrated element, drops `allowInvalidValue` on the date field, leaves `textAlign`, `clickable` and `hasIconRight` in place and flags them for manual review, reports `setAriaForm()`, the `string | null` value change and the missing calendar-less date field, and leaves the result unstaged.

Input slider: `node <skill>/scripts/scan-bal-input-slider.mjs <project>` prints the same JSON shape and does not edit files. The component is renamed, so `components/input-slider/migration.md` opens with `# input-slider` and the tag becomes `ds-slider` (`BalInputSlider` → `DsSlider`). The regex uses a lookahead instead of `\b` for the tag, so `BalInputSliderValueAccessor`-style names are not matched; the legacy folder has no consumer child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from that file: it adds an explicit `required` false because the default flipped, rewrites `step` (omitted or `0` means continuous and becomes `step="any"`, numeric literals become strings, dynamic bindings are flagged), renames `balTabindex` to `tabindex`, renames `balInput`, `balChange`, `balFocus` and `balBlur` to their `ds` forms only on the migrated element, leaves `hasTicks` and `balKeyPress` in place and reports them, and reports the always-numeric value (an empty value now resolves to `min`), the `getInputElement()` return type change, the missing `setAriaForm()` (sibling-file rule), and legacy `bal-input-slider*` selectors as lost, then leaves the result unstaged.

Input stepper: `node <skill>/scripts/scan-bal-input-stepper.mjs <project>` prints the same JSON shape and does not edit files. The component is renamed, so `components/input-stepper/migration.md` opens with `# input-stepper` and the tag becomes `ds-counter` (`BalInputStepper` → `DsCounter`). The regex uses a lookahead instead of `\b` for the tag, so accessor-style names are not matched; the legacy folder has no consumer child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from that file: it renames `steps` to `step`, renames `balInput`, `balChange`, `balIncrease`, `balDecrease`, `balFocus` and `balBlur` to their `ds` forms only on the migrated element, does not add `required` (it only affects the label suffix), and reports the removed `FocusEvent` detail on focus and blur, the `[min, max]` clamping of values, the `getInputElement()` return type change, the missing `setAriaForm()` (sibling-file rule), and legacy `bal-input-stepper*` selectors as lost, then leaves the result unstaged.

List: `node <skill>/scripts/scan-bal-list.mjs <project>` prints the same JSON shape and does not edit files. The regex matches `bal-list`, its six child tags and `bal-list-item`, their `BalList*` symbols and `BalListBundle`, with a lookahead instead of `\b` so `bal-listbox`, `bal-list-item-foo` and the ambient `BalListSize`/`BalListItemTarget` type names are not matched (`CHILD_SLUGS` maps all seven children → `list`). After one yes, the agent rewrites from `components/list/migration.md`: the legacy folder's eight tags collapse onto two, `bal-list` becoming `ds-list` and `bal-list-item` becoming `ds-item` (not `ds-list-item`), while the six remaining children fold into props and slots — static title and subtitle text is lifted into `label` and `description`, icon and content children move to `slot="icon"` and `slot="content"`, and an accordion head and body become `variant="accordion"` plus `slot="accordion-content"`. Titles and subtitles holding interpolation, bindings or markup are never lifted; they stay put and are reported. `background="dark"` becomes `inverted`, `size="large"` becomes `size="lg"`, `selected` and `subAccordionItem` are left in place and flagged, and `bal-list` `disabled` is dropped rather than mapped onto `ds-item` `disabled`, which means something else. It reports the unavoidable trailing caret on link and button items, the divider `ds-item` always draws, the lost accordion-head translations, and the legacy `bal-list__*` selectors, then leaves the result unstaged.

Label: `node <skill>/scripts/scan-bal-label.mjs <project>` prints the same JSON shape and does not edit files. The tag becomes `ds-label` (`BalLabel` → `DsLabel`). The regex uses a lookahead instead of `\b` for the tag, so `bal-label-*` names are not matched, and `bal-data-label` stays under data. The legacy folder has no child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/label/migration.md`: it drops `multiline` (now the default), renames `readonly` to `disabled`, maps static `size` values (`small` → `sm` … `xxx-large` → `3xl`), leaves `weight`, `hovered`, `pressed` and dynamic `size` or `multiline` bindings in place and reports them, and lists every migrated label without `htmlFor`, because `bal-field` no longer links it, then leaves the result unstaged.

Logo: `node <skill>/scripts/scan-bal-logo.mjs <project>` prints the same JSON shape and does not edit files. The tag becomes `ds-logo` (`BalLogo` → `DsLogo`). The regex uses a lookahead instead of `\b` for the tag and `\bBalLogo\b` for the symbol, so `bal-logo-*` names and the ambient `BalProps.BalLogoColor`, `BalLogoSize` and `BalLogoBrand` types are not matched; the legacy folder has no child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/logo/migration.md`: static `color` values become `primary` and `inverted` (the attribute is kept even for the old default), `size="small"` becomes `sm`, `size=""` and `brand=""` are dropped, `brand` and `animated` are copied, and dynamic `color` and `size` bindings are left in place and reported. It also reports the ambient `BalProps.BalLogo*` type references, the legacy `bal-logo--*` and `bal-logo__animated-wrapper` selectors as lost to shadow DOM (with `part="animated"` and `--logo-*` as the replacement), and once the token-based heights (the legacy small logo was 22 px, `ds-logo` is 24 px), then leaves the result unstaged.

Modal: `node <skill>/scripts/scan-bal-modal.mjs <project>` prints the same JSON shape and does not edit files. The tags become `ds-modal`, `ds-modal-header` and `ds-modal-body` (`BalModal*` → `DsModal*`, `BalModalBundle` → the three symbols), and `CHILD_SLUGS` maps `modal-header` and `modal-body` → `modal`. The regex also matches the imperative API (`balModalController`, `BalModalController`, `BalModalOptions`, `BalModalService`), but not the ambient `BalProps.BalModalSpace` type. After one yes, the agent rewrites from `components/modal/migration.md`: `isClosable` becomes `closable`, `modalWidth` is copied, the four `balModal*` events become `dsWillPresent`, `dsDidPresent`, `dsWillDismiss` and `dsDidDismiss`, and `space`, `hasBackdrop`, `backdropDismiss`, `focusTrap` and `cssClass` are dropped and reported. `dsModalController` and `DsModalService` replace the legacy controller and service. An Angular `create` call is restructured to the positional `create(component, componentProps, options)` only when its argument is an object literal. Everything else is reported and left in place: results read from `dismiss`, `onDidDismiss()` and `onWillDismiss()` on an element, `detail.role` comparisons (`'model-close'` and `'model-escape'` are now `'close'`, `'backdrop'` and `'escape'`), `modal-close` buttons, component modals without `label`, and legacy `bal-modal__*` selectors. React keeps `DsModal` as the issue asks, with a note that the wrapper is deprecated in favour of `Modal`. The result is left unstaged.

Navbar: `node <skill>/scripts/scan-bal-navbar.mjs <project>` prints the same JSON shape and does not edit files. Only the root is a rename (`bal-navbar` → `ds-app-navbar`, `BalNavbar` → `DsAppNavbar`); `ds-app-navbar` has no child components, so the scan also matches `bal-navbar-brand`, `-menu`, `-menu-start` and `-menu-end` and their `BalNavbar*` symbols, and `CHILD_SLUGS` maps all four → `navbar`. The ambient `BalProps.BalNavbarInterface` and `BalEvents.BalNavbar*` types are not matched. After one yes, the agent rewrites from `components/navbar/migration.md`: the brand becomes `<a slot="brand">` (`href`, `rel` and `target` move over, the logo props are dropped and reported), `-menu-start` and `-menu-end` become `<div slot="menu-start">` and `<div slot="menu-end">`, `-menu` is unwrapped, and the child symbols are removed from the `@baloise` imports. `container` keeps `fluid` and `compact` and reports `detail-page`, `blog-page` and `wide`. A navbar with `interface="simple"` or a dynamic `interface` is left as legacy with its children and imports and reported as not migrated. Events (`balWillAnimate`, `balDidAnimate`, `balNavigate`) and `toggleMenu()` are only reported with their `dsMenu*` and `toggleSidebar()` replacements. The result is left unstaged.

Number input: `node <skill>/scripts/scan-bal-number-input.mjs <project>` prints the same JSON shape and does not edit files. The tag becomes `ds-number-input` (`BalNumberInput` → `DsNumberInput`). The regex uses a lookahead instead of `\b` for the tag, so accessor-style names are not matched; the legacy folder has no consumer child tags, so `CHILD_SLUGS` has no entry. After one yes, the agent rewrites from `components/number-input/migration.md`: it adds an explicit `required` false because the default flipped and `ds-number-input` forwards it to the native input, renames `balInput`, `balChange`, `balBlur`, `balFocus` and `balKeyPress` to their `ds` forms only on the migrated element, and reports the lost label link from a surrounding `bal-field` (WCAG), the `number | null` value and detail change, the dropped auto-generated `pattern`, the missing `setAriaForm()` (sibling-file rule), `getInputElement()` now living in the shadow DOM, and legacy `bal-number-input*`, `.input` and `.is-danger` selectors as lost, then leaves the result unstaged.

Pagination: `node <skill>/scripts/scan-bal-pagination.mjs <project>` prints the same JSON shape and does not edit files. The tag becomes `ds-pagination` (`BalPagination` → `DsPagination`); the legacy folder has no child tags, so `CHILD_SLUGS` has no entry. The regex also matches the four `@baloise/ds-testing` Cypress commands (`balPaginationFindPages`, `balPaginationFindCurrentPage`, `balPaginationFindNextButton`, `balPaginationFindPreviousButton`), following the `toast` and `modal` precedent for non-tag symbols, so a spec that never names the tag still surfaces; the ambient `BalProps.BalPagination*` and `BalEvents.BalPagination*` types are not matched. After one yes, the agent rewrites from `components/pagination/migration.md`: `interface="small"` becomes `variant="dots"` (both render dots at five pages or fewer and the `2 / 20` counter above that), `size="small"` becomes `size="sm"`, `align="center"` is dropped because centre is the default, and `balChange` becomes `dsChange` only on the migrated element. No prop is lost and `next()` and `previous()` survive unchanged — the sibling-file rule is carried for the event handler and the ambient types, not for the methods. It reports the Cypress commands and the four legacy test ids as having no equivalent, the `bal-pagination*` classes and global `@baloise/ds-styles` button classes as lost to shadow DOM, the translated navigation landmark name, and that `value` is now reflected and mutable, then leaves the result unstaged.

Popup: `node <skill>/scripts/scan-bal-popup.mjs <project>` prints the same JSON shape and does not edit files. The tag becomes `ds-popup` (`BalPopup` → `DsPopup`); the legacy folder has no child components, so `CHILD_SLUGS` has no entry. Legacy wires the popup from the trigger, so the regex also matches the `bal-popup` attribute and its seven `bal-popup-*` overrides (`variant`, `closable`, `backdrop-dismiss`, `backdrop`, `placement`, `arrow`, `reference`, `offset`) and the two `@baloise/ds-testing` Cypress commands `balPopupIsOpen` and `balPopupIsClosed`, so a trigger-only or test-only file still surfaces; the ambient `BalProps.BalPopup*` and `BalEvents.BalPopup*` types are not matched. Detect still counts tags only, so a trigger attribute alone does not suggest popup. After one yes, the agent rewrites from `components/popup/migration.md`: `bal-popup="<id>"` becomes `data-popup="<id>"`, the six overrides with a matching prop move onto the popup when it has exactly one trigger, `active` becomes `open`, and `demo` becomes `open="true"`. A `variant="drawer"`, `variant="fullscreen"` or dynamically bound `variant` is left as legacy and reported, because those are `ds-drawer` and `ds-modal` with `fullscreen`, following the navbar `interface="simple"` rule. `balWillAnimate` and `balDidAnimate` each split into their present and dismiss pair, while `balChange` is only reported: its boolean detail has no home in the new `{ trigger }`. `reference` and `contentWidth` are dropped. It also reports the visible title lost to `label` becoming `aria-label`, the `offset` default moving from 0 to 8, focus now trapped when `backdrop` is set, the `bal-popup-*` test ids and `aria-presented` as lost to shadow DOM, and the legacy `bal-popup__*` selectors, then leaves the result unstaged.

Detection: `node <skill>/scripts/scan-migratable.mjs <project>` prints used components grouped into `suggested` (migration available) and `notYet` (no migration available), with usage totals, and does not edit files.

## Related Contexts

See [CONTEXT-MAP.md](../../CONTEXT-MAP.md) for:

- [[root|CONTEXT.md]] — repository-level concepts, release process

The full migration-skill plan this package starts is [docs/plans/ds-migrate-baloise-plan.md](../../docs/plans/ds-migrate-baloise-plan.md).
