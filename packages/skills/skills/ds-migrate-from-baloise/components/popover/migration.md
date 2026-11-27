# popover → popup

Migrate every `bal-popover` usage to `ds-popup`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

`bal-popover` wraps its trigger and its content. The trigger is any child element with the attribute `bal-popover-trigger`, and the content is the child tag `bal-popover-content`. `ds-popup` is the content panel alone. It sits next to its trigger, and the trigger names it with `data-popup="<id>"`. So the migration unwraps `bal-popover`, keeps the trigger where it is, and turns `bal-popover-content` into the `ds-popup`.

The scan lists the tags `bal-popover` and `bal-popover-content`, the `bal-popover-trigger` attribute, the React and Angular symbols `BalPopover` and `BalPopoverContent`, and the `HTMLBalPopoverElement` and `HTMLBalPopoverContentElement` types. It does not match `bal-popup` or `BalPopup`, which belong to the `popup` migration. It does not match the ambient `BalProps.BalPopover*` and `BalEvents.BalPopover*` types or the bare `BalPopoverCustomEvent`. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

The legacy `@baloise/ds-angular` has no `BalPopoverBundle`. The multi-family `BalComponentBundle` holds `BalPopover` and follows the shared bundle rule in `SKILL.md` "Legacy types and bundles".

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-popover.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count. Read every `bal-popover` before you show the list, and mark each one that stays legacy because of `tooltip` (see "Popovers left legacy").

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-popover` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole `bal-popover` with its trigger and its content when the snippet does not show them. This step is finished when every finding matches the mapping or is reported as not migrated.

### Popovers left legacy

Before rewriting a `bal-popover`, read `tooltip`. A popover with `tooltip` set, statically to any value other than `false` or through a binding, is **not migrated**. Leave the `bal-popover`, its trigger, its `bal-popover-content`, its children and its imports as they are, and report it. Legacy opened it on hover and focus, and `ds-popup` opens on click only. Suggest `ds-tooltip`. This follows the popup `variant="drawer"` rule.

### Structure

| old | new | handling |
| --- | --- | --- |
| `<bal-popover>` wrapper | _(removed)_ | Remove the opening and closing tag. Keep the trigger and the content in its place, in this order: trigger, then `ds-popup`. When the wrapper has other children, keep them after the `ds-popup`. When the wrapper carries `class`, `style` or `data-*` attributes, replace it with a `<div>` that keeps them instead of removing it, and report it. |
| element with `bal-popover-trigger` | the same element with `data-popup="<id>"` | Remove `bal-popover-trigger` and add `data-popup="<id>"`. Keep the element and its children. Legacy set `aria-haspopup="true"` on the trigger, and `ds-popup` does not for a `data-popup` trigger. When the trigger is a `bal-button` or `ds-button`, or wraps exactly one of them, add `a11yHaspopup="true"` to that button in the form the file uses. On any other trigger element, add `aria-haspopup="true"`. |
| `<bal-popover-content>` | `<ds-popup id="<id>">` | Rename the tag and keep its children. Place it as the next sibling of the trigger. |
| `id` on `bal-popover` | `id` on `ds-popup` | Move it. It is the `<id>` for `data-popup`. |
| `bal-popover` inside a loop (`*ngFor`, `@for`, `.map(...)`) | a bound `id` and `data-popup` per item | `ds-popup` toggles every popup whose `id` matches the clicked `data-popup`, so a static id in a loop opens all rows at once and `group` closes them again. Bind the same expression to both, built from the base id plus the item key or index: React ``id={`portfolio-summary-popover-${item.id}`}`` and the same expression for `data-popup`, Angular `[id]="'portfolio-summary-popover-' + i"` and `[attr.data-popup]="'portfolio-summary-popover-' + i"`. A static legacy `id` inside a loop gets the same suffix. |
| no `id` on `bal-popover` | a new `id` on `ds-popup` | Derive a unique kebab-case id from the file name plus a counter per file, such as `portfolio-summary-popover-1` for `PortfolioSummary.tsx`. Check that no other element in the project uses it. |
| several elements with `bal-popover-trigger` | every one gets `data-popup="<id>"` | Legacy used only the first one. Give each of them the attribute and report the popover, because the others now open it too. |
| no element with `bal-popover-trigger` | `trigger` prop | The popover opened only through code. Rewrite the content as above. Set the `trigger` prop to the element the code opened it from (see the `present()` row). When no such element exists, report it. |

`ds-popup` toggles on any click inside `[data-popup="<id>"]`. It reads nothing else from the trigger.

### Props: `bal-popover`

Copy as-is, in every form: `arrow`. It keeps its name and its default. `backdrop` follows its row below.

| old (`bal-popover`) | new (`ds-popup`) | handling |
| --- | --- | --- |
| `position` set | `placement` | Rename and keep the value. `ds-popup` takes `top`, `right`, `bottom` or `left`, each alone or with `-start` or `-end`. |
| `position` omitted | `placement="bottom-start"` | Write the legacy default, because the `ds-popup` default is `bottom`. |
| `position="auto"`, `"auto-start"`, `"auto-end"` | _(no equivalent)_ | Drop it and report it. `ds-popup` flips the panel to stay on screen, so the panel stays visible. |
| bound `position` | bound `placement` | HTML: copy the binding as `placement` and list the file and line in the report. React and Angular: rename the binding when the expression's type only admits the twelve `ds-popup` values. Otherwise apply Unmapped props and handlers (`SKILL.md`). |
| `active` | `open` | Rename and keep the value. Also rewrite `[active]="x"` to `[open]="x"` and `active={x}` to `open={x}`. |
| `backdrop` | `backdrop` plus `backdropDismiss` | Copy `backdrop`. Report that `ds-popup` traps focus inside the panel, because `trapFocus` follows `backdrop`. |
| _(every popover)_ | `backdropDismiss` | Write it on every migrated popover. Legacy dismissed the popover on every click outside it, and `ds-popup` does that only with `backdropDismiss`. |
| _(every popover)_ | `group="popover"` | Write it on every migrated popover. Legacy dismissed every other popover when one opened, and `ds-popup` does that only within one `group`. |
| `offsetY` set | `offset` | Copy the value. Legacy added 8 px to it when `arrow` was set. With `arrow`, write the value plus 8. |
| `offsetY` omitted | omit `offset` | The `ds-popup` default is 8 px. Legacy sat flush, or 8 px away with `arrow`. Report it when `arrow` is not set. |
| `offsetX` | _(no equivalent)_ | Drop it and report it. `ds-popup` has no skidding offset. |
| `autoTrigger` | _(removed)_ | Drop it in every form. `data-popup` toggles the popup on click. See "Trigger handlers" for a popover where it was false or unset. |
| `hint` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). Suggest a `max-width` style on the popup content. |
| `mobileTop` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `padding` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `tooltip` | _(not migrated)_ | See "Popovers left legacy". `tooltip={false}` and `tooltip="false"` are dropped, and the popover migrates. |
| `hover` | _(removed)_ | Drop it in every form. Legacy 19.11.0 declares it but never reads it, so the popover never opened on hover. |
| _(none)_ | `label` | `ds-popup` has no visible title. When the trigger holds a short text and nothing else, or exactly one button or link whose content is a short text, set `label` to that text. Otherwise report the missing accessible name. |
| _(none)_ | `closable`, `panelRole`, `trapFocus` | New props. Leave them unset. `closable` would add a visible close button. |

### Props: `bal-popover-content`

| old (`bal-popover-content`) | new | handling |
| --- | --- | --- |
| `contentWidth`, `contentMinWidth` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). Suggest an inline `width` or `min-width` style, or a class, on a wrapper inside the popup. |
| `color`, `expanded`, `mobileTop`, `noShadow`, `radius`, `scrollable`, `spaceless` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |

### Trigger handlers

Legacy `bal-popover` with `autoTrigger` false or unset did not open on a click. The app opened it from code, usually a click handler on the trigger that calls `toggle()` or `present()` on a popover ref. `data-popup` now toggles the popup on every click inside the trigger.

A click handler is any click binding on the trigger or on an element inside it: `onClick`, `(click)`, `addEventListener('click', ...)`, and the `balClick` or `dsClick` binding of a button inside the trigger, such as `onBalClick={...}` or `(balClick)="..."`.

- A click handler whose whole body is a `toggle()` or `present()` call on the popover ref: delete the binding (`onClick={...}`, `(click)="..."`, `addEventListener('click', ...)`). Delete the handler function too when nothing else uses it, following the two cleanup bullets of Unmapped props and handlers (`SKILL.md`). Report each deletion.
- A click handler that does more than that: keep it and remove only the `toggle()` or `present()` call. Report that the trigger now toggles on click. When the rest of the handler tracks the open state, such as `setOpen(!open)` or `this.isOpen = !this.isOpen`, move that update to `dsDidPresent` (`true`) and `dsDidDismiss` (`false`) on the `ds-popup` and delete it from the handler, because `backdropDismiss` and `group` now close the popup without a click on the trigger.
- When the popover ref is no longer read after these deletions, remove the `ref` binding and its declaration, following the cleanup bullets of Unmapped props and handlers (`SKILL.md`).
- No click handler on the trigger: report that the trigger now also toggles the popup on click.

### Methods

| old | new | handling |
| --- | --- | --- |
| `present(options)`, `dismiss(options)`, `toggle(options)` | `present()`, `dismiss()`, `toggle()` | Keep the call and drop the options argument. The ref type follows "Legacy types and bundles" in `SKILL.md`: `HTMLBalPopoverElement` becomes `HTMLDsPopupElement`, and a React `ComponentRef<typeof BalPopover>` or `ElementRef<typeof BalPopover>` becomes `ComponentRef<typeof DsPopup>` or `ElementRef<typeof DsPopup>`. Move a ref from the `bal-popover` onto the `ds-popup`. |
| `present()` or `toggle()` that runs before any click on the trigger, such as in `ngAfterViewInit`, `useEffect` or a handler on another element | the same call plus the `trigger` prop | `ds-popup` anchors to the clicked `data-popup` element or to `trigger`. Without either it has no anchor. Set `trigger` to the trigger element right before the call, never from a value read during render. React: `popupRef.current.trigger = triggerRef.current` inside the effect or handler, because `ref.current` is still empty on the first render. Angular: `this.popup.nativeElement.trigger = this.triggerEl.nativeElement`, with both refs read as `ElementRef` (`@ViewChild('t', { read: ElementRef })`), because a template ref on a `ds-button` returns the component, not the element. HTML: `popup.trigger = el`. Report it. |

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild`, or holds the event handler, without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `present(`, `dismiss(` and `toggle(` calls and for `balChange`, `balWillAnimate` and `balDidAnimate` handlers. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

