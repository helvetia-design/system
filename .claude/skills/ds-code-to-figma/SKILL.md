---
name: ds-code-to-figma
description: Push a Helvetia Design System component from code into the Figma component library — resolving props/variants/states to Figma variant properties bound to existing Figma variables (tokens), reusing existing Figma components for nested children.
---

# ds-code-to-figma

## Goal

Generate Figma components that accurately represent the existing Web Components and reuse existing design system resources.

The unit of work is a **family**: the documentation owner (the component with a Storybook page)
plus its sub-components (e.g. `ds-tabs` + `ds-tab` + `ds-tab-panel`). One run builds every set of
the family into the owner's one documentation frame — see
[`conventions/families.md`](conventions/families.md).

## Workflow

Each phase lives in its own file — read the current phase's file when you reach it, don't load
all eight up front. Each file opens with a "you are here" line naming what the prior phase must
have produced, and closes with an explicit `Next:` pointer to the following file.

1. [`PHASE-1-ANALYZE.md`](PHASE-1-ANALYZE.md) — read the component's code (props, anatomy,
   pseudo-states, text attributes) and resolve every value to a Figma design token, hard-stopping
   on anything that can't be resolved, then measures the component's sizes on the dev server and
   triages which ones Measurements shows. Writes the draft `<name>.figma.md`.
2. [`PHASE-2-PROPOSE.md`](PHASE-2-PROPOSE.md) — turn the draft into a concrete Figma
   variant-grouping proposal (variant vs. instance-swap vs. top-level split, grid sketch, 500-variant
   budget check) and get the user's explicit sign-off before anything is built.
3. [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md) — clone the component's category page (or just its documentation
   frame) from the `🗂️ Template / Category` Figma page and fill its header, then build the real
   Figma `COMPONENT_SET` inside that frame incrementally (the confirmed default variant first,
   then the rest as a labeled, fixed-grid set the user approves), then fill "🔀 Variations", the
   second section of the left column, right after Copy me (every `show <name>` layer turned on). Hard stop before Phase 4
   until every variation has its visual test snapshot.
4. [`PHASE-4-VALIDATE.md`](PHASE-4-VALIDATE.md) — read-only check of the built header, prop/state
   mapping, token bindings and set layout against the plan and template; writes
   `<name>.figma-validation.md` with a `pass` / `fail` / `blocked` verdict.
5. [`PHASE-5-REPAIR.md`](PHASE-5-REPAIR.md) — fix every `fail` check in place, then re-run Phase 4
   (max 3 iterations, then hard stop).
6. [`PHASE-6-DOCUMENT-COPY-ME.md`](PHASE-6-DOCUMENT-COPY-ME.md) — build "👉 Copy me", the first
   section of the left column.
7. [`PHASE-7-DOCUMENT-ANATOMY.md`](PHASE-7-DOCUMENT-ANATOMY.md) — build "📐 Anatomy", the
   section after Variations (the placeholder is deleted when the component has no `@part` tags).
8. [`PHASE-8-DOCUMENT-MEASUREMENTS.md`](PHASE-8-DOCUMENT-MEASUREMENTS.md) — build "📏 Measurements", the last section of
   the left column: a drawing, a sizes table and, for content-driven components, a behavior
   card; this is the last phase.

### Graph

