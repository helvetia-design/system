# Issue Tracker — GitHub Issues

## Overview

Issues for the Helvetia Design System are tracked in **GitHub Issues** in the [helvetia-design/system](https://github.com/helvetia-design/system) repository.

## Creating Issues

Use the GitHub web interface to create issues. When opening a new issue:

1. **Title**: Clear, concise description of the problem or feature
2. **Description**: Provide context:
   - For bugs: steps to reproduce, expected vs. actual behavior
   - For features: use case, acceptance criteria
3. **Labels**: Apply relevant labels (see `docs/agents/triage-labels.md`)
4. **Assignees**: Assign to team members if known
5. **Project**: Add to the design system project board if applicable

Agents never create issues directly — 🗺️ `issue-manager` drafts them with `ds-issue-write` and posts after a human gate.

Auditing a rewritten `ds-*` component against its LTS `bal-*` equivalent: create the issue from [component-audit.md](component-audit.md).

## Labels & Triage

The 🗺️ `issue-manager` agent uses labels to move issues through a state machine. See `docs/agents/triage-labels.md` for the canonical label vocabulary and how agents interact with them.

## Accessing Issues

**CLI:**

```bash
gh issue list                           # List all open issues
gh issue view <issue-number>            # View issue details
gh issue create                         # Create new issue
gh issue close <issue-number>           # Close an issue
```

**Web:**

- https://github.com/helvetia-design/system/issues

## Pull Requests

PRs are opened against the `main` branch and require:

- All CI checks passing (lint, test, build)
- At least one approval
- A changeset entry (unless docs-only or infrastructure)

See [ARCHITECTURE.md](../ARCHITECTURE.md#release-and-versioning) for release workflow details.
