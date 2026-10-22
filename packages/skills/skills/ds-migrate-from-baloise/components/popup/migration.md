# popup

Migrate every `bal-popup` usage to `ds-popup`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The scan lists the `bal-popup` tag, the React and Angular symbol `BalPopup`, the `bal-popup` trigger attribute with its seven `bal-popup-*` override attributes, and the two `@baloise/ds-testing` Cypress commands `balPopupIsOpen` and `balPopupIsClosed`. The trigger attributes and the commands are listed because they appear in files that never name the tag. The scan does not match the ambient `BalProps.BalPopupVariant`, `BalProps.BalPopupPlacement` or `BalEvents.BalPopup*` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

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

Before rewriting a popup, check its `variant`. A `variant="drawer"` or `variant="fullscreen"` popup is **not migrated** at all. See the Props table.

### Trigger wiring

Legacy wires the popup through attributes on the trigger element. `ds-popup` reads nothing from its trigger: every setting lives on the popup element, and the trigger only names the popup.

| old (on the trigger)                                                                                                                   | new                          | handling                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bal-popup="<id>"`                                                                                                                     | `data-popup="<id>"`          | Rename the attribute and keep the value. Both match the popup's `id`.                                                                                                                                                                                                      |
| `bal-popup-placement`, `bal-popup-arrow`, `bal-popup-backdrop`, `bal-popup-offset`, `bal-popup-closable`, `bal-popup-backdrop-dismiss` | the matching `ds-popup` prop | Move the value onto the `ds-popup` element as `placement`, `arrow`, `backdrop`, `offset`, `closable` or `backdropDismiss`, and drop the attribute from the trigger. Do this **only when exactly one element carries `bal-popup="<id>"`** for that popup. Report each move. |
| any `bal-popup-*` when the popup has more than one trigger                                                                             | _(leave everything)_         | Legacy reconfigured the popup from whichever trigger was clicked, and `ds-popup` has one setting. Leave the trigger attributes and the popup unchanged and report the whole group as needing manual rework.                                                                |
| `bal-popup-variant`                                                                                                                    | _(no equivalent)_            | Drop it from the trigger. It also decides whether the popup migrates at all: treat it exactly like the `variant` prop row below.                                                                                                                                           |
| `bal-popup-reference`                                                                                                                  | _(no equivalent)_            | Drop it and report each one. `ds-popup` anchors to its trigger only.                                                                                                                                                                                                       |

A boolean trigger attribute is bare or `="true"` in legacy. Write the `ds-popup` prop in the form the file uses: `arrow` (HTML), `[arrow]="true"` (Angular), `arrow={true}` (React).

### Props

Copy as-is, in every form: `label`, `placement`, `arrow`, `backdrop`, `closable`, `backdropDismiss`. Each keeps its name and its default.

| old (`bal-popup`)                                                                         | new (`ds-popup`)             | handling                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `active`                                                                                  | `open`                       | Rename and keep the value. Both are booleans defaulting to `false`. Also rewrite `[active]="x"` to `[open]="x"` and `active={x}` to `open={x}`.                                                                                                                                           |
| `demo`                                                                                    | `open`                       | Legacy `demo` presents the popup on load. HTML and Angular: write `open="true"`. React: write `open`. Also rewrite `demo='true'`, `demo={"true"}`, and `demo={'true'}`.                                                                                                                   |
| `offset` set                                                                              | `offset`                     | Copy the value as-is.                                                                                                                                                                                                                                                                     |
| `offset` omitted                                                                          | omit `offset`                | The default changed from `0` to `8`. Do not add `offset="0"`. Report that the popup now sits 8px from its trigger.                                                                                                                                                                        |
| `variant="popover"` or omitted                                                            | omit                         | `ds-popup` is popover only, so the default needs nothing.                                                                                                                                                                                                                                 |
| `variant="drawer"` / `"fullscreen"`                                                       | _(not migrated)_             | Leave the whole element, its children, its trigger and its imports as legacy `bal-popup`. `ds-popup` has no drawer or fullscreen variant: a drawer is `ds-drawer` and a fullscreen popup is `ds-modal` with `fullscreen`, both different elements with their own wiring. Report each one. |
| `variant` bound dynamically                                                               | _(not migrated)_             | The value is unknown at migration time and may be `drawer` or `fullscreen`. Leave the element as legacy and report it.                                                                                                                                                                    |
| `reference`                                                                               | _(no equivalent)_            | Drop it in every form. `ds-popup` anchors to its trigger. Report each one.                                                                                                                                                                                                                |
| `contentWidth`                                                                            | _(no equivalent)_            | Drop it in every form. Legacy set `--bal-popup-variant-popover-max-width` from it. Report each one.                                                                                                                                                                                       |
| _(none)_                                                                                  | `role`, `group`, `trapFocus` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                                                     |
| `[placement]="x"`, `[attr.offset]="x"`, `closable={x}`, and the same for any renamed prop | leave the binding            | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary.                                                                                                                                                                           |

### Tags and imports

- **HTML**: `<bal-popup>` becomes `<ds-popup>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalPopup` from `@baloise/ds-angular`, move only that symbol to `import { DsPopup } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well.
- **React**: `<BalPopup>` becomes `<DsPopup>` and `</BalPopup>` becomes `</DsPopup>`. Import `DsPopup` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalPopup` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

Legacy had one event per phase covering both directions. `ds-popup` has a separate event per direction, and the direction now comes from which event fires rather than from the detail.

| old              | new                               | handling                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balWillAnimate` | `dsWillPresent` + `dsWillDismiss` | Split into two bindings. Angular: `(balWillAnimate)="f($event)"` becomes `(dsWillPresent)="f($event)"` and `(dsWillDismiss)="f($event)"`. React: `onBalWillAnimate` becomes `onDsWillPresent` and `onDsWillDismiss`. HTML: add both `addEventListener` calls. Legacy emitted no detail, so the handler body needs no change. Report each split. |
| `balDidAnimate`  | `dsDidPresent` + `dsDidDismiss`   | Same handling, with `dsDidPresent` and `dsDidDismiss`.                                                                                                                                                                                                                                                                                          |
| `balChange`      | _(no equivalent)_                 | Do not rewrite or remove the handler. Legacy sent the new open state as a boolean, and `ds-popup` sends `{ trigger }` on four separate events, so the value a handler reads is gone. List each one by file and line as "event no longer emitted, needs manual rework", and name `dsDidPresent` and `dsDidDismiss` as the replacement pair.      |
| event `detail`   | `{ trigger }`                     | The new events carry the trigger element. Legacy `balWillAnimate` and `balDidAnimate` carried nothing. Mention each listener that now receives a detail it did not before.                                                                                                                                                                      |

