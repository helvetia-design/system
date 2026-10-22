# steps

Migrate every `bal-steps` usage to `ds-steps`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one child, `bal-step-item`. It is part of this migration, but it does not map one-to-one. `bal-step-item` was header and content in one element. `ds-steps` splits them into `ds-step` (header) and `ds-step-panel` (content), or drops the panel in navigation mode. `bal-input-stepper` is a separate component and stays unchanged.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-steps.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-steps` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element, including its `bal-step-item` children, when attributes or children continue past the snippet's first line. This step is finished when every finding matches the mapping or is left in place and reported.

When a finding is in an Angular `x.component.html`, also open the `x.component.ts` with the same basename. The class often calls `select()` or `getOptionByValue()` or handles `balChange` without naming the tag, so the scan cannot see it.

### Two modes

`ds-steps` decides its mode by its children. With `ds-step-panel` children it is in **panels mode**. Without them it is in **navigation mode**. Decide per `bal-steps` group, from its `bal-step-item` children:

- No item has `href`: panels mode.
- Every item has `href`: navigation mode.
- Some have `href` and some do not: leave the whole group in place, change nothing in it, and report it. `ds-steps` cannot mix the modes.

### Panels mode

Split each static `bal-step-item` into a `ds-step` and a `ds-step-panel`. Put the `ds-step` elements first, then the `ds-step-panel` elements, as direct children of `ds-steps`. Keep the order.

```html
<bal-steps value="b">
  <bal-step-item value="a" label="One" done>Content A</bal-step-item>
  <bal-step-item value="b" label="Two">Content B</bal-step-item>
</bal-steps>
```

becomes

```html
<ds-steps value="b">
  <ds-step name="a" label="One" done></ds-step>
  <ds-step name="b" label="Two"></ds-step>
  <ds-step-panel for="a">Content A</ds-step-panel>
  <ds-step-panel for="b">Content B</ds-step-panel>
</ds-steps>
```

The old `value` becomes `name` on the `ds-step` and `for` on its `ds-step-panel`. Keep the value form (`value="a"`, `value={id}`, `[value]="id"`) on both. A `bal-step-item` without `value` has nothing to link, so leave it in place and report it. Do not invent a name.

Leave the content of the item as the content of the panel. A step with no content gets no panel.

Items produced by `*ngFor`, `v-for`, `.map()` or any other loop are dynamic. Leave them in place, only rename the surrounding tag, and report each one: the steps and panels must be rebuilt as a pair by hand.

### Navigation mode

Rewrite each `bal-step-item` with `href` to a `ds-step` that wraps an `<a>`. There is no panel, but `ds-step` still requires a `name` in this mode, so keep `label` and `name` on the `ds-step`. Take `name` from the old `value`. When the item has none, use a unique slug of the `label`. Navigation mode does not otherwise read it, so a generated one is harmless here.

```html
<bal-steps>
  <bal-step-item label="One" href="/one" done></bal-step-item>
  <bal-step-item label="Two" href="/two" target="_blank" rel="noopener"></bal-step-item>
</bal-steps>
```

becomes

```html
<ds-steps>
  <ds-step name="one" label="One" done><a href="/one">One</a></ds-step>
  <ds-step name="two" label="Two"><a href="/two" target="_blank" rel="noopener">Two</a></ds-step>
