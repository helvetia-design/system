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

### Groups left in place

Decide per `bal-steps` group before editing anything in it. Leave the whole group unchanged, including its tag, and report it, when any of these is true:

- Its items are mixed, some with `href` and some without. `ds-steps` cannot mix the modes.
- It has an `options` attribute. `ds-steps` builds its steps from `ds-step` children, so the steps and panels must be rebuilt as children by hand. The whole group stays `bal-*`, including the `bal-steps` tag.
- A loop produces its items and the loop body cannot be mapped: spread props, a component other than `BalStepItem` / `bal-step-item`, conditional rendering of the item, or an `href` present on only some iterations.
- A `bal-step-item` without `href` has no `value`. In panels mode it has nothing to link, so do not invent a name. Navigation mode takes a slug of the `label` instead, see Navigation mode.
- A `bal-step-item` has a dynamic `active` and `bal-steps` has no `value`. Without a `value` there is nothing to keep, and `ds-steps` cannot take an expression from `active`.

A group left in place is never half migrated. The parent tag and every item stay `bal-*`, so a `ds-steps` without `ds-step` children is never produced. Report the group with file, line and the reason.

### Two modes

`ds-steps` decides its mode by its children. With `ds-step-panel` children it is in **panels mode**. Without them it is in **navigation mode**. For a group that is not left in place:

- No item has `href`: panels mode.
- Every item has `href`: navigation mode.

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

The old `value` becomes `name` on the `ds-step` and `for` on its `ds-step-panel`. Keep the value form (`value="a"`, `value={id}`, `[value]="id"`) on both.

Leave the content of the item as the content of the panel. In a group where some items have content, a step with no content gets no panel. A group where no item has content is a different case, see Panels mode without content.

### Items built in a loop

A loop over `bal-step-item` is rewritten together with its parent. Never rename only the parent. `ds-steps` builds its state from direct `ds-step` children, so a `ds-steps` that still holds `bal-step-item` loops would be empty.

- **React `.map()`**: the one `.map()` becomes two. The first produces `DsStep`, the second, over the same source, produces `DsStepPanel`. The content of the loop body becomes the content of the panel, and the panel is empty when the item had no content. Keep `key` on both.
- **Angular `*ngFor` and `@for`**: repeat the loop once for the steps and once for the panels. Keep `trackBy` and `track`.
- **Vue `v-for`**: repeat the loop once for the steps and once for the panels. Keep `:key`.

Static items and loop items in one group keep their order. All steps come first, then all panels. `ds-step` keeps `label` as a prop, so a dynamic `label` maps directly. Map `done` and `disabled` as they are, `failed` to `invalid` and `invisible` to `hidden`, keeping the expression form. A prop without an equivalent, such as `prevent`, is deleted and reported. It does not block the rewrite. A loop whose items all have `href` is navigation mode: it becomes one `ds-step` loop that wraps an `<a>`, with no panel loop. A loop that cannot be mapped keeps its whole group in place, see Groups left in place.

```tsx
<BalSteps
  value={currentStep.value}
  color={cond ? 'green' : 'light-blue'}
  clickable
  onBalChange={event => goToStep(String(event.detail ?? x))}
>
  {applicationSteps.map((step, index) => (
    <BalStepItem
      key={step.value}
      value={step.value}
      label={step.label}
      done={index < stepIndex}
      active={index === stepIndex}
    />
  ))}
</BalSteps>
```

becomes

```tsx
<DsSteps
  value={currentStep.value}
  color={cond ? 'green' : undefined}
  onDsChange={event => goToStep(String(event.detail.value ?? x))}
>
  {applicationSteps.map((step, index) => (
    <DsStep key={step.value} name={step.value} label={step.label} done={index < stepIndex} />
  ))}
  {applicationSteps.map(step => (
    <DsStepPanel key={step.value} for={step.value} />
  ))}
</DsSteps>
```

The dynamic `active` is deleted and the dynamic `value` is kept, see the `active` row. The consumer checks that `value` matches the item that was active. The bare `clickable` is deleted. The `light-blue` branch of the `color` conditional becomes `undefined` and is reported as a visual change. The panels are empty because the items had no content, see the next section.

### Panels mode without content

When no item has `href` and no item has content, the app renders its content itself from `value`. Produce one empty `ds-step-panel` per item, with `for` set to the item name. This keeps `ds-steps` in panels mode, so the steps stay clickable and `dsChange` fires. Without any panel `ds-steps` is in navigation mode, where steps are not clickable and `dsChange` never fires. This is the supported pattern for state-driven steps.

```html
<bal-steps value="a">
  <bal-step-item value="a" label="One"></bal-step-item>
  <bal-step-item value="b" label="Two"></bal-step-item>
</bal-steps>
```

becomes

```html
<ds-steps value="a">
  <ds-step name="a" label="One"></ds-step>
  <ds-step name="b" label="Two"></ds-step>
  <ds-step-panel for="a"></ds-step-panel>
  <ds-step-panel for="b"></ds-step-panel>
</ds-steps>
```