```mermaid
flowchart TD
    classDef code fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef figma fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef human fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef phase fill:#f8fafc,stroke:#64748b,color:#0f172a,font-weight:bold

    Start(["Start: user names a component"]):::phase --> P1G

    subgraph P1G["Phase 1 — Analyze"]
        direction LR
        P1a["Read component code<br/>.tsx / .host.scss"]:::code --> P1anat["Extract anatomy from<br/>@part tags"]:::code
        P1anat --> P1anatC{{"User reviews<br/>anatomy list"}}:::human
        P1anatC --> P1b["Resolve design tokens<br/>(read-only Figma variables)"]:::figma
        P1b --> P1m["Measure sizes on the<br/>dev server, classify"]:::code
        P1m --> P1mC{{"User confirms<br/>measurements triage"}}:::human
        P1mC --> P1c["Write draft<br/>name.figma.md"]:::code
    end

    P1G --> P2G

    subgraph P2G["Phase 2 — Propose grouping"]
        direction LR
        P2a["Apply inline rules<br/>(conventions/content-selection-and-mitigations.md<br/>only if needed)"]:::code --> P2b["Draft variant grid sketch<br/>in name.figma.md"]:::code
        P2b --> P2v["Compute total variant count"]:::code
        P2v --> P2check{{"Count ≤500?"}}:::human
        P2check -->|over threshold| P2w["Hard stop: recommend<br/>mitigation by axis type"]:::code
        P2w --> P2x{{"User picks<br/>mitigation"}}:::human
        P2x --> P2v
        P2check -->|under threshold| P2c{{"User confirms<br/>the mapping"}}:::human
        P2c -->|approved| P2d["Optional: add a new<br/>rule to the Phase 2 table"]:::code
    end

    P2G --> P3G

    subgraph P3G["Phase 3 — Build"]
        direction LR
        P3a["Clone category page / frame<br/>from template + fill header"]:::figma -->|template layer, category copy<br/>or story ID missing| P3h(["Hard stop: ask user"]):::human
        P3a --> P3b["Build the<br/>default variant"]:::figma
        P3b --> P3c{{"User confirms default variant<br/>in Figma"}}:::human
        P3c -->|approved| P3d["Fan out + build labeled<br/>component set(s)"]:::figma
        P3d --> P3v["Fill Variations<br/>(show layers on)"]:::figma
        P3v --> P3f{{"User approves header,<br/>component set + Variations in Figma"}}:::human
        P3f -->|approved| P3e["Write the component key<br/>back to name.figma.md"]:::code
    end

    P3G --> P3s{{"Every variation<br/>snapshot exists?"}}:::human
    P3s -->|no| P3sh(["Hard stop: user runs<br/>/update-screenshots"]):::human
    P3s -->|yes| P4G

    subgraph P4G["Phase 4 — Validate"]
        direction LR
        P4a["Read nodes (read-only):<br/>header, mapping,<br/>tokens, layout"]:::figma --> P4b["Write<br/>name.figma-validation.md"]:::code
        P4b --> P4v{"Verdict?"}
    end

    P4v -->|fail| P5G
    P4v -->|blocked| P4h(["Hard stop: ask user about<br/>not-verified checks"]):::human
    P4v -->|pass| P6G

    subgraph P5G["Phase 5 — Repair"]
        direction LR
        P5a["Fix fail checks<br/>in place"]:::figma --> P5b["Append repair log"]:::code
        P5b --> P5r{"3 iterations or<br/>same error again?"}
    end

    P5r -->|no: re-validate| P4G
    P5r -->|yes| P5h(["Hard stop: report<br/>unresolved failures"]):::human

    subgraph P6G["Phase 6 — Copy me"]
        direction LR
        P6a["Instance Section (Default),<br/>insert one default-variant<br/>instance into the slot"]:::figma --> P6b{{"User confirms<br/>Copy me"}}:::human
    end

    P6G --> P7G

    subgraph P7G["Phase 7 — Anatomy"]
        direction LR
        P7a{{"Component has<br/>@part tags?"}}:::human -->|no| P7s(["Delete Anatomy<br/>placeholder"]):::figma
        P7a -->|yes| P7b["Build diagram +<br/>legend items"]:::figma
        P7b --> P7c{{"User confirms<br/>Anatomy"}}:::human
    end

    P7G --> P8G

    subgraph P8G["Phase 8 — Measurements"]
        direction LR
        P8a["Drawing + sizes table<br/>(+ behavior card)"]:::figma --> P8b{{"User confirms<br/>Measurements"}}:::human
    end

    P8G --> Done(["Done: component live in Figma"]):::phase
```