### Events

The three legacy events follow the rules of `components/popup/migration.md` exactly. Read its Events table and apply it to the `ds-popup` that replaces the `bal-popover`.

| old | new | handling |
| --- | --- | --- |
| `balWillAnimate` | `dsWillPresent` + `dsWillDismiss` | Apply the `balWillAnimate` row of `components/popup/migration.md`. The legacy detail was the open state before the change. |
| `balDidAnimate` | `dsDidPresent` + `dsDidDismiss` | Apply the `balDidAnimate` row of `components/popup/migration.md`. The legacy detail was the open state after the change. Replace every read of `detail` with `true` (present) or `false` (dismiss). |
| `balChange` | `dsDidPresent` + `dsDidDismiss` | Apply the `balChange` row of `components/popup/migration.md`, including the `detail` replacement and the merge rule with `balDidAnimate`. |

Move every binding from the `bal-popover` onto the `ds-popup`. Rewrite only handlers that are attached to the `bal-popover` being migrated. `balChange` is emitted by many other legacy components, so never rewrite a handler on another element, and never rename it by search and replace across the file.

### Tags and imports

- **HTML**: `<bal-popover>` goes, and `<bal-popover-content>` becomes `<ds-popup>`, including the closing tag.
- **Angular**: the same rewrite in `.html` templates and in inline `template:` strings. When a file imports `BalPopover` or `BalPopoverContent` from `@baloise/ds-angular`, remove both and add `import { DsPopup } from '@helvetia-design/angular'`. Leave the other symbols on the `@baloise` import. In `imports: [...]`, replace them with one `DsPopup`. A multi-family bundle such as `BalComponentBundle` stays, and `DsPopup` goes next to it.
- **React**: `<BalPopover>` goes, and `<BalPopoverContent>` becomes `<DsPopup>`, including the closing tag. Import `DsPopup` from `@helvetia-design/react`. Remove `BalPopover` and `BalPopoverContent` from the `@baloise/ds-react` import, and delete the import line when it binds nothing else. If the file already imports from `@helvetia-design/react`, add to that import.