Rewrite only handlers that are attached to the element being migrated. `balChange` is emitted by many other legacy components, so never rewrite a handler on another element, and never rename it by search and replace across the file.

### Methods

`present()`, `dismiss()` and `toggle()` keep their names, their signatures and their behaviour. There is nothing to rewrite. `setMinWidth()`, `_present()`, `_dismiss()` and `_emitChange()` were `@internal` on the legacy element and have no replacement. Do not rewrite or remove calls to them. List each call by file and line as "method no longer available, needs manual rework".

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild`, or holds the event handler, without ever naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `present()`, `dismiss()` and `toggle()` calls and for `balChange`, `balWillAnimate` and `balDidAnimate`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `bal-popup` trigger attribute renamed to `data-popup`, every `bal-popup-*` override moved onto the popup, every `active` renamed to `open`, every animate event split into its pair, and every dynamic binding left for the caller.

Also list each loss:

- every `variant="drawer"`, `variant="fullscreen"` and dynamically bound `variant`, with its file and line, left as legacy `bal-popup` and not migrated. Name `ds-drawer` and `ds-modal` with `fullscreen` as the targets, and say they are different elements with their own trigger wiring
- every popup with more than one trigger whose `bal-popup-*` attributes were left in place, with every trigger's file and line
- every dropped `reference`, `contentWidth` and `bal-popup-reference`
- every `balChange` handler, and every call to `setMinWidth()`, `_present()`, `_dismiss()` or `_emitChange()`
- every type reference such as `BalProps.BalPopupVariant` or `BalEvents.BalPopupChangeDetail` that the scan cannot see. These resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed. `@helvetia-design/core` does not export the matching `PopupPlacement` or `PopupRole` types yet

Also report these rendering and behaviour differences, so the consumer can check them. Do not add attributes or markup to compensate:

- **Visible title**: legacy rendered `label` as a visible heading above the content, with the close button beside it. `ds-popup` uses `label` only as the panel's `aria-label`, so the accessible name survives but nothing is shown. Do not build the heading markup. List each popup that sets `label` as needing a heading in its slot content.
- **Close button**: legacy only rendered it when `label` was set, because it lived in the title row. `ds-popup` renders it whenever `closable` is set.
- **Offset**: every popup without an explicit `offset` now sits 8px from its trigger, where legacy sat flush. Check spacing-sensitive layouts.
- **Focus**: `ds-popup` traps focus inside the panel when `backdrop` is set, because `trapFocus` follows `backdrop` by default. Legacy did not trap focus.
- **Test hooks**: the test ids `bal-popup-label`, `bal-popup-close` and `bal-popup-content` are gone, as is the non-standard `aria-presented` attribute on the host. `@baloise/ds-testing`'s `balPopupIsOpen` and `balPopupIsClosed` assert on `aria-presented` and break. `ds-popup` exposes `part="panel"`, `part="backdrop"`, `part="arrow"` and `part="close"`, and `data-testid="ds-popup-panel"` on the panel. Do not rewrite the tests. List each file.
- **Lost selectors**: `ds-popup` uses shadow DOM. The legacy classes `bal-popup`, `bal-popup__container`, `bal-popup__container--variant-*`, `bal-popup__arrow`, `bal-popup__backdrop`, `bal-popup__inner`, `bal-popup__inner__head` and `bal-popup__inner__content` are gone, as is the runtime trigger class `bal-popup-variant-popover-trigger`. The `bal-stack`, `bal-heading` and `bal-close` elements the legacy popup rendered were in the light DOM and are now encapsulated. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