Report each such group with two notes. The selected empty panel keeps its padding, so set `--step-panel-p` to `0` when it shows. The `aria-controls` of each step points at an empty panel, not at the content the app renders.

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

| old (`bal-steps`) | new (`ds-steps`) | handling |
| --- | --- | --- |
| `value` | `value` | Copy as-is. It is the `name` of the active `ds-step`, which equals the old item `value`. A dynamic value stays untouched. Navigation mode ignores it. |
| `color="primary"` | omit `color` | `primary` is the default. Delete the attribute. |
| `color` `purple` / `green` / `red` / `yellow` | same | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms. |
| `color="light-blue"` | _(no equivalent)_ | Delete the attribute. `ds-steps` has no light-blue. Mention each one as a visual change. Do not pick a replacement color. |
| `color` not a string literal | see handling | Do not guess a runtime color. A conditional whose branches are all string literals is the exception: map each branch like a literal, and a branch that is `primary` or has no equivalent becomes `undefined`. Any other expression: HTML leaves it. React and Angular keep it when the expression's type only admits `purple`, `green`, `red` or `yellow`. Otherwise apply Unmapped props and handlers (`SKILL.md`). Say in the report that `purple`, `green`, `red` and `yellow` are the accepted values. |
| `clickable` | _(no equivalent)_ | Bare `clickable` or a literal true: delete it, coverage only. `clickable="false"`, `{false}`, `[clickable]="false"` or a dynamic value: delete it and report it as a behaviour change, the steps become clickable. Do not map it to `disabled` on each `ds-step`, that changes the visual state. |
| `debounce` | _(no equivalent)_ | Delete the attribute. Mention each one. |
| `options` | _(no equivalent)_ | The whole group stays `bal-*`, including the `bal-steps` tag, and is reported. See Groups left in place. `ds-steps` has no `options` prop and builds its steps from `ds-step` children, so the steps and panels must be rebuilt as children by hand. |
| _(none)_ | `vertical`, `label` | New props. Nothing to migrate from. Leave `vertical` unset. In navigation mode, suggest a `label` (see Report). |

### Props on `bal-step-item`

| old (`bal-step-item`) | new | handling |
| --- | --- | --- |
| `value` | `name` (and `for` on the panel) | See Panels mode. |
| `label` | `label` | Copy as-is. In navigation mode it is also the text of the `<a>`. |
| `done` | `done` | Copy as-is. |
| `disabled` | `disabled` | Copy as-is. |
| `failed` | `invalid` | Rename, keeping the value form. |
| `invisible` | `hidden` | Rename, keeping the value form. |
| `active` | `value` on `ds-steps` | `active` wins over `value`, as in legacy `bal-steps` (`setActiveItem` sets `value` from the first active item). Static `active` with a static `value` on `bal-steps`: replace that `value` with the active item's `name`, delete `active`. Static `active` with a dynamic `value`: keep the dynamic `value`, delete `active`, and report the conflict. Static `active` without `value`: set `value` to this item's `name` and delete `active`. (Without any `value`, `ds-steps` selects the first step that is not hidden or disabled, so only add one when `active` was on a different item.) Dynamic `active` with a `value`: delete `active`, keep `value`, and report that the consumer checks that `value` matches the item that was active. Dynamic `active` without `value`: the group stays in place. |
| `href`, `rel`, `target` | on the slotted `<a>` | See Navigation mode. |
| `prevent` | _(no equivalent)_ | Delete the attribute, also in a loop. Mention each one. The slotted `<a>` is left to the consumer's router. |
| `balNavigate` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). In the report, say that the router or a click handler on the `<a>` replaces it. |
| `getOptions()`, `setActive()` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `BalStepOption` for `getOptions()` and `void` for `setActive()`, the legacy return types without the `Promise`. |

### Tags and imports

- **HTML**: `<bal-steps>` becomes `<ds-steps>`, including the closing tag. `bal-step-item` is rewritten as described in the two modes.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSteps`, `BalStepItem` or `BalStepsBundle` from `@baloise/ds-angular`, replace all of them with `import { DsSteps, DsStep, DsStepPanel } from '@helvetia-design/angular'`, listing only the symbols the file's templates now use (navigation mode needs no `DsStepPanel`, the panels mode without content does). Leave the other symbols on the `@baloise` import. `BalStepsBundle` was an array of both legacy classes. In an `imports:` list it becomes the same symbols.
- **React**: `<BalSteps>` becomes `<DsSteps>` and `</BalSteps>` becomes `</DsSteps>`. `BalStepItem` is rewritten as in the two modes, to `DsStep` and `DsStepPanel`, also for the pattern without content. Import only the used symbols from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSteps` and `BalStepItem` and leave the rest on the `@baloise` import.
- **Types**: `BalStepOption` has no equivalent, because there is no `options` prop. Leave it in place and report it.

