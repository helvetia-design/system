# popup

Migrate every `bal-popup` usage to `ds-popup`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The scan lists the `bal-popup` tag, the React and Angular symbol `BalPopup`, the `bal-popup` trigger attribute with its eight `bal-popup-*` override attributes, and the two `@baloise/ds-testing` Cypress commands `balPopupIsOpen` and `balPopupIsClosed`. The scan also lists every `setAttribute` call whose first argument is a string literal equal to `bal-popup` or one of those override names. The trigger attributes, the calls and the commands are listed because they appear in files that never name the tag. The scan does not match the ambient `BalProps.BalPopupVariant`, `BalProps.BalPopupPlacement` or `BalEvents.BalPopup*` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

The legacy folder has no child components. `bal-popup` renders `bal-stack`, `bal-heading` and `bal-close` inside its own tree; those belong to their own migrations and are not consumer tags here. The component keeps its name. The old tag is `bal-popup`, the new tag is `ds-popup`.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-popup.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-popup` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

Before rewriting a popup, check its `variant` and how its trigger is wired. A `variant="drawer"` or `variant="fullscreen"` popup is **not migrated** at all, and neither is a popup with a trigger set by a `setAttribute` call that stays in place. See the Props table and "setAttribute calls".

### Trigger wiring

Legacy wires the popup through attributes on the trigger element. `ds-popup` reads nothing from its trigger: every setting lives on the popup element, and the trigger only names the popup.

| old (on the trigger) | new | handling |
| --- | --- | --- |
| `bal-popup="<id>"` (HTML), `[attr.bal-popup]="x"` (Angular), `setAttribute('bal-popup', '<id>')` (React and JS) | `data-popup="<id>"`, `[attr.data-popup]="x"`, `setAttribute('data-popup', '<id>')` | Rename the attribute and keep the value. Both match the popup's `id`. In a `setAttribute` call rename only the first argument and see "setAttribute calls". A bound `[attr.bal-popup]` whose value is not a string literal follows the same exceptions as a `setAttribute` call with a non-literal id. Legacy `bal-button` set `aria-haspopup` from `bal-popup`, and `ds-button` does not read `data-popup`. On a `bal-button` or `ds-button` trigger element in markup, add `a11yHaspopup="true"` in the form the file uses, unless it is already set. |
| `bal-popup-placement`, `bal-popup-arrow`, `bal-popup-backdrop`, `bal-popup-offset`, `bal-popup-closable`, `bal-popup-backdrop-dismiss` | the matching `ds-popup` prop | Move the value onto the `ds-popup` element as `placement`, `arrow`, `backdrop`, `offset`, `closable` or `backdropDismiss`, and drop the attribute from the trigger. Do this **only when exactly one element carries `bal-popup="<id>"`** for that popup. Report each move. |
| any `bal-popup-*` when the popup has more than one trigger | _(leave everything)_ | Legacy reconfigured the popup from whichever trigger was clicked, and `ds-popup` has one setting. Leave the trigger attributes and the popup unchanged and report the whole group as needing manual rework. |
| `bal-popup-variant` | _(no equivalent)_ | Drop it from the trigger. It also decides whether the popup migrates at all: treat it exactly like the `variant` prop row below. |
| `bal-popup-reference` | _(no equivalent)_ | Drop it and report each one. `ds-popup` anchors to its trigger only. |

#### setAttribute calls

Apps also set the trigger imperatively, for example `trigger.setAttribute('bal-popup', 'claim-policy-help')` or `ref.current?.setAttribute('bal-popup', popupId)`. Rewrite the attribute-name string to `data-popup` and leave the rest of the call, only when the call wires exactly one popup and that popup migrates. Otherwise leave the call and report it with file, line and reason. Leave it when:

- the target popup has `variant="drawer"`, `variant="fullscreen"` or a dynamically bound `variant`
- the call sits in a helper that wires several popups, for example `usePopupTrigger(popupId)` used for three popups
- the id is not a string literal

A popup with any trigger set by a call left in place is **not migrated**, also when it has other triggers in markup. It stays legacy `bal-popup` with its tag, children, imports and trigger, exactly like the `variant="drawer"` rule, and you report it. Otherwise it would become `ds-popup` while its trigger still sets `bal-popup`, and it would never open. When the id is not a string literal, trace the call's callers to find every id it receives, for example each `usePopupTrigger('<id>')` call. Each popup with one of those ids is wired through the call. When you cannot resolve the ids, migrate no popup on a guess. Leave every popup in the files that use the call as legacy and report them.

For `setAttribute('bal-popup-<override>', <value>)`, apply the override rows above. When the value is a literal, the popup has exactly one trigger and the popup migrates, move the value onto the `ds-popup` element as the matching prop and remove the `setAttribute` call. Otherwise leave the call and report it. `bal-popup-variant` and `bal-popup-reference` follow their own rows.

A boolean trigger attribute is bare or `="true"` in legacy. Write the `ds-popup` prop in the form the file uses: `arrow` (HTML), `[arrow]="true"` (Angular), `arrow={true}` (React).

### Props

Copy as-is, in every form: `label`, `placement`, `arrow`, `backdrop`, `closable`, `backdropDismiss`. Each keeps its name and its default.

| old (`bal-popup`) | new (`ds-popup`) | handling |
| --- | --- | --- |
| `active` | `open` | Rename and keep the value. Both are booleans defaulting to `false`. Also rewrite `[active]="x"` to `[open]="x"` and `active={x}` to `open={x}`. |
| `demo` | `open` | Legacy `demo` presents the popup on load. HTML and Angular: write `open="true"`. React: write `open`. Also rewrite `demo='true'`, `demo={"true"}`, and `demo={'true'}`. |
| `offset` set | `offset` | Copy the value as-is. |
| `offset` omitted | omit `offset` | The default changed from `0` to `8`. Do not add `offset="0"`. Report that the popup now sits 8px from its trigger. |
| `variant="popover"` or omitted | omit | `ds-popup` is popover only, so the default needs nothing. |
| `variant="drawer"` / `"fullscreen"` | _(not migrated)_ | Leave the whole element, its children, its trigger and its imports as legacy `bal-popup`. `ds-popup` has no drawer or fullscreen variant: a drawer is `ds-drawer` and a fullscreen popup is `ds-modal` with `fullscreen`, both different elements with their own wiring. Report each one. |
| `variant` bound dynamically | _(not migrated)_ | The value is unknown at migration time and may be `drawer` or `fullscreen`. Leave the element as legacy and report it. |
| `reference` | _(no equivalent)_ | Drop it in every form. `ds-popup` anchors to its trigger. Report each one. |
| `contentWidth` | _(no equivalent)_ | Drop it in every form. Legacy set `--bal-popup-variant-popover-max-width` from it. Report each one. |
| _(none)_ | `panelRole`, `group`, `trapFocus` | New props. Nothing to migrate from. Leave them unset. |
| `[placement]="x"`, `[attr.offset]="x"`, `closable={x}`, and the same for every other copied prop | same | Dynamic value. Do not guess the mapping. `active`, `reference` and `contentWidth` follow their own rows. Every other prop keeps its name. HTML: copy the binding unchanged and list the file and line in the report. React and Angular: copy it when the expression's type only admits values the `ds-popup` prop accepts. `placement` takes `top`, `right`, `bottom` or `left`, each alone or with `-start` or `-end`. `offset` takes a number and `label` a string. `arrow`, `backdrop`, `closable` and `backdropDismiss` take a boolean. Otherwise apply Unmapped props and handlers (`SKILL.md`). |

### Tags and imports

- **HTML**: `<bal-popup>` becomes `<ds-popup>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalPopup` from `@baloise/ds-angular`, move only that symbol to `import { DsPopup } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well.
- **React**: `<BalPopup>` becomes `<DsPopup>` and `</BalPopup>` becomes `</DsPopup>`. Import `DsPopup` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalPopup` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

Legacy had one event per phase covering both directions. `ds-popup` has a separate event per direction, and the direction now comes from which event fires rather than from the detail.

| old | new | handling |
| --- | --- | --- |
| `balWillAnimate` | `dsWillPresent` + `dsWillDismiss` | Split into two bindings. Angular: `(balWillAnimate)="f($event)"` becomes `(dsWillPresent)="f($event)"` and `(dsWillDismiss)="f($event)"`. React: `onBalWillAnimate` becomes `onDsWillPresent` and `onDsWillDismiss`. HTML: add both `addEventListener` calls. Legacy emitted no detail, so the handler body needs no change. Report each split. |
| `balDidAnimate` | `dsDidPresent` + `dsDidDismiss` | Same handling, with `dsDidPresent` and `dsDidDismiss`. |
| `balChange` | `dsDidPresent` + `dsDidDismiss` | Legacy emitted `balChange` from `present()` and `dismiss()` with the new open state as a boolean. Split into two bindings, as for `balWillAnimate`. Angular: `(balChange)` becomes `(dsDidPresent)` and `(dsDidDismiss)`. React: `onBalChange` becomes `onDsDidPresent` and `onDsDidDismiss`. HTML: add both `addEventListener` calls. In each copy, replace every read of the event's `detail` with the literal `true` (present) or `false` (dismiss). When the handler passes the event to a method (`(balChange)="onChange($event)"`, `onBalChange={handleChange}`) and that method only reads `detail`, change the method to take the boolean and pass `true` or `false`. When the method reads more than `detail`, or other events share it, apply Unmapped props and handlers (`SKILL.md`). Report each split, and say that the new events fire after the animation, where legacy fired at the start of present and dismiss. When the same element also has `balDidAnimate`, both map to `dsDidPresent` and `dsDidDismiss`. In React and Angular, write one `onDsDidPresent` or `(dsDidPresent)` binding and one for dismiss. Each body runs the `balChange` code first and the `balDidAnimate` code second, the order legacy fired them. Never write the same attribute or Angular output twice, because React fails with TS17001. |
| event `detail` | `{ trigger }` | The new events carry the trigger element. Legacy `balWillAnimate` and `balDidAnimate` carried nothing. Mention each listener that now receives a detail it did not before. |

Rewrite only handlers that are attached to the element being migrated. `balChange` is emitted by many other legacy components, so never rewrite a handler on another element, and never rename it by search and replace across the file.

### Methods

`present()`, `dismiss()` and `toggle()` keep their names, their signatures and their behaviour. There is nothing to rewrite. `setMinWidth()`, `_present()`, `_dismiss()` and `_emitChange()` were `@internal` on the legacy element and have no replacement. Apply Unmapped props and handlers (`SKILL.md`).

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild`, or holds the event handler, without ever naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `present()`, `dismiss()` and `toggle()` calls and for `balChange`, `balWillAnimate` and `balDidAnimate`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every dynamic binding, with the framework outcome (copied in HTML, copied or removed (Unmapped) in React and Angular).
2. Every `variant="drawer"`, left as legacy `bal-popup` and not migrated. Name file and line. Name `ds-drawer` as the target, and say it is a different element with its own trigger wiring.
3. Every `variant="fullscreen"`, left as legacy `bal-popup` and not migrated. Name file and line. Name `ds-modal` with `fullscreen` as the target, and say it is a different element with its own trigger wiring.
4. Every dynamically bound `variant`, left as legacy `bal-popup` and not migrated. Name file and line. Name `ds-drawer` and `ds-modal` with `fullscreen` as the possible targets.
5. Every popup with more than one trigger whose `bal-popup-*` attributes were left in place. Name every trigger's file and line.
6. Every `setAttribute` call left in place, with file and line, the reason, and every popup it wires left as legacy `bal-popup`.
7. Every dropped `reference`. `ds-popup` anchors to its trigger only.
8. Every dropped `contentWidth`.
9. Every dropped `bal-popup-reference`. `ds-popup` anchors to its trigger only.
10. Every `balChange` handler, either split into `dsDidPresent` and `dsDidDismiss` with the note that the new events fire after the animation, where legacy fired at the start of present and dismiss, or with its Unmapped props and handlers outcome.
11. Every call to `setMinWidth()`, `_present()`, `_dismiss()` or `_emitChange()`, with its Unmapped props and handlers outcome.
12. Every type reference that the scan cannot see, such as `BalProps.BalPopupVariant` or `BalEvents.BalPopupChangeDetail`. These resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed. `@helvetia-design/core` does not export the matching `PopupPlacement` or `PopupRole` types yet.
13. Every popup that sets `label`, as needing a heading in its slot content. Legacy rendered `label` as a visible heading above the content, with the close button beside it. `ds-popup` uses `label` only as the panel's `aria-label`, so the accessible name survives but nothing is shown. Do not build the heading markup.
14. Every popup with `closable` set. Legacy only rendered the close button when `label` was set, because it lived in the title row. `ds-popup` renders it whenever `closable` is set. Do not add attributes or markup to compensate.
15. Every popup without an explicit `offset`. It now sits 8px from its trigger, where legacy sat flush. Check spacing-sensitive layouts.
16. Every popup with `backdrop` set. `ds-popup` traps focus inside the panel, because `trapFocus` follows `backdrop` by default. Legacy did not trap focus.
17. Every file with a lost test hook. The test ids `bal-popup-label`, `bal-popup-close` and `bal-popup-content` are gone, as is the non-standard `aria-presented` attribute on the host. `@baloise/ds-testing`'s `balPopupIsOpen` and `balPopupIsClosed` assert on `aria-presented` and break. `ds-popup` exposes `part="panel"`, `part="backdrop"`, `part="arrow"` and `part="close"`, and `data-testid="ds-popup-panel"` on the panel. Do not rewrite the tests.
18. Every lost selector. `ds-popup` uses shadow DOM. The legacy classes `bal-popup`, `bal-popup__container`, `bal-popup__container--variant-*`, `bal-popup__arrow`, `bal-popup__backdrop`, `bal-popup__inner`, `bal-popup__inner__head` and `bal-popup__inner__content` are gone, as is the runtime trigger class `bal-popup-variant-popover-trigger`. The `bal-stack`, `bal-heading` and `bal-close` elements the legacy popup rendered were in the light DOM and are now encapsulated. Do not rewrite those selectors yourself. Report them.

Coverage only, written to the file:

19. Every `bal-popup` trigger attribute renamed to `data-popup`.
20. Every `setAttribute` trigger call rewritten to `data-popup`.
21. Every `bal-popup-*` override moved onto the popup.
22. Every `active` renamed to `open`.
23. Every animate event split into its pair.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