Apply these rules per file. A file that still holds a popover left legacy keeps the symbols that popover uses.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every popover with `tooltip`, left as legacy `bal-popover` and not migrated. Name file and line, and suggest `ds-tooltip`.
2. Every popover inside a loop, with the bound `id` and `data-popup` expression it got.
3. Every wrapper replaced by a `<div>` because it carried attributes, with the attributes.
4. Every popover with more than one `bal-popover-trigger` element, because every trigger now opens it.
5. Every popover without a `bal-popover-trigger` element, with the `trigger` prop set or the missing anchor.
6. Every generated `id`, with file and line.
7. Every dropped `position="auto"`, `"auto-start"` or `"auto-end"`.
8. Every dynamic `position` binding, with the framework outcome (copied in HTML, copied or removed (Unmapped) in React and Angular).
9. Every dropped `offsetX`.
10. Every popover without `offsetY` and without `arrow`. It now sits 8 px from its trigger, where legacy sat flush.
11. Every popover with `backdrop`. `ds-popup` traps focus inside the panel. Legacy did not trap focus.
12. Every `hint`, `mobileTop` and `padding` on `bal-popover`, and every prop on `bal-popover-content`, with its Unmapped props and handlers outcome. Suggest a `width` or `min-width` style for `contentWidth` and `contentMinWidth`.
13. Every trigger click handler deleted or changed, and every trigger that now also toggles on click.
14. Every `present()` or `toggle()` call that needed the `trigger` prop.
15. Every popover without `label`, because the trigger holds more than a short text. The panel has no accessible name.
16. Every `balChange`, `balWillAnimate` and `balDidAnimate` handler, split into its pair as `components/popup/migration.md` describes, or with its Unmapped props and handlers outcome.
17. Every type reference that the scan cannot see, such as `BalProps.BalPopoverPlacement`, `BalEvents.BalPopoverChangeDetail` or `BalPopoverCustomEvent`, and every multi-family bundle kept, as `SKILL.md` "Legacy types and bundles" describes.
18. One-time note, when at least one popover was migrated: Escape no longer closes the popup unless `closable` is set, which also shows a close button, and tabbing out of the panel no longer closes it.
19. Every lost selector. `ds-popup` uses shadow DOM. Selectors in the project's own styles that target `bal-popover`, `bal-popover-content` or a `bal-popover__*` or `bal-popover-content__*` class no longer match. Do not rewrite them. Report them.

Coverage only, written to the file:

20. Every `bal-popover` unwrapped and its `bal-popover-content` rewritten to `ds-popup`.
21. Every `bal-popover-trigger` rewritten to `data-popup`, and every `a11yHaspopup="true"` or `aria-haspopup="true"` added.
22. Every `position` renamed to `placement`, and every `placement="bottom-start"` added.
23. Every `active` renamed to `open`.
24. Every `backdropDismiss` and `group="popover"` added.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
