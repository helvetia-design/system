# snackbar

Migrate every `bal-snackbar` usage to `ds-snackbar`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-snackbar` only. Leave slotted content in place. `bal-close`, `bal-icon` and `bal-button` are drawn inside the legacy snackbar and are not consumer tags. `bal-notices` follows the Notices container section.

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

| old (`bal-snackbar`) | new (`ds-snackbar`) | handling |
| --- | --- | --- |
| `subject` | `heading` | Rename, keeping the value form (`subject="Saved"`, `subject={title}`, `[subject]="title"`). Legacy always drew an empty `<h2>`. `ds-snackbar` draws the `<h2>` only when `heading` is set. |
| `message` | `message` | Copy as-is. Legacy wrote `message` with `innerHTML`. `ds-snackbar` renders it as text, so markup in the string is visible as text. Report each `message` that contains markup. Slotted children stay as children. |
| `color` omitted or `color=""` | omit `color` | Leave `color` unset. |
| `color="primary"` / `"info"` / `"success"` / `"warning"` / `"danger"` | same | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms. `primary` is deprecated in favor of `info` in `ds-snackbar`. Do not rewrite it. Report each `primary`. |
| `color` not a string literal | see handling | Do not guess a runtime color. HTML: leave the expression. React and Angular: keep it when the expression's type only admits `primary`, `info`, `success`, `warning` or `danger`. Otherwise apply Unmapped props and handlers (`SKILL.md`). Report each one. `primary`, `info`, `success`, `warning` and `danger` are the accepted values. |
| _(always shown)_ | `closable` | Legacy always drew the close control and had no prop for it. `ds-snackbar` defaults `closable` to `false`. HTML and Angular: write `closable="true"`. React: write `closable`. On a declarative element the close control only emits `dsCloseClick` and does not hide the element, so the consumer must handle it (set `visible` to `false` or remove the node). Report each added close control. |
| `icon` | `icon` | Copy the value, then apply the icon name rule from `shared/icons.md`. |
| `icon` omitted | omit `icon` | Leave `icon` and `svg` unset. `ds-snackbar` derives `information`, `check`, `alert` or `bell` from `color`. Legacy drew an info mark when no color was set, so the default icon is now a bell. Report this once. |
| `action` | `action` | Copy as-is. The legacy action button only rendered when `action` was set, and so does the new one. |
| `href` | `actionHref` | Rename, keeping the value form. |
| `target` | `actionTarget` | Rename, keeping the value form. |
| `href` set and `target` omitted | `actionTarget="_self"` | Legacy `target` defaulted to `_self`. `actionTarget` defaults to `_blank`. Add `actionTarget="_self"` so the link opens where it used to. Report each addition. |
| `duration` | _(no equivalent)_ | Delete the attribute. `ds-snackbar` has no `duration` prop, so a declarative `duration` is ignored and the snackbar never closes itself. Report each removed `duration`. `presentSnackbar({ duration })` in React components and `dsSnackbarController.create({ duration })` elsewhere are the replacement. |
| `closeHandler`, `actionHandler` | same | Copy as-is. Both now receive the snackbar id. Legacy was `() => void`. Report each handler. |
| _(none)_ | `svg`, `actionIcon` | New props. Nothing to migrate from. Leave them unset. The `action` slot is also new and stays unused. |
| `closeIn(duration)` | _(no equivalent method)_ | Delete the call. `ds-snackbar` has no `closeIn`. Then apply the cleanup after row drops from "Unmapped props and handlers" in `SKILL.md` (unused declarations, emptied method). Report each call. |
| `close()` | `close()` | Keep the call. Legacy removed the element. `ds-snackbar` `close()` emits `dsCloseClick` and calls `closeHandler(alertId)`. It does not remove the element. Report each call. |

### Tags and imports

- **HTML**: `<bal-snackbar>` becomes `<ds-snackbar>`, including the closing tag.
- **Angular**: `<bal-snackbar>` becomes `<ds-snackbar>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalSnackbar` from `@baloise/ds-angular`, move only `BalSnackbar` to `import { DsSnackbar } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import.
- **React**: `<BalSnackbar>` becomes `<DsSnackbar>` and `</BalSnackbar>` becomes `</DsSnackbar>`. Import `DsSnackbar` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSnackbar` to `import { DsSnackbar } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import. The generated `DsSnackbar` wrapper is deprecated. JSX still rewrites to `DsSnackbar`. Do not rewrite JSX into the `useSnackbar` hook. That hook replaces imperative `balSnackbarController` calls only, which the controller rows below cover.

### Controller and service