### Events and methods

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| event `detail` | `event.detail.value` | Legacy `detail` was the step `value` string. `dsChange` `detail` is `{ value }`. See Reading `detail` below. `dsChange` fires in panels mode only. |
| `select(step)` | `value` | Set `value` on `ds-steps` to the step's `value`. React: `ref.current.value = step.value`, or set the state variable that feeds `value` when the element is controlled. Angular: set the property bound to `[value]`, or `el.value = ...`. HTML: `el.value = ...`. Setting `value` does not emit `dsChange`. |
| `getOptionByValue(value)` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `BalStepOption`, the legacy return type without the `Promise`. |
| _(none)_ | `dsStepSelect` | Internal event from `ds-step`. Nothing to migrate from. Leave it unset. |

Rewrite `balChange` listeners only on a migrated element. `balChange` is emitted by many other legacy components, so never rewrite a listener on an element you did not migrate. The scan does not list a file that only listens and never uses `bal-steps`, `bal-step-item`, `BalSteps`, `BalStepItem`, `BalStepsBundle` or `BalStepOption`.

#### Reading `detail`

When the handler body is in the same file, rewrite every read of `event.detail` to `event.detail.value`. That covers an inline arrow, a named function, an Angular class method bound by `(balChange)` (open the sibling `.ts`) and an `addEventListener` callback. Examples:

- `String(event.detail ?? x)` becomes `String(event.detail.value ?? x)`.
- `({ detail }) => f(detail)` becomes `({ detail }) => f(detail.value)`.
- Angular `(balChange)="onStep($event.detail)"` becomes `(dsChange)="onStep($event.detail.value)"`.

When the handler parameter carries the legacy type, such as `CustomEvent<string>` or `BalStepsCustomEvent<string>`, change it to `CustomEvent<{ value: string }>`, otherwise `detail.value` fails to typecheck. An inline JSX arrow takes its type from `onDsChange` and needs no annotation.

A handler defined in another file, or passed through as a prop or variable whose body you cannot see, stays as it is and is reported. The same holds for a handler that is also bound to an element you did not migrate, such as a group left in place or another component's `balChange`. Rewriting it would break that binding, so leave it and report it.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every navigation group, with the `aria-current` the router must set.
2. Every deleted `color="light-blue"`, also as a branch of a conditional, as a visual change.
3. Every deleted `clickable` that was not a literal true, as a behaviour change. The steps become clickable. Do not map it to `disabled`.
4. Every deleted `prevent`. The slotted `<a>` is left to the consumer's router.
5. Every static `active` that replaced a static `value`, or was dropped because a dynamic `value` was kept. Report the conflict.
6. Every dynamic `active` dropped. The consumer checks that `value` matches the item that was active.
7. Every group migrated without content (empty `ds-step-panel` per step), with two notes. The selected empty panel keeps its padding, so set `--step-panel-p` to `0` if it shows. The `aria-controls` of each step points at an empty panel, not at the content the app renders.
8. Every `balChange` handler whose body is in another file, is not visible, or is also bound to an element that was not migrated, so its `detail` reads were not rewritten to `detail.value`. Name file and line.
9. Every group left in place because it mixes items with and without `href`. Name file and line.
10. Every group left in place because of `options`, the whole group including the `bal-steps` tag, with the note that the steps and panels must be rebuilt as children by hand. Name file and line.
11. Every group left in place because its loop body cannot be mapped, with the reason. Name file and line.
12. Every panels-mode group left in place because an item has no `value`. Name file and line.
13. Every group left in place because of a dynamic `active` without a `value` on `bal-steps`. Name file and line.
14. Every call to `getOptionByValue()`, `getOptions()` or `setActive()`, with its Unmapped props and handlers outcome.
15. Every `balNavigate` listener, with its Unmapped props and handlers outcome.
16. Every left-in-place `BalStepOption` reference.
17. Every ambient type reference `BalProps.BalStepsColor` and `BalEvents.BalSteps*`. The scan cannot see them. Grep for them and rename by hand. It does list `HTMLBalStepsElement` and `HTMLBalStepItemElement`. The scan does list `Components.BalSteps`, because it matches the bare `BalSteps` symbol. Treat it as a type reference too.
18. Every legacy `bal-steps__*` class, the `bal-step-item` class and `data-testid="bal-steps-option"` selector. They no longer match, because `ds-steps` uses shadow DOM.
19. One-time note: in navigation mode, `ds-steps` takes an accessible `label` for its `<nav>` landmark. Nothing was added. Suggest the consumer adds one that fits the page.
20. Every `color` that is not a string literal and not a mapped conditional, with the framework outcome (left in HTML, kept or removed (Unmapped) in React and Angular). `purple`, `green`, `red` and `yellow` are the accepted values.

Coverage only, written to the file:

21. Every `bal-step-item` split into a step and panel.
22. Every deleted `clickable` that was bare or a literal true.
23. Every deleted `debounce`.
24. Every static `active` moved to `value`.
25. Every loop rewritten together with its parent, with the file and line.
26. Every `detail` read rewritten to `detail.value`.
27. Every `select(step)` call rewritten to set `value`.
28. Every import that changed.
29. One-time note: keyboard and roles. In panels mode, arrow keys, Home and End move the step, and the roles stay `tablist` and `tab`. Navigation mode renders an `<ol>` of links.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