</ds-steps>
```

The `label` is kept on the `ds-step` and its text is also the text of the `<a>`. `href`, `target` and `rel` move to the `<a>`. Do not set `aria-current`. The consumer's router sets it, and `ds-steps` reads it from the slotted `<a>` to find the active step. Report each navigation group so the consumer checks that.

### Props on `bal-steps`

| old (`bal-steps`)                             | new (`ds-steps`)     | handling                                                                                                                                                                                          |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                                       | `value`              | Copy as-is. It is the `name` of the active `ds-step`, which equals the old item `value`. A dynamic value stays untouched. Navigation mode ignores it.                                             |
| `color="primary"`                             | omit `color`         | `primary` is the default. Delete the attribute.                                                                                                                                                   |
| `color` `purple` / `green` / `red` / `yellow` | same                 | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms.                                                                                                                                 |
| `color="light-blue"`                          | _(no equivalent)_    | Delete the attribute. `ds-steps` has no light-blue. Mention each one as a visual change. Do not pick a replacement color.                                                                         |
| `color` not a string literal                  | leave the expression | Do not guess a runtime color. Say in the summary that `purple`, `green`, `red` and `yellow` are the accepted values.                                                                              |
| `clickable`                                   | _(no equivalent)_    | Delete the attribute. Mention each one.                                                                                                                                                           |
| `debounce`                                    | _(no equivalent)_    | Delete the attribute. Mention each one.                                                                                                                                                           |
| `options`                                     | _(no equivalent)_    | Leave in place and report. `ds-steps` has no `options` prop and builds its steps from `ds-step` children. Say that the steps and panels must be rebuilt as children by hand. Rename the tag only. |
| _(none)_                                      | `vertical`, `label`  | New props. Nothing to migrate from. Leave `vertical` unset. In navigation mode, suggest a `label` (see Report).                                                                                   |

### Props on `bal-step-item`

| old (`bal-step-item`)         | new                             | handling                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                       | `name` (and `for` on the panel) | See Panels mode.                                                                                                                                                                                                                                                                                                                                                                                |
| `label`                       | `label`                         | Copy as-is. In navigation mode it is also the text of the `<a>`.                                                                                                                                                                                                                                                                                                                                |
| `done`                        | `done`                          | Copy as-is.                                                                                                                                                                                                                                                                                                                                                                                     |
| `disabled`                    | `disabled`                      | Copy as-is.                                                                                                                                                                                                                                                                                                                                                                                     |
| `failed`                      | `invalid`                       | Rename, keeping the value form.                                                                                                                                                                                                                                                                                                                                                                 |
| `invisible`                   | `hidden`                        | Rename, keeping the value form.                                                                                                                                                                                                                                                                                                                                                                 |
| `active`                      | `value` on `ds-steps`           | When `bal-steps` has no `value`, set `value` to this item's `name` and delete `active`. (Without any `value`, `ds-steps` selects the first step that is not hidden or disabled, so only add one when `active` was on a different item.) When it has one, the old code let `value` win, so keep it, delete `active`, and report the conflict. A dynamic `active` stays in place and is reported. |
| `href`, `rel`, `target`       | on the slotted `<a>`            | See Navigation mode.                                                                                                                                                                                                                                                                                                                                                                            |
| `prevent`                     | _(no equivalent)_               | Delete the attribute. Mention each one. The slotted `<a>` is left to the consumer's router.                                                                                                                                                                                                                                                                                                     |
| `balNavigate`                 | _(no equivalent)_               | Leave the listener in place and report it. Say that the router or a click handler on the `<a>` replaces it.                                                                                                                                                                                                                                                                                     |
| `getOptions()`, `setActive()` | _(no equivalent)_               | Leave the call in place and report it.                                                                                                                                                                                                                                                                                                                                                          |

### Tags and imports

- **HTML**: `<bal-steps>` becomes `<ds-steps>`, including the closing tag. `bal-step-item` is rewritten as described in the two modes.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSteps`, `BalStepItem` or `BalStepsBundle` from `@baloise/ds-angular`, replace all of them with `import { DsSteps, DsStep, DsStepPanel } from '@helvetia-design/angular'`, listing only the symbols the file's templates now use (navigation mode needs no `DsStepPanel`). Leave the other symbols on the `@baloise` import. `BalStepsBundle` was an array of both legacy classes. In an `imports:` list it becomes the same symbols.
- **React**: `<BalSteps>` becomes `<DsSteps>` and `</BalSteps>` becomes `</DsSteps>`. `BalStepItem` is rewritten as in the two modes, to `DsStep` and `DsStepPanel`. Import only the used symbols from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSteps` and `BalStepItem` and leave the rest on the `@baloise` import.
- **Types**: `BalStepOption` has no equivalent, because there is no `options` prop. Leave it in place and report it.

### Events and methods

| old                       | new               | handling                                                                                                                                                                                                |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`               | `dsChange`        | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`.                                        |
| event `detail`            | see handling      | Legacy `detail` was the step `value` string. `dsChange` `detail` is `{ value }`. Leave each handler body as it is and mention every listener that reads `detail`. `dsChange` fires in panels mode only. |
| `select(step)`            | _(no equivalent)_ | Leave the call in place and report it. Set `value` on `ds-steps` to change the step.                                                                                                                    |
| `getOptionByValue(value)` | _(no equivalent)_ | Leave the call in place and report it.                                                                                                                                                                  |
| _(none)_                  | `dsStepSelect`    | Internal event from `ds-step`. Nothing to migrate from. Leave it unset.                                                                                                                                 |

Rewrite `balChange` listeners only on a migrated element. `balChange` is emitted by many other legacy components, so never rewrite a listener on an element you did not migrate. The scan does not list a file that only listens and never uses `bal-steps`, `bal-step-item`, `BalSteps`, `BalStepItem`, `BalStepsBundle` or `BalStepOption`.

## 4. Report

Print a per-file summary of what changed, including every `bal-step-item` split into a step and panel, every navigation group and the `aria-current` the router must set, every deleted `color="light-blue"`, `clickable`, `debounce` and `prevent`, every `active` moved to `value` or dropped because `value` won, every `balChange` listener whose detail is no longer the step value string, and every import that changed.

Also report what was left in place:

- Groups that mix items with and without `href`.
- Steps built in a loop, and every `options` prop, with the note that the steps and panels must be rebuilt as children by hand.
- Items without `value`.
- `select()`, `getOptionByValue()`, `getOptions()`, `setActive()`, `balNavigate` and `BalStepOption`.

Also report what the scan cannot see:

- Ambient type references `BalProps.BalStepsColor`, `BalEvents.BalSteps*`, `HTMLBalStepsElement` and `HTMLBalStepItemElement`. Grep for them and rename by hand. The scan does list `Components.BalSteps`, because it matches the bare `BalSteps` symbol. Treat it as a type reference too.
- Legacy `bal-steps__*` classes, the `bal-step-item` class and `data-testid="bal-steps-option"` selectors no longer match, because `ds-steps` uses shadow DOM.
- In navigation mode, `ds-steps` takes an accessible `label` for its `<nav>` landmark. Nothing was added. Suggest the consumer adds one that fits the page.
- Keyboard and roles. In panels mode, arrow keys, Home and End move the step, and the roles stay `tablist` and `tab`. Navigation mode renders an `<ol>` of links.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
