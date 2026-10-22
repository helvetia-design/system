# snackbar

Migrate every `bal-snackbar` usage to `ds-snackbar`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-snackbar` only. Leave slotted content in place. `bal-close`, `bal-icon` and `bal-button` are drawn inside the legacy snackbar and are not consumer tags. `bal-notices` is not this component and stays unchanged.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-snackbar.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-snackbar` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

When a finding is in an Angular `x.component.html`, also open the `x.component.ts` with the same basename. The class often calls `close()` or `closeIn()` or listens for `balClose` without naming the tag, so the scan cannot see it.

### Props

| old (`bal-snackbar`)                                                  | new (`ds-snackbar`)      | handling                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subject`                                                             | `heading`                | Rename, keeping the value form (`subject="Saved"`, `subject={title}`, `[subject]="title"`). Legacy always drew an empty `<h2>`. `ds-snackbar` draws the `<h2>` only when `heading` is set.                                                                                                                                                                                                         |
| `message`                                                             | `message`                | Copy as-is. Legacy wrote `message` with `innerHTML`. `ds-snackbar` renders it as text, so markup in the string is visible as text. Mention each `message` that contains markup. Slotted children stay as children.                                                                                                                                                                                 |
| `color` omitted or `color=""`                                         | omit `color`             | Leave `color` unset.                                                                                                                                                                                                                                                                                                                                                                               |
| `color="primary"` / `"info"` / `"success"` / `"warning"` / `"danger"` | same                     | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms. `primary` is deprecated in favor of `info` in `ds-snackbar`. Do not rewrite it. Mention each `primary`.                                                                                                                                                                                                                          |
| `color` not a string literal                                          | leave the expression     | Do not guess a runtime color. Say in the summary that `primary`, `info`, `success`, `warning` and `danger` are the accepted values.                                                                                                                                                                                                                                                                |
| _(always shown)_                                                      | `closable`               | Legacy always drew the close control and had no prop for it. `ds-snackbar` defaults `closable` to `false`. HTML and Angular: write `closable="true"`. React: write `closable`. On a declarative element the close control only emits `dsCloseClick` and does not hide the element, so the consumer must handle it (set `visible` to `false` or remove the node). Mention each added close control. |
| `icon`                                                                | `icon`                   | Copy as-is. Legacy names are `bal-icon` names (for example `info-circle`). `ds-icon` names differ, so mention each `icon` for manual checking. Do not translate names.                                                                                                                                                                                                                             |
| `icon` omitted                                                        | omit `icon`              | Leave `icon` and `svg` unset. `ds-snackbar` derives `information`, `check`, `alert` or `bell` from `color`. Legacy drew an info mark when no color was set, so the default icon is now a bell. Mention that once in the summary.                                                                                                                                                                   |
| `action`                                                              | `action`                 | Copy as-is. The legacy action button only rendered when `action` was set, and so does the new one.                                                                                                                                                                                                                                                                                                 |
| `href`                                                                | `actionHref`             | Rename, keeping the value form.                                                                                                                                                                                                                                                                                                                                                                    |
| `target`                                                              | `actionTarget`           | Rename, keeping the value form.                                                                                                                                                                                                                                                                                                                                                                    |
| `href` set and `target` omitted                                       | `actionTarget="_self"`   | Legacy `target` defaulted to `_self`. `actionTarget` defaults to `_blank`. Add `actionTarget="_self"` so the link opens where it used to. Mention each addition.                                                                                                                                                                                                                                   |
| `duration`                                                            | _(no equivalent)_        | Delete the attribute. `ds-snackbar` has no `duration` prop, so a declarative `duration` is ignored and the snackbar never closes itself. Mention each removed `duration` and say that `dsSnackbarController.create({ duration })` is the replacement.                                                                                                                                              |
| `closeHandler`, `actionHandler`                                       | same                     | Copy as-is. Both now receive the snackbar id. Legacy was `() => void`. Mention each handler.                                                                                                                                                                                                                                                                                                       |
| _(none)_                                                              | `svg`, `actionIcon`      | New props. Nothing to migrate from. Leave them unset. The `action` slot is also new and stays unused.                                                                                                                                                                                                                                                                                              |
| `closeIn(duration)`                                                   | _(no equivalent method)_ | Delete the call. `ds-snackbar` has no `closeIn`. Mention each call.                                                                                                                                                                                                                                                                                                                                |
| `close()`                                                             | `close()`                | Keep the call. Legacy removed the element. `ds-snackbar` `close()` emits `dsCloseClick` and calls `closeHandler(alertId)`. It does not remove the element. Mention each call.                                                                                                                                                                                                                      |

### Tags and imports

- **HTML**: `<bal-snackbar>` becomes `<ds-snackbar>`, including the closing tag.
- **Angular**: `<bal-snackbar>` becomes `<ds-snackbar>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalSnackbar` from `@baloise/ds-angular`, move only `BalSnackbar` to `import { DsSnackbar } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import.
- **React**: `<BalSnackbar>` becomes `<DsSnackbar>` and `</BalSnackbar>` becomes `</DsSnackbar>`. Import `DsSnackbar` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSnackbar` to `import { DsSnackbar } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import. The generated `DsSnackbar` wrapper is deprecated. JSX still rewrites to `DsSnackbar`. Say in the summary that presenting a snackbar from code should use `useSnackbar` from `@helvetia-design/react`. Do not rewrite JSX into that hook.

