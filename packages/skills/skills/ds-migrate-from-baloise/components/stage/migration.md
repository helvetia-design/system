# stage (report only)

Report every `bal-stage` usage. This migration rewrites nothing. It lists every usage in `ds-migration-report.md` with the reason and the suggested replacement, so the consumer can rebuild the stage by hand.

No `ds-*` component replaces `bal-stage`. The legacy stage is a coloured page header section with an optional background image, a shape and a back link. Its props are `color`, `containerSize`, `shape`, `shapeRotation`, `shapeVariation` and `size`. It has five child tags: `bal-stage-back-link` (`href`, `inverted`, `rel`, `shadow`), `bal-stage-body`, `bal-stage-foot`, `bal-stage-head` and `bal-stage-image` (`fallback`, `srcSet`).

The scan lists the root, the five child tags, the React and Angular symbols `BalStage`, `BalStageBackLink`, `BalStageBody`, `BalStageFoot`, `BalStageHead` and `BalStageImage`, the Angular `BalStageBundle`, and `HTMLBalStage*Element` types. It does not match the ambient `BalProps.BalStage*` types. Search for them yourself in each file with a finding.

This migration edits no source file. `SKILL.md` says how the icon and legacy config rules apply to a report-only migration.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-stage.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count. Say that no `ds-*` component replaces `bal-stage`, and that the next step only writes report entries.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-stage` usages to report and stop.

## 2. Confirm

Ask for one yes/no: write a report entry for every listed usage? No source file is edited.

On no, stop with the files unchanged.

On yes, continue.

Done when the user has answered.

## 3. Rewrite

Nothing is rewritten. Every `bal-stage`, its child tags, its imports and its types stay as they are. For every finding, read the whole element and its children and collect what the report needs: the file and line, the props, and which child tags it uses.

### Suggested replacement

Rebuild the stage as a plain `<section>` with these `ds-*` building blocks, and ask the design team whether a stage component is planned:

- The text from `bal-stage-head` and `bal-stage-body` becomes `ds-heading` and `ds-text`.
- `bal-stage-image` becomes a native `<img>` or `<picture>`, built from `srcSet` and `fallback`.
- `shape` becomes a `ds-shape`, with `shapeVariation` and `shapeRotation` as its `variation` and `rotation`.
- `bal-stage-back-link` becomes a plain `<a>` with its `href` and `rel`.
- `color`, `size` and `containerSize` become the section's own styles. `ds-sheet` with `containerSize` covers the content width.

### Props and children

| old (`bal-stage`) | suggested `ds-*` building block | handling |
| --- | --- | --- |
| `color` | background on the `<section>` | Report it with its value. |
| `size` | padding on the `<section>` | Report it with its value. |
| `containerSize` | `ds-sheet` `containerSize` | Report it with its value. `ds-sheet` takes only `fluid` and `compact`. For `detail-page`, `blog-page`, `wide` or a dynamic value, say that `ds-sheet` has no such width and suggest the default width. |
| `shape`, `shapeVariation`, `shapeRotation` | `ds-shape` with `variation` and `rotation` | Report it with its values. |
| `bal-stage-head` | `ds-heading` | Report it. |
| `bal-stage-body` | `ds-text` or the section content | Report it. |
| `bal-stage-foot` | the section content | Report it. |
| `bal-stage-image` `srcSet`, `fallback` | native `<img srcset>` or `<picture>` | Report it with both values. |
| `bal-stage-back-link` `href`, `rel` | plain `<a>` | Report it. |
| `bal-stage-back-link` `inverted`, `shadow` | the link's own styles | Report it. |

### Tags and imports

- **HTML**: `<bal-stage>` and its children stay.
- **Angular**: the tags stay in the template, and `BalStage*` and `BalStageBundle` stay in the `@baloise/ds-angular` import and in `imports: [...]`.
- **React**: `<BalStage>` and its children stay, and their symbols stay in the `@baloise/ds-react` import.

While a `bal-stage` is left, **Detect** keeps suggesting `stage`, the legacy config call stays, and **Cleanup** stays `incomplete`. They clear once the consumer has rebuilt the stage and removed `bal-stage`.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Files changed lists no file, because this migration edits none. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `bal-stage`, not migrated. Name file and line, say that no `ds-*` component replaces it, give the suggested replacement from the Rewrite step, and say to ask the design team whether a stage component is planned.
2. Every `color`, `size` and `containerSize` value, with its suggested building block from the table.
3. Every `shape`, with its `shapeVariation` and `shapeRotation`, as a `ds-shape`.
4. Every `bal-stage-image`, with its `srcSet` and `fallback`.
5. Every `bal-stage-back-link`, with its `href`, `rel`, `inverted` and `shadow`.
6. Every `bal-stage-head`, `bal-stage-body` and `bal-stage-foot` outside a `bal-stage`, not migrated.
7. Every `BalStage*` symbol, `BalStageBundle` spread, `HTMLBalStage*Element` type and `BalProps.BalStage*` type. They stay until the rebuild and keep **Detect** and **Cleanup** listing `stage`.
8. Every selector in the project's own styles that targets `bal-stage` or a `bal-stage__*` class. It stops matching once the stage is rebuilt.
9. One-time note, when at least one `bal-stage` is left: **Cleanup** stays `incomplete` and the legacy config call stays until the consumer has rebuilt the stage by hand.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