🔵 **code** — reads or writes a file in this repo (`.tsx`/`.scss`, `name.figma.md`, `CONVENTIONS.md`, test snapshots).
🟣 **figma** — a `use_figma`/`get_screenshot` call against the live Figma file.
🟡 **human** — a required stop-and-wait checkpoint; never assume approval and keep going.

The human checkpoints (Phase 1's anatomy review and measurements triage, Phase 2's mapping confirmation, Phase 3's
first-variant and documentation-frame approvals in Figma, and the Copy me / Anatomy / Measurements
confirmations in Phases 6–8) are the only _required_ stops. Phases 4–5 run on their own and stop
only on a `blocked` verdict or a repair hard stop. For the full list of every checkpoint and
hard-stop condition across all eight phases in one place, see [`DECISIONS.md`](DECISIONS.md).

## Rules

- **Never generate Code Connect mappings.**
- **Never invent a hardcoded value** — resolve every value to a Figma variable (design token).
- A hard stop (missing token, missing nested component mapping) is a stop-and-wait point, not a failure to work around — surface it and wait for the user's decision.
- Run on the documentation owner and build the whole family; a sub-component never runs alone (`conventions/families.md`).

## Instructions

Load `figma-use` alongside this skill before any `use_figma` call (mandatory per that skill's own
rule). Load `figma-generate-library` for its guidance on binding values to Figma variables and
reusing existing components, since the same discipline applies here.

## Prerequisites

- `figma.config.json` at the repo root must have a real `componentLibraryFileKey` (not the
  `REPLACE_WITH_FIGMA_FILE_KEY` placeholder). If it's still the placeholder, stop and ask the
  user for the file key before doing anything else.
- The target component must already exist in code (`packages/core/src/components/<category>/<name>/`).
- If the family uses a **nested component** (an independent DS component from another family, e.g.
  a button using an icon), the nested component's own `<child>.figma.md` must already exist and
  record a Figma component key. If it doesn't, stop and tell the user to run this skill on the
  nested component first — do not recreate it or fall back to a plain shape.
- **Sub-components** (same family folder, no Storybook page of their own) are the exception: they
  are not a prerequisite — this run builds them, per `conventions/families.md`.

## References

Read only the documentation needed for the task:

- [`CONVENTIONS.md`](CONVENTIONS.md) — cross-phase rules (category copy, no-lock, no assumed attributes), indexed by topic into
  [`conventions/`](conventions/) (tokens & props, content-selection & mitigations, page structure, Component Set
  rendering, general build mechanics).
- [`conventions/families.md`](conventions/families.md) — owner / sub-component resolution, lockstep
  phases, parent-set props, slots, anatomy and measurements for families (every phase).
- [`DECISIONS.md`](DECISIONS.md) — every checkpoint and hard-stop condition across all eight
  phases, in one place.
- `PHASE-1-ANALYZE.md` … `PHASE-8-DOCUMENT-MEASUREMENTS.md` — the full workflow, one file per phase (see
  "## Workflow" above).
- [`packages/tokens/CONTEXT.md`](../../../packages/tokens/CONTEXT.md) — token layers and naming.
- [`packages/core/CONTEXT.md`](../../../packages/core/CONTEXT.md) — component categories and
  structure.
- [`examples/mapping-file-format.md`](examples/mapping-file-format.md) — code to figma mapping format.

## Validation

- All applicable styles must use design tokens.
- Nested components and sub-components must use instances of their own sets.
- Icon slots (`ds-icon` / `ds-brand-icon`) use one `INSTANCE_SWAP` property each.
- Report unresolved mappings.
- All Figma component keys must be written back to `<name>.figma.md` for future reference.

## Output

Provide:

- `<name>.figma.md` next to each family member's `.tsx` — one per member (owner and every
  sub-component).
- `PHASE-2-PROPOSE.md`'s mapping table, `CONVENTIONS.md` and `conventions/*.md` are updated only when the user approves a new rule addition.
- Created Figma component — documentation frames and component set
- Validation results — `<name>.figma-validation.md` (Phase 4, with the Phase 5 repair log)
- Unresolved issues