### Controller and service

`bal-snackbar.controller.ts` exports `balSnackbarController`, `BalSnackbarController` and `BalSnackbarOptions`. Angular exports `BalSnackbarService`. `scripts/scan-bal-snackbar.mjs` lists those identifiers even when the file has no `<bal-snackbar>` tag. Detect does not. It counts `bal-snackbar` and `BalSnackbar` as `snackbar`. `BalSnackbarController` is a different slug, and `balSnackbarController` is not a tag, so a controller-only project is not suggested. Choose snackbar from Manual, then rewrite every listed file.

| old                                 | new                                          | handling                                                                                                                                                                                                                                |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balSnackbarController`             | `dsSnackbarController`                       | Import `dsSnackbarController` from `@helvetia-design/core`. When the `@baloise/ds-core` import binds other symbols, move only the snackbar symbols.                                                                                     |
| `BalSnackbarController`             | `AlertController`                            | Type only. Import `AlertController` from `@helvetia-design/core`. There is no `DsSnackbarController` class.                                                                                                                             |
| `BalSnackbarOptions`                | `Alert`                                      | Import `Alert` from `@helvetia-design/core`. Apply the option rows below.                                                                                                                                                               |
| `BalSnackbarService`                | `DsSnackbarService`                          | Import `DsSnackbarService` from `@helvetia-design/angular`. It has `create`, `dismiss(id)` and `dismissAll`. The service defaults `closeHandler` and `actionHandler`, so on its `create` calls add only `heading` and `closable: true`. |
| `create(options)`                   | `await dsSnackbarController.create(options)` | Legacy `create` returned the element. `create` now returns `Promise<string \| undefined>`, the snackbar id. Await it. Callers that used the element must keep the id and call `remove(id)`. Mention each call.                          |
| `dismissAll()` / `clearAll()`       | `removeAll()`                                | On `dsSnackbarController`. On `DsSnackbarService`, `dismissAll()` stays.                                                                                                                                                                |
| `setQueue()`                        | _(no equivalent)_                            | Delete the call. There is no queue-limit API. Mention each call.                                                                                                                                                                        |
| `animated`, `container`             | _(no equivalent)_                            | Drop both from the options object. They configured `bal-notices`, which `dsSnackbarController` does not use. Mention each drop.                                                                                                         |
| `subject` on `create`               | `heading`                                    | Rename. `Alert.heading` is a required string. When `subject` was omitted, write `heading: ''`. Do not invent title text. Mention each call.                                                                                             |
| `icon` on `create`                  | _(no equivalent)_                            | Drop it. `Alert` has no `icon` or `svg`. The icon now comes from `color`. Mention each drop.                                                                                                                                            |
| `closable` omitted on `create`      | `closable: true`                             | Same as the prop row. Add it on `DsSnackbarService.create` too, where `closable` is optional and defaults to `false`. Mention each added close control.                                                                                 |
| `duration` on `create`              | `duration`                                   | Copy as-is. A positive number auto-dismisses, and `0` or `'infinite'` stay open. An omitted `duration` also stays open for snackbars, as in legacy, so add nothing.                                                                     |
| `closeHandler` omitted on `create`  | `closeHandler: () => undefined`              | The container calls `closeHandler(id)` on close. A missing handler throws. Skip this on `DsSnackbarService`. When the call already passes `closeHandler`, keep it and mention that it now receives the id.                              |
| `actionHandler` omitted on `create` | `actionHandler: () => undefined`             | Required by `Alert`. Skip this on `DsSnackbarService`.                                                                                                                                                                                  |
| `message` on `create`               | `message`                                    | Copy as-is. Markup in the string is text. Mention each one that contains markup.                                                                                                                                                        |

### Events

| old            | new             | handling                                                                                                                                                                                                                                                                                                     |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `balClose`     | `dsCloseClick`  | Rewrite `addEventListener('balClose'` to `addEventListener('dsCloseClick'`. Angular: `(balClose)` becomes `(dsCloseClick)`. React: `onBalClose` becomes `onDsCloseClick`.                                                                                                                                    |
| `balAction`    | `dsActionClick` | Rewrite `addEventListener('balAction'` to `addEventListener('dsActionClick'`. Angular: `(balAction)` becomes `(dsActionClick)`. React: `onBalAction` becomes `onDsActionClick`.                                                                                                                              |
| event `detail` | see handling    | Legacy `balClose` and `balAction` detail was the snackbar id string. `dsCloseClick` detail is `undefined`, because `close()` emits without an argument. `dsActionClick` detail is the `MouseEvent`. The id is the argument to `closeHandler` and `actionHandler`. Mention each listener that reads `detail`. |
| _(none)_       | `dsDidLoad`     | New internal event. Nothing to migrate from. Leave it unset.                                                                                                                                                                                                                                                 |

Rewrite `balClose` and `balAction` listeners only on a migrated element. Both names are emitted by other legacy components, so never rewrite a listener on an element you did not migrate. The scan does not list a file that only listens and never uses `bal-snackbar`, `BalSnackbar`, `balSnackbarController`, `BalSnackbarController`, `BalSnackbarOptions` or `BalSnackbarService`.

## 4. Report

Print a per-file summary of what changed, including every added close control (for a declarative element, say that the consumer must hide or remove it on `dsCloseClick`), every added `actionTarget="_self"`, every `icon` left for manual checking, every removed `duration`, every `message` whose markup is now text, every `color="primary"`, every deleted `closeIn`, every `close()` that no longer removes the element, every `closeHandler` or `actionHandler` that now receives the id, every `balClose` or `balAction` listener whose detail is no longer the snackbar id, every `create` that now returns an id, every dropped `animated`, `container`, `icon` or `setQueue`, and every `BalSnackbarService` replaced by `DsSnackbarService`.

Also report what the scan cannot see:

- Ambient type references `BalProps.BalSnackbar*`, `BalEvents.BalSnackbar*`, and `HTMLBalSnackbarElement`. Grep for them and rename by hand. The scan does list `Components.BalSnackbar`, because it matches the bare `BalSnackbar` symbol. Treat it as a type reference too.
- The role changed from `alertdialog` to `status`.
- Legacy `bal-snackbar__*` classes and `data-testid="bal-snackbar-close"` and `"bal-snackbar-action"` selectors no longer match, because `ds-snackbar` uses shadow DOM.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
