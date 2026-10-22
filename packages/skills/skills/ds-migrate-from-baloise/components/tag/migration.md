# tag

Migrate every `bal-tag` usage to `ds-tag`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one child, `bal-tag-group`. It is part of this migration and becomes `ds-tag-group`. Neither element has public methods.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-tag.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-tag` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping or is left in place and reported.

When a finding is in an Angular `x.component.html`, also open the `x.component.ts` with the same basename. The class often handles `balCloseClick` without naming the tag, so the scan cannot see it.

### Props

| old (`bal-tag`)                                                                                       | new (`ds-tag`)          | handling                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closable`, `disabled`, `invalid`                                                                     | same                    | Copy as-is, including the boolean attribute form and `[closable]="..."` / `closable={...}` bindings.                                                                                                                                                                      |
| `position` `left` / `center`                                                                          | same                    | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms. `ds-tag` also accepts `right`. Nothing to migrate.                                                                                                                                                      |
| `size` omitted or `size=""`                                                                           | omit `size`             | Leave `size` unset. Both render the base size.                                                                                                                                                                                                                            |
| `size="small"`                                                                                        | `size="sm"`             | Rewrite to the short value. Also rewrite `size='small'`, `size={"small"}` and `size={'small'}`.                                                                                                                                                                           |
| `size="medium"`                                                                                       | `size="md"`             | Same forms as above.                                                                                                                                                                                                                                                      |
| `size="large"`                                                                                        | `size="lg"`             | Same forms as above.                                                                                                                                                                                                                                                      |
| `size` not a string literal                                                                           | leave the expression    | Do not guess a runtime size. Say in the summary that `sm`, `md` and `lg` are the accepted values. `small`, `medium` and `large` still work in `ds-tag`, but log a deprecation warning.                                                                                    |
| `color` omitted or `color=""`                                                                         | omit `color`            | Leave `color` unset.                                                                                                                                                                                                                                                      |
| `color` `primary` / `info` / `success` / `warning` / `danger` / `purple` / `red` / `yellow` / `green` | same                    | Copy as-is, including the `'...'`, `{"..."}` and `{'...'}` forms.                                                                                                                                                                                                         |
| `color="grey"` / `color="blue"`                                                                       | omit `color`            | Delete the attribute. `ds-tag` has neither. Its default is the same primary text on grey surface that `grey` rendered, and `blue` had no style of its own in the legacy component. Mention each one. Do not pick `disabled`, it is a different look (white on dark grey). |
| `color` not a string literal                                                                          | leave the expression    | Do not guess a runtime color. Say in the summary that `primary`, `info`, `success`, `warning`, `danger`, `purple`, `red`, `yellow`, `green`, `disabled` and the `-dark` / `-light` variants of the colors (not for `primary` or the status colors) are accepted.          |
| `light` together with `color` `purple` / `red` / `yellow` / `green`                                   | `color="<color>-light"` | Merge the two: `color="purple" light` becomes `color="purple-light"`, and delete `light`. Keep the original quote form. Both the boolean `light` and `light="true"` count. `ds-tag` has no `light` prop.                                                                  |
| `light` with any other color, or without a color                                                      | _(no equivalent)_       | Delete the attribute. Legacy defined light styles only for `purple`, `red`, `yellow` and `green`, so it had no effect there. Mention each one.                                                                                                                            |
| `light` or `color` is a binding next to the other                                                     | leave both              | When either one is not a string literal, the two cannot be merged safely. Leave both attributes in place and report the element so the consumer picks the `-light` color by hand.                                                                                         |
| `transparent`                                                                                         | _(no equivalent)_       | Internal legacy prop. Delete the attribute and mention each one.                                                                                                                                                                                                          |

### Tags and imports

- **HTML**: `<bal-tag>` becomes `<ds-tag>` and `<bal-tag-group>` becomes `<ds-tag-group>`, including the closing tags. `bal-tag-group` has no props to map.
- **Angular**: the same tags rewrite in `.html` templates and in inline `template:` strings. When a file imports `BalTag`, `BalTagGroup` or `BalTagBundle` from `@baloise/ds-angular`, replace all of them with `import { DsTag, DsTagGroup } from '@helvetia-design/angular'`, listing only the symbols the file's templates now use. Leave the other symbols on the `@baloise` import. `BalTagBundle` was an array of both legacy classes. In an `imports:` list it becomes the same symbols.
- **React**: `<BalTag>` becomes `<DsTag>` and `</BalTag>` becomes `</DsTag>`. `<BalTagGroup>` becomes `<DsTagGroup>`. Import only the used symbols from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalTag` and `BalTagGroup` and leave the rest on the `@baloise` import.

### Events and methods

| old             | new            | handling                                                                                                                                                                                                           |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `balCloseClick` | `dsCloseClick` | Rewrite `addEventListener('balCloseClick'` to `addEventListener('dsCloseClick'`. Angular: `(balCloseClick)` becomes `(dsCloseClick)`. React: `onBalCloseClick` becomes `onDsCloseClick`.                           |
| event `detail`  | same           | Both versions emit the `MouseEvent` of the click as `detail`. Leave each handler body as it is. `ds-tag` renders the close button, and so emits `dsCloseClick`, only when `closable` is set and `disabled` is not. |
| methods         | _(none)_       | Neither `bal-tag` nor `ds-tag` has public methods.                                                                                                                                                                 |

`balCloseClick` is emitted only by `bal-tag`, so rewriting it never touches another component. The scan lists it, and the sibling `.ts` file, so a listener that never names the tag is still reached.

## 4. Report

Print a per-file summary of what changed, including every `light` merged into a `-light` color, every `size` rewritten to `sm` / `md` / `lg`, every deleted `color="grey"` and `color="blue"`, every deleted `light` and `transparent`, every `balCloseClick` listener renamed, and every import that changed.

Also report what was left in place:

- Elements whose `color`, `size` or `light` is a dynamic binding, with the accepted values named in the Props table.

Also report what the scan cannot see:

- Ambient type references `BalProps.BalTagColor`, `BalProps.BalTagSize`, `BalProps.BalTagPlacement`, `BalEvents.BalTagCloseClick*` and `HTMLBalTagElement`. Grep for them and rename by hand.
- Legacy `bal-tag`, `bal-tag__label` and `bal-tag__close` classes, `--bal-tag-*` custom properties and `data-testid="bal-tag-label"` / `data-testid="bal-tag-close"` selectors no longer match, because `ds-tag` uses shadow DOM. It exposes `part="label"` and the `--tag-*` custom properties instead.
- Legacy `bal-tag` set `aria-disabled` on its host when `disabled`. `ds-tag` reflects the `disabled` attribute and does not set `aria-disabled`. Selectors or tests on `aria-disabled` need updating.
- A `.bal-tag-group` class selector does not carry over to the shadow DOM `ds-tag-group`.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
