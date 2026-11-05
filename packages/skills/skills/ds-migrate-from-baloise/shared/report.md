# Report file

Every Report step of this skill writes to one file, `ds-migration-report.md` at `<project-root>`. Init, every component migration, the **CSS utils** step and the **Assets** step each append one section to it. The file stays in the consumer's repository, so a reviewer reads it next to the diff, long after the chat is gone. `SKILL.md` and every component file point here for their Report step.

## File

If `ds-migration-report.md` does not exist, create it with this header:

```markdown
# Helvetia migration report

ds-migrate-from-baloise appends one section per run. Review it together with the diff.
```

After that, only append. Add each new section at the end of the file. Never edit, reorder or delete an earlier section, even when the same component runs again.

Leave the file unstaged, like every other change this skill makes. Do not run `git add` or `git commit`.

## Section

Each run appends one section. Take the date from `date +%F`.

```markdown
## <YYYY-MM-DD> components: select

### Needs your attention

- `src/pages/x.tsx:42`: `typeahead` rewritten to `searchable`. Check the search behaviour.

### Coverage checklist

- [x] 1. Every `typeahead` rewritten to `searchable`: 1 found, see above
- [x] 2. Every option with child elements: none found
- [x] 3. Every option whose `label` and slotted text conflict: 2 found, `src/a.tsx:10`, `src/b.tsx:20`

### Files changed

- `src/pages/x.tsx`: 3 `bal-select` and 5 `bal-select-option` tags rewritten
```

The section title names the step: `<date> init`, `<date> components: <name>`, `<date> css-utils` or `<date> assets`.

**Needs your attention** lists every line that needs a decision or an action from the consumer, each with file and line. When there is none, write `None.`

**Coverage checklist** proves that every check ran. See Checklist below.

**Files changed** is the per-file summary. It has one line per file this run edited, with what changed in it.

Init has no checklist. In place of **Coverage checklist** it writes `### Setup`, with the resolved version, every alias written, and the install command it ran.

## Attention or coverage

Ask one question for every line: does it need a decision or an action from the consumer?

- Yes: write it under **Needs your attention** in the file, and show it in chat.
- No: write it to the file only. This covers a line that only proves a check ran, and a note with nothing to do now.

When unsure, treat the line as needing attention. A skipped item costs more than one extra line in chat.

## Checklist

The Report step of every component file ends with a numbered list of items. Some need attention when found, the rest are coverage only. When the run also follows `shared/field.md`, its items follow the component items with an `F` prefix: `F1.`, `F2.`, and so on. When the run also follows `shared/icons.md`, its items come next with an `I` prefix: `I1.`, `I2.`, and so on. The items of `shared/legacy-config.md` come last with an `L` prefix: `L1.`, `L2.`, and so on. The **CSS utils** step has only the items of `shared/css-utils.md`, with a `U` prefix: `U1.`, `U2.`, and so on.

Write one checklist line per numbered item, with the same number, in the same order. Never merge two items into one line, and never skip one. Each line has one outcome:

- `- [x] <n>. <item>: none found` when the check found nothing.
- `- [x] <n>. <item>: <N> found, <file>:<line>, ...` when it found something. When **Needs your attention** already lists the instances, write `<N> found, see above`.
- `- [x] <n>. <item>: noted` for a one-time note that applies to this run.
- `- [x] <n>. <item>: not applicable, <reason>` for a conditional or framework-specific note that does not apply to this run.
- `- [ ] <n>. <item>: not checked, <reason>` when the check could not run. Also list that item under **Needs your attention**.

A `bal-*` instance that this run leaves in place on purpose, because it has no `ds-*` equivalent, always names its file and line in the outcome. A later run can read the file and see that the instance was checked and left by design.

The Report step is not done while any numbered item lacks its line.

## Chat

A component, Assets or CSS utils run shows only the **Needs your attention** lines in chat, in full. When there are none, it says `Nothing needs your attention.` Then it ends with exactly one pointer line:

```text
Full coverage checklist written to ds-migration-report.md: <N> items checked, <M> found.
```

`<N>` is the number of `[x]` lines. `<M>` is the number of lines whose outcome is `<count> found`. A `noted` or `not applicable` line does not count toward `<M>`. When any line is `[ ]` not checked, append `, <K> not checked` before the final period, where `<K>` is the number of those lines:

```text
Full coverage checklist written to ds-migration-report.md: <N> items checked, <M> found, <K> not checked.
```

Init has no checklist. It shows its whole short section in chat: the attention lines, Setup, and Files changed. Then it ends with exactly this line:

```text
Report written to ds-migration-report.md.
```
