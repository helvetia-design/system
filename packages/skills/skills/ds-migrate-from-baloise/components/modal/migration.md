# modal

Migrate every `bal-modal` usage to `ds-modal`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has three elements. `bal-modal` becomes `ds-modal`, `bal-modal-header` becomes `ds-modal-header`, and `bal-modal-body` becomes `ds-modal-body`. Leave slotted content in place, including legacy tags such as `bal-button`, `bal-stack`, and `bal-text`. Those belong to their own migrations. `bal-close` is drawn inside the legacy header and is not a consumer tag.

The scan also lists the imperative API: `balModalController`, `BalModalController`, `BalModalOptions` and, in Angular, `BalModalService`. It does not match the ambient `BalProps.BalModalSpace` type. That type resolves from the ambient namespaces and stops compiling once `@baloise/ds-core` is removed, so it is a Report item, not a rewrite.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-modal.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-modal` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls `present()`, `dismiss()` or handles an event without ever naming the tag. Open the same-basename `.ts` beside every `.html` finding and apply the mapping there too. This step is finished when every finding matches the mapping.

### Props

| old (`bal-modal`)                                       | new (`ds-modal`)    | handling                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isClosable`                                            | `closable`          | Rename the attribute and keep the value, including `[isClosable]` to `[closable]` and `isClosable={x}` to `closable={x}`. Both defaults are `true`.                                                                       |
| `modalWidth`                                            | `modalWidth`        | Copy as-is, including bindings. Both defaults are `640`.                                                                                                                                                                  |
| `space`                                                 | _(no equivalent)_   | Drop the attribute or binding. Mention each one. Legacy values were `small`, `medium` and `large`.                                                                                                                        |
| `hasBackdrop`                                           | _(no equivalent)_   | Drop it. `ds-modal` always renders its backdrop. Mention each one, especially `hasBackdrop="false"` and `hasBackdrop={false}`.                                                                                            |
| `backdropDismiss`                                       | _(no equivalent)_   | Drop it. In `ds-modal`, `closable` covers Escape, the close button and the backdrop click together. Mention each one, especially `backdropDismiss="false"`, which now closes on backdrop click when `closable` is `true`. |
| `focusTrap`                                             | _(no equivalent)_   | Drop it. The native `dialog` element handles focus. Mention each one.                                                                                                                                                     |
| `cssClass`                                              | _(no equivalent)_   | Drop it. `ds-modal` renders in shadow DOM, so a class on the host cannot reach the dialog. Mention each one.                                                                                                              |
| `component`, `componentProps`, `delegate`, `dataTestId` | _(none on the tag)_ | These are controller options and internal props, not tag attributes. Handle them in the controller table. Leave them if they appear on a tag, and mention each one.                                                       |
| _(none)_                                                | `open`              | New prop. Legacy opened through `present()` or the controller. Do not add `open` to a declarative tag. Leave it unset.                                                                                                    |
| _(none)_                                                | `fullscreen`        | New prop. Nothing to migrate from. Leave it unset.                                                                                                                                                                        |
| _(none)_                                                | `label`             | New prop for the dialog's accessible name. Legacy had no `label`. Do not invent text. Leave it unset and apply the controller rule below.                                                                                 |

`ds-modal-header` and `ds-modal-body` take no props. Copy any attribute on a legacy child as-is and mention it.

### Tags and imports

- **HTML**: `<bal-modal>`, `<bal-modal-header>` and `<bal-modal-body>` become `<ds-modal>`, `<ds-modal-header>` and `<ds-modal-body>`, including the closing tags.
- **Angular**: the same tags rewrite in `.html` templates and in inline `template:` strings. When a file imports `BalModal`, `BalModalHeader`, `BalModalBody`, or `BalModalBundle` from `@baloise/ds-angular`, replace them with `import { DsModal, DsModalHeader, DsModalBody } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Import only the symbols the file uses. `BalModalBundle` was an array of the three legacy classes. In an `imports:` list it becomes `DsModal, DsModalHeader, DsModalBody`. Rename the symbols in `imports: [...]` as well.
- **React**: `<BalModal>`, `<BalModalHeader>` and `<BalModalBody>` become `<DsModal>`, `<DsModalHeader>` and `<DsModalBody>`, and the closing tags follow. Import them from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only the modal symbols to `import { DsModal } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import. The generated `DsModal` wrapper is deprecated: it does not keep React `open` state in sync when the modal dismisses itself. JSX still rewrites to `DsModal`. Say in the summary that `Modal` from `@helvetia-design/react` is the preferred wrapper, with `onOpenChange`. Do not rewrite JSX into `Modal`.

