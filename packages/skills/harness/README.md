# harness

Check scripts for verifying a `ds-migrate-from-baloise` run against a real consumer app. Used by the migration test runs tracked in #91 (React), #92 (Angular) and #93 (static HTML).

Nothing here is published: `files` in `package.json` lists only `dist/` and `skills/`.

These scripts must stay **outside** the app project root they check. The skill's own scanners read every source file below their root, so a check script containing the string `bal-card` would be counted as a finding in the app under test.

## `inventory.mjs`

Counts every Baloise reference in an app and classifies it. Run it against the baseline before a migration and against the migrated copy after; every occurrence must end up either rewritten to a `ds-*` counterpart or named in the skill's own report. Anything else is a miss.

It shares no code with `scan-migratable.mjs` or the `scan-bal-*.mjs` family, deliberately — a checker that reused the scanners it checks would inherit their blind spots and the skill would be grading itself. It is also deliberately dumb: one flat regex, no parsing, so what it misses is obvious rather than subtle.

```bash
node harness/inventory.mjs <app-path>                      # JSON report
node harness/inventory.mjs <app-path> --text               # human summary
node harness/inventory.mjs <app-path> --allow allow.json   # with an allowlist
node harness/inventory.mjs --diff before.json after.json   # what went, what stayed
```

### Categories

| category     | matches                                   | why it matters                                           |
| ------------ | ----------------------------------------- | -------------------------------------------------------- |
| `tag`        | `<bal-card>`, `<BalCard>`                 | the obvious case, and the one typecheck already catches  |
| `symbol`     | `BalCard`, `BalCardProps`                 | imports, type annotations, bundle arrays                 |
| `import`     | `@baloise/ds-react`, `@baloise/ds-styles` | package specifiers in source, CSS and `package.json`     |
| `handler`    | `onBalChange`, `onBalInput`               | **escapes typecheck** when passed via spread props       |
| `controller` | `balToastController`, `BalToastService`   | no tag to find, so tag-keyed scanning is blind to it     |
| `event`      | `balChange`, `balFocus`                   | listener name strings and Angular `(balChange)` bindings |

The last three are the point of this script. `tsc` cannot be relied on for them: excess-property checking does not apply to spread props, and in Angular or plain HTML templates a `(balChange)` binding on a `ds-*` element is invisible to any typecheck.

A hit whose line looks like a comment is flagged `inComment` but still counted — whether stale prose matters is the reader's call, not the script's.

### Allowlist

Some legacy identifiers are supposed to survive a migration. `components/popup/migration.md:85`, for example, says to leave a `balChange` handler on a migrated `ds-popup` in place and report it as "event no longer emitted, needs manual rework". Allowlist those, or the output becomes a list people learn to ignore.

```json
[
  {
    "file": "src/pages/Profile/ProfilePage.tsx",
    "match": "onBalChange",
    "reason": "ds-popup — popup/migration.md:85 says leave in place and report"
  }
]
```

Allowlisted hits still appear in `total`, but move from `leftover` into `allowed` and drop out of `byCategory`. An entry needs at least one of `file` or `match`; both together narrow it to that pairing.

### Typical run

```bash
node harness/inventory.mjs ../fake-baloise-app/react-baseline    > before.json
# …migrate the copy…
node harness/inventory.mjs ../fake-baloise-app/react-under-test  > after.json
node harness/inventory.mjs --diff before.json after.json
```

`remaining` is what survived the migration and `introduced` is anything that appeared during it — which should be empty, and is a defect if it is not.