`bal-snackbar.controller.ts` exports `balSnackbarController`, `BalSnackbarController` and `BalSnackbarOptions`. Angular exports `BalSnackbarService`. `scripts/scan-bal-snackbar.mjs` lists those identifiers even when the file has no `<bal-snackbar>` tag. Detect does not. It counts `bal-snackbar` and `BalSnackbar` as `snackbar`. `BalSnackbarController` is a different slug, and `balSnackbarController` is not a tag, so a controller-only project is not suggested. Choose snackbar from Manual, then rewrite every listed file.

| old | new | handling |
| --- | --- | --- |
| `balSnackbarController` in a React component or custom hook | `useSnackbar()` | **React, inside a function component or custom hook**: import `useSnackbar` from `@helvetia-design/react` and call `const [presentSnackbar, dismissSnackbar] = useSnackbar()` at the top level of the component. Rewrite `balSnackbarController.create(options)` to `void presentSnackbar(options)` and apply the option rows below. Move each property assigned on the returned element (`target`, `href`, `duration`) into the options object, renamed as the Props rows say: `target` becomes `actionTarget` and `href` becomes `actionHref`. When `href` is set and `target` is not, add `actionTarget: '_self'`, as the Props row does. Delete the element variable and its `if` guard. Rewrite `.close()` on the returned element to `dismissSnackbar()`. The legacy `balSnackbarController` has no `remove(id)`, so no call maps to `dismissSnackbar` by id. `dismissSnackbar()` takes no id and closes only the last snackbar presented through this hook. `presentSnackbar` is async and the hook stores the id after it resolves, so a `dismissSnackbar()` that runs earlier closes nothing. The hook registers `ds-alert-container` and `ds-snackbar`. Report each rewritten call, each `dismissSnackbar()` in a `useEffect` cleanup, and each component that presents more than one snackbar through one hook. |
| `balSnackbarController` elsewhere | `dsSnackbarController` | **React, outside components** (interceptors, services, plain modules, class components): hooks cannot run there, so import `dsSnackbarController` from `@helvetia-design/core`. Also import `defineCustomElement as defineDsAlertContainer` from `@helvetia-design/core/components/ds-alert-container.js` and `defineCustomElement as defineDsSnackbar` from `@helvetia-design/core/components/ds-snackbar.js`, and call both once at module scope. A bare controller import registers neither element. `create()` builds the alert host with `document.createElement('ds-alert-container')`, so the call throws `addAlert is not a function`. Keep the id where the code kept the element, in the same variable or class field, typed `string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | undefined`. Move each property assigned on the returned element into the options object, as in the hook row. In an `async`function, write`id = await dsSnackbarController.create(options)`. In any other function, write `void dsSnackbarController.create(options).then(value => (id = value))`and do not make the function`async`. Rewrite `.close()`on the old element to`if (id) void dsSnackbarController.remove(id)`. Report each module that got the `defineCustomElement`calls. **HTML**: import`dsSnackbarController`from`@helvetia-design/core`. **Angular**: call `DsSnackbarService`instead, see the`BalSnackbarService`row. Import`dsSnackbarController`directly only outside Angular DI, and then add the same`defineCustomElement`calls. When the`@baloise/ds-core` import binds other symbols, move only the snackbar symbols. |
| `BalSnackbarController` | `AlertController` | Type only. Import `AlertController` from `@helvetia-design/core`. There is no `DsSnackbarController` class. |
| `BalSnackbarOptions` | `Alert` | Import `Alert` from `@helvetia-design/core`. Apply the option rows below. |
| `BalSnackbarService` | `DsSnackbarService` | Import `DsSnackbarService` from `@helvetia-design/angular`. It has `create`, `dismiss(id)` and `dismissAll`. The service defaults `closeHandler` and `actionHandler`, so on its `create` calls add only `heading` and `closable: true`. |
| `create(options)` outside React components | `await dsSnackbarController.create(options)` | Legacy `create` returned the element. `create` now returns `Promise<string \| undefined>`, the snackbar id. Await it. Callers that used the element must keep the id and call `remove(id)`. On `DsSnackbarService`, keep `await this.snackbarService.create(options)` and call `dismiss(id)` instead of `remove(id)`. Inside a React component the hook row applies instead. Report each call. |
| `dismissAll()` / `clearAll()` | `removeAll()` | On `dsSnackbarController`. A React component has no hook equivalent, so call `dsSnackbarController.removeAll()` there with the imports from the outside-components row. On `DsSnackbarService`, `dismissAll()` stays and `clearAll()` becomes `dismissAll()`. |
| `setQueue()` | _(no equivalent)_ | Delete the call. There is no queue-limit API. Then apply the cleanup after row drops from "Unmapped props and handlers" in `SKILL.md` (unused declarations, emptied method). Report each call. |
| `animated`, `container` | _(no equivalent)_ | Drop both from the options object. They configured `bal-notices`, which `dsSnackbarController` does not use. Report each drop. |
| `subject` on `create` | `heading` | Rename. `Alert.heading` is a required string. When `subject` was omitted, write `heading: ''`. Do not invent title text. Report each call that got `heading: ''`. |
| `icon` on `create` | _(no equivalent)_ | Drop it. `Alert` has no `icon` or `svg`. The icon now comes from `color`. Report each drop. |
| `closable` omitted on `create` | `closable: true` | Same as the prop row. Add it on `DsSnackbarService.create` too, where `closable` is optional and defaults to `false`. Report each added close control. |
| `duration` on `create` | `duration` | Copy as-is. A positive number auto-dismisses, and `0` or `'infinite'` stay open. An omitted `duration` also stays open for snackbars, as in legacy, so add nothing. |
| `closeHandler` omitted on `create` | `closeHandler: () => undefined` | The container calls `closeHandler(id)` on close. A missing handler throws. Skip this on `DsSnackbarService`. When the call already passes `closeHandler`, keep it and report that it now receives the id. |
| `actionHandler` omitted on `create` | `actionHandler: () => undefined` | Required by `Alert`. Skip this on `DsSnackbarService`. |
| `message` on `create` | `message` | Copy as-is. Markup in the string is text. Report each one that contains markup. |

