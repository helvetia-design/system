# footer

Migrate every `bal-footer` usage to `ds-app-footer`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder holds only `bal-footer`. It has no consumer child tags. It renders `bal-logo` and `bal-icon` inside its own tree, and those are migrated by their own tasks. The component is renamed. The old tag is `bal-footer`, the new tag is `ds-app-footer`.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-footer.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-footer` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-footer`)        | new (`ds-app-footer`)       | handling                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hideLanguageSelection`   | `hideLanguageSelection`     | Copy as-is, in every form (`hideLanguageSelection`, `[hideLanguageSelection]="x"`, `hideLanguageSelection={x}`).                                                                                                                                                                                                                                                      |
| `hideLinks`               | `disableDefaultLinks`       | Rename, keeping the value. Bare stays bare, `[hideLinks]="x"` becomes `[disableDefaultLinks]="x"`, `hideLinks={x}` becomes `disableDefaultLinks={x}`.                                                                                                                                                                                                                 |
| `showSocialMedia` set     | _(drop)_                    | Social links are on by default in `ds-app-footer`, so a static `showSocialMedia` or `showSocialMedia="true"` is removed. A dynamic value becomes the negation: `[showSocialMedia]="x"` becomes `[disableDefaultSocialLinks]="!(x)"` and `showSocialMedia={x}` becomes `disableDefaultSocialLinks={!(x)}`. Static `="false"` becomes bare `disableDefaultSocialLinks`. |
| `showSocialMedia` omitted | `disableDefaultSocialLinks` | The default flipped. `bal-footer` showed no social links, `ds-app-footer` shows the ones from config. Add `disableDefaultSocialLinks` (HTML), `[disableDefaultSocialLinks]="true"` (Angular), or `disableDefaultSocialLinks={true}` (React) so the footer renders as before. Report each file where this was added.                                                   |
| `logoBrand`               | _(no equivalent)_           | Drop it in every form. The brand now comes from the global config. Report each one.                                                                                                                                                                                                                                                                                   |
| `logoHref`, `logoSvg`     | _(no equivalent)_           | Drop it in every form. A custom logo is now markup in the `logo` slot. Do not build that markup. List each one by file and line as "needs manual rework".                                                                                                                                                                                                             |
| `overrideLinks`           | _(no equivalent)_           | Drop it in every form. Custom links are now `<a>` children in the `links` slot. Do not build them from the array. List each one by file and line as "needs manual rework".                                                                                                                                                                                            |
| _(none)_                  | `container`, `legalText`    | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                                                                                                                                 |

Children of `bal-footer` are default-slot content in both components. Leave them unchanged.

### Tags and imports

- **HTML**: `<bal-footer>` becomes `<ds-app-footer>`, including the closing tag.
- **Angular**: `<bal-footer>` becomes `<ds-app-footer>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalFooter` from `@baloise/ds-angular`, move only `BalFooter` to `import { DsAppFooter } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalFooter` with `DsAppFooter` in `imports:` lists too.
- **React**: `<BalFooter>` becomes `<DsAppFooter>` and `</BalFooter>` becomes `</DsAppFooter>`. Import `DsAppFooter` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalFooter` and leave the others on the `@baloise` import.

### Events

`bal-footer` emits no events. Its language select wrote straight to the global config. `ds-app-footer` emits `dsLanguageChange` and does not write to the global config. Add no handler. See Report.

## 4. Report

Print a per-file summary of what changed, including every `disableDefaultSocialLinks` that was added, every `showSocialMedia` that was dropped or negated, every `hideLinks` that was renamed to `disableDefaultLinks`, every dropped `logoBrand`, and every `logoHref`, `logoSvg`, and `overrideLinks` that needs manual rework.

Report these logic changes the scan cannot see, so the consumer can check them:

- **Language switch**: the legacy footer changed the app language itself when the user picked one. `ds-app-footer` only updates its own select and emits `dsLanguageChange` with `{ language }`. Every footer that is not hidden by `hideLanguageSelection` needs a `dsLanguageChange` handler (`(dsLanguageChange)` in Angular, `onDsLanguageChange` in React, `addEventListener('dsLanguageChange'` in HTML) that switches the app language. Do not write that handler yourself. List each footer file.
- **Logo**: the logo follows the global config brand. A footer that set `logoBrand` may show a different logo.

Also report the rendering differences, so the consumer can check them. Do not add attributes to compensate:

- `ds-app-footer` renders a legal text below the divider, taken from config by region and language, which `bal-footer` did not have. Set `legalText` yourself if it needs to change.
- Legal and social links come from the DS config, not from the legacy web-app-utils loader, so the link set and the regions it applies to can differ.
- `ds-app-footer` uses shadow DOM.

Also list every selector that targeted the legacy elements and that the scan cannot see. The legacy component set the classes `bal-footer`, `bal-footer__inner`, `bal-footer__slot`, and the other `bal-footer__*` parts, and the test id `bal-footer-language` on the language select. Tests and styles that query them break, and the new select uses `app-footer-language-select`. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