### Controller and service

`bal-modal.controller.ts` exports `balModalController`, `BalModalController` and `BalModalOptions`. Angular exports `BalModalService`. `scripts/scan-bal-modal.mjs` lists those identifiers even when the file has no `<bal-modal>` tag. Detect does not. It counts `bal-modal` and `BalModal` as `modal`. `BalModalController` is a different slug, and `balModalController` is not a tag, so a controller-only project is not suggested. Choose modal from Manual, then rewrite every listed file.

| old                       | new                                       | handling                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balModalController`      | `dsModalController`                       | Import `dsModalController` from `@helvetia-design/core`. When the `@baloise/ds-core` import binds other symbols, move only the modal symbols.                                                                                                                                                              |
| `BalModalController`      | `ModalController`                         | Type only. Import `ModalController` from `@helvetia-design/core`.                                                                                                                                                                                                                                          |
| `BalModalOptions`         | `ModalOptions`                            | Import `ModalOptions` from `@helvetia-design/core`. Apply the option rows below.                                                                                                                                                                                                                           |
| `create(options)`         | `await dsModalController.create(options)` | Both return the `ds-modal` element. Rename `isClosable` to `closable`. Drop `space`, `hasBackdrop`, `backdropDismiss`, `focusTrap`, `cssClass`, `presentingElement`, `dataTestId` and `id` from an object literal, and mention each drop. `component`, `componentProps`, `delegate` and `modalWidth` stay. |
| `dismiss(data, role, id)` | `dismiss(id, data, role)`                 | The parameter order changed. Reorder the arguments, and mention each call. A call without `id` targets the first open `ds-modal`. Legacy rejected with `'overlay does not exist'` when no modal was open. `dismiss` now resolves quietly, and its result is `void`, not `boolean`.                         |
| `dismissAll(data, role)`  | `dismissAll()`                            | `dsModalController.dismissAll()` takes no arguments and dismisses without `data` or `role`. Drop the arguments, and mention each call that passed them.                                                                                                                                                    |
| `getTop()`                | _(no equivalent)_                         | Leave the call and mention it. There is no top-modal lookup.                                                                                                                                                                                                                                               |
| `BalModalService`         | `DsModalService`                          | Angular only. Import `DsModalService` from `@helvetia-design/angular` and rename the injected type. When the file's `@baloise/ds-angular` import binds other symbols, move only `BalModalService`.                                                                                                         |

#### Angular service calls

`DsModalService.create(component, componentProps, options)` takes positional arguments and returns a `DsModalRef`, not the element. Rewrite a `create` call only when its argument is an object literal:

```ts
// before
const modal = await this.modalService.create({
  component: MyComp,
  componentProps: { a: 1 },
  isClosable: false,
  modalWidth: 480,
})
// after
const ref = await this.modalService.create(MyComp, { a: 1 }, { closable: false, modalWidth: 480 })
```

Apply the option rows above to the third argument. Omit `componentProps` as `undefined` when only options follow. Do not rewrite a `create` whose argument is a variable, a spread, or a call. Leave it and report it with file and line.

Do not rewrite anything done with the returned value. The legacy value was an element and the new one is a `DsModalRef`. `ref.dismiss(data, role)`, `await ref.onDidDismiss()` and `await ref.onWillDismiss()` exist on the ref, but you cannot tell from a call site which variable holds the ref. Report every `.dismiss(`, `.onDidDismiss(` and `.onWillDismiss(` call that follows a `create`, and every `modalService.dismiss(` call. The service has no `dismiss`, and the ref is bound to its own modal.

#### Component modals

A `create` with `component` mounts that component into the `body` slot of `ds-modal`. Two things cannot be rewritten and must be reported for each such `create`:

- **No accessible name.** The `header` slot stays empty, and `ds-modal` has a `label` prop for exactly this case. Leave `label` unset and report the call. Suggest setting `label` in the options.
- **Header slot.** `ds-modal-header` sets `slot="header"` on itself, which only works as a direct child of `ds-modal`. A `bal-modal-header` inside the mounted component's template still becomes `ds-modal-header`, but it will not reach the header slot. Report each file with a `bal-modal-header` that belongs to a component opened by `create`.

### Events

| old                                      | new              | handling                                                                                                                                                                                                         |
| ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balModalWillPresent`                    | `dsWillPresent`  | Rewrite `addEventListener('balModalWillPresent'` to `addEventListener('dsWillPresent'`. Angular: `(balModalWillPresent)` becomes `(dsWillPresent)`. React: `onBalModalWillPresent` becomes `onDsWillPresent`.    |
| `balModalDidPresent`                     | `dsDidPresent`   | Same rewrite. React: `onBalModalDidPresent` becomes `onDsDidPresent`.                                                                                                                                            |
| `balModalWillDismiss`                    | `dsWillDismiss`  | Same rewrite. React: `onBalModalWillDismiss` becomes `onDsWillDismiss`.                                                                                                                                          |
| `balModalDidDismiss`                     | `dsDidDismiss`   | Same rewrite. React: `onBalModalDidDismiss` becomes `onDsDidDismiss`.                                                                                                                                            |
| event `detail` of the two dismiss events | `{ data, role }` | The shape is the same. Nothing to rewrite. The dismiss events bubble, so a listener on an ancestor also receives the events of overlays nested inside the modal. Mention each ancestor listener you come across. |

In each file that has a finding, also rewrite `balModal*` listeners that are not on the element, including `addEventListener`. The scan does not list a file that only listens and never uses `bal-modal`, `BalModal`, `balModalController`, `BalModalController`, `BalModalOptions`, or `BalModalService`.

### Methods

Do not rewrite these. Report each call with file and line.

- `dismiss(data, role)` on an element returned `Promise<boolean>`. `ds-modal` returns `Promise<void>`. Report every call whose result is read, such as `const ok = await modal.dismiss()` or `if (await modal.dismiss())`.
- `onDidDismiss()` and `onWillDismiss()` do not exist on `ds-modal`. In Angular they exist on `DsModalRef` only. In plain HTML, listen for `dsDidDismiss` and `dsWillDismiss` instead.
- `present()` keeps its name. Legacy `open()` and `close()` were internal. Report them if you come across a call.
- `role` values: legacy set `'model-close'` on the close button, a `modal-close` button and the backdrop click, and `'model-escape'` on Escape. `ds-modal` sets `'close'` for the close button, `'backdrop'` for the backdrop click and `'escape'` for Escape, so a comparison against the old strings never matches. Report every comparison against `detail.role` and name the new values. Do not rewrite them: `'model-close'` splits into two values.

### Buttons inside a modal

A legacy `bal-button` with the `modal-close` attribute closed the surrounding modal. `ds-button` has no such hook. In every file with a finding, search for `modal-close` and report each match with file and line. Do not rewrite it. The replacement is a click handler that calls `dismiss()`, and the actions belong in the `actions` slot.

## 4. Report

Print a per-file summary of what changed. End with the items below, each with file and line:

- every dropped `space`, `hasBackdrop`, `backdropDismiss`, `focusTrap` and `cssClass`, and every `backdropDismiss="false"` whose backdrop click now closes the modal
- every `create` with `component`, with the missing `label` and the header-slot caveat
- every `create` that was not rewritten because its argument is not an object literal
- every call on the returned value, every `modalService.dismiss(` and every `getTop()`
- every `dismiss` call with reordered arguments, and every `dismissAll` call that lost its arguments
- every read of the `dismiss` result, every `onDidDismiss()` and `onWillDismiss()` call on an element, and every `detail.role` comparison
- every `modal-close` attribute
- every `BalProps.BalModal*` type reference that needs a manual check
- every legacy selector that no longer applies, such as `.bal-modal__header`, `.bal-modal__body`, `.bal-modal__content`, `.bal-modal__container`, `.bal-modal__background`, `.data-test-modal-close` and the `aria-presented` attribute. `ds-modal` renders in shadow DOM, so these are lost. The dialog is styleable through `part="dialog"`, `part="close"`, `part="title"`, `part="body"` and `part="actions"`
- every `DsModal` in React, with the note that `Modal` is the preferred wrapper

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