### React before and after

A snackbar opened in a `useEffect` and closed in its cleanup, before:

```tsx
import { balSnackbarController } from '@baloise/ds-core'

useEffect(() => {
  if (saved !== 'draft') {
    return
  }
  const snackbar = balSnackbarController.create({
    message: `Antrag ${draft.id} als Entwurf gespeichert.`,
    subject: 'Entwurf gesichert',
    icon: 'check',
    color: 'success',
    duration: 0,
    action: 'Zur Übersicht',
    actionHandler: () => setParam('step', applicationSteps[0].value),
  })
  if (snackbar) {
    snackbar.target = '_self'
  }
  return () => {
    void snackbar?.close?.()
  }
}, [saved])
```

After:

```tsx
import { useSnackbar } from '@helvetia-design/react'

const [presentSnackbar, dismissSnackbar] = useSnackbar()

useEffect(() => {
  if (saved !== 'draft') {
    return
  }
  void presentSnackbar({
    heading: 'Entwurf gesichert',
    message: `Antrag ${draft.id} als Entwurf gespeichert.`,
    color: 'success',
    duration: 0,
    closable: true,
    closeHandler: () => undefined,
    action: 'Zur Übersicht',
    actionTarget: '_self',
    actionHandler: () => setParam('step', applicationSteps[0].value),
  })
  return () => {
    void dismissSnackbar()
  }
}, [saved])
```

`useSnackbar` comes from `@helvetia-design/react`, and `balSnackbarController` leaves the `@baloise/ds-core` import. `subject` becomes `heading`. `icon` is dropped, because the icon comes from `color`. The property `snackbar.target` moves into the options object as `actionTarget`. `closable: true` and `closeHandler` are added because `Alert` requires them. `actionHandler` stays. The element variable and its `if` guard are gone, and `.close()` becomes `dismissSnackbar()`. Report the cleanup.

### Notices container

`bal-notices` was the legacy container for toasts and snackbars. `dsSnackbarController` creates its own `ds-alert-container`, so the app needs no container. The scan lists `<bal-notices>`, `</bal-notices>`, `BalNotices`, `defineBalNotices` and every import of `@baloise/ds-core/components/bal-notices.js`, under any alias.

- Delete a `<bal-notices>` element whose static `interface` is `snackbar`, including its closing tag. A `<bal-notices>` with a static `interface="toast"` follows the next bullet, so it goes only when no toast is left.
- A `<bal-notices>` with `interface="toast"`, without `interface` or with a bound `interface`, a `BalNotices` React element, every call of the `defineCustomElement` imported from `bal-notices.js` (any alias, such as `defineBalNotices()`), and that import go only when no toast is left. After this run's rewrite, run `node <this-skill-directory>/scripts/scan-bal-toast.mjs <project-root>`. When it lists no finding other than `bal-notices` ones, delete them. Otherwise keep them and report that they go with the toast migration.
- With the last deleted element, delete the `BalNotices` import specifier and its entry in Angular `imports`. Delete an import when no specifier is left on it.
- Delete a comment block directly above a deleted import or call when it only explains `bal-notices`.

### Events

| old | new | handling |
| --- | --- | --- |
| `balClose` | `dsCloseClick` | Rewrite `addEventListener('balClose'` to `addEventListener('dsCloseClick'`. Angular: `(balClose)` becomes `(dsCloseClick)`. React: `onBalClose` becomes `onDsCloseClick`. |
| `balAction` | `dsActionClick` | Rewrite `addEventListener('balAction'` to `addEventListener('dsActionClick'`. Angular: `(balAction)` becomes `(dsActionClick)`. React: `onBalAction` becomes `onDsActionClick`. |
| event `detail` | see handling | Legacy `balClose` and `balAction` detail was the snackbar id string. `dsCloseClick` detail is `undefined`, because `close()` emits without an argument. `dsActionClick` detail is the `MouseEvent`. The id is the argument to `closeHandler` and `actionHandler`. Report each listener that reads `detail`. |
| _(none)_ | `dsDidLoad` | New internal event. Nothing to migrate from. Leave it unset. |

`balClose` is emitted only by `bal-toast` and `bal-snackbar`, and `balAction` only by `bal-snackbar`. In each file that has a finding, rewrite a `balClose` listener when its target is a `bal-snackbar` element, including `addEventListener`. A target is a `bal-snackbar` element when a ref, `@ViewChild`, template variable or `querySelector` resolves to it. Leave a listener on the `bal-toast` element for that component's run. When the target cannot be resolved, for example `document`, `window`, a container or an untyped variable, do not rewrite the listener and report it. Rewrite every `balAction` listener in a file that has a finding, because only `bal-snackbar` emits it. The scan does not list a file that only listens and never uses `bal-snackbar`, `BalSnackbar`, `balSnackbarController`, `BalSnackbarController`, `BalSnackbarOptions` or `BalSnackbarService`.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every added close control. For a declarative element, say that the consumer must hide or remove it on `dsCloseClick`.
2. Every `icon` left for manual checking.
3. Every removed `duration`. A declarative snackbar no longer closes itself.
4. Every `message` whose markup is now text.
5. Every deleted `closeIn`. Also name every method left empty, flagged "now does nothing", with its callers.
6. Every `close()` that no longer removes the element.
7. Every `closeHandler` or `actionHandler` that now receives the id.
8. Every `balClose` or `balAction` listener whose detail is no longer the snackbar id.
9. Every `create` that now returns an id.
10. Every dropped `icon` on `create`. The icon now comes from `color`.
11. Every dropped `setQueue`. There is no queue-limit API. Also name every method left empty, flagged "now does nothing", with its callers.
12. Every ambient type reference `BalProps.BalSnackbar*` and `BalEvents.BalSnackbar*`. The scan cannot see them. Grep for them and rename by hand. It does list `HTMLBalSnackbarElement`. The scan does list `Components.BalSnackbar`, because it matches the bare `BalSnackbar` symbol. Treat it as a type reference too.
13. One-time note: the role changed from `alertdialog` to `status`.
14. Every legacy `bal-snackbar__*` class and `data-testid="bal-snackbar-close"` and `"bal-snackbar-action"` selector. They no longer match, because `ds-snackbar` uses shadow DOM.
15. Every `create` that got `heading: ''`.
16. One-time note: a snackbar without `icon` now shows a bell where legacy showed an info mark.
17. Every `color` that is not a string literal, with the framework outcome (left in HTML, kept or removed (Unmapped) in React and Angular). `primary`, `info`, `success`, `warning` and `danger` are the accepted values.
18. Every `dismissSnackbar()` in a `useEffect` cleanup that can run before `presentSnackbar` resolves. The notice then stays open.
19. Every component that presents more than one snackbar through one hook. `dismissSnackbar()` closes only the last one.
20. Every `balClose` listener left unchanged because its target is unknown.
21. Every `bal-notices` element, `BalNotices` element, `defineBalNotices()` call or `bal-notices.js` import kept because a toast is left. It goes with the toast migration.

Coverage only, written to the file:

22. Every added `actionTarget="_self"` and `actionTarget: '_self'`.
23. Every `color="primary"`.
24. Every dropped `animated` and `container`.
25. Every `BalSnackbarService` replaced by `DsSnackbarService`.
26. In React components, every `balSnackbarController` call rewritten to `useSnackbar`, naming the hook as the reason the alert host is registered.
27. Every module outside React components that got `defineCustomElement` calls for `ds-alert-container` and `ds-snackbar`.
28. Every `bal-notices` element, `BalNotices` element, `defineBalNotices()` call, `bal-notices.js` import and `bal-notices` comment block deleted.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
