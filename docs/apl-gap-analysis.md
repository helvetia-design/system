# APL → Design System Gap Analysis

Working document for [#322](https://github.com/helvetia-design/system/issues/322).

12 App Pattern Library (APL) components are marked **"Partially available"** in the Confluence
[Component Mapping and Estimation](https://helvetia-baloise.atlassian.net/wiki/spaces/GROUPTEHDS/database/970743502)
database. This document lists, per component, what is missing and what we recommend.

**Severity:** `Blocker` = nothing in the DS does this · `Gap` = a DS primitive could be extended ·
`Partial` = a DS building block exists but isn't wired up · `Have it` = already covered ·
`Don't copy` = the APL behaviour is broken.

Notes say **"apps only"** where a feature is used in real applications but is not shown on the APL
demo page. Those are scope decisions, not oversights.

**Every component below starts with a TL;DR.** Read those four lines first; the rest is the evidence
behind them.

## Progress

| #   | Component                | Analysed                 |
| --- | ------------------------ | ------------------------ |
| 1   | Autocomplete             | [below](#1-autocomplete) |
| 2   | Border                   | [below](#2-border)       |
| 3   | Card Swiper              | pending                  |
| 4   | Header Twenty            | pending                  |
| 5   | List                     | pending                  |
| 6   | Popover                  | pending                  |
| 7   | Progress Spinner/Spinner | pending                  |
| 8   | Section                  | [below](#8-section)      |
| 9   | Select Box               | pending                  |
| 10  | Slider                   | [below](#10-slider)      |
| 11  | Snackbar                 | pending                  |
| 12  | Teaser Button            | pending                  |

---

## 1. Autocomplete

**TL;DR — build a new `ds-autocomplete`.** The Design System has nothing like it, and neither
`ds-input` nor `ds-select` is the right home for it. A working POC proved it needs no new design
tokens, but it is the third hand-written dropdown list in the Design System, so a shared list piece
should be extracted underneath. Remote search, which person and address lookup rely on, is a second
phase with its own design input.

**Recommendation: build a new `ds-autocomplete` component.** The Design System has no equivalent
today, and neither existing component is the right home for it: a select has a closed set of values
by definition, so letting `ds-select` accept free text would break the one promise it makes, and an
autocomplete is not a text field with a setting but a text field plus a panel, a list and keyboard
navigation, which `ds-input` would have to carry into every form in every app. `ds-autocomplete`
should therefore be a sibling that reuses what already exists: `ds-input`'s field shell, label, hint
and error handling, plus `ds-select`'s panel styling, texts and clear button.

Why not extend each of them:

| Component                | Why not                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ds-select` (searchable) | Looks right, but the user types inside the panel instead of in the field, and the value must be one of the options. Free text is exactly what a select is not for.                                                                                           |
| `ds-input`               | A panel engine in `ds-input` is paid for by every email and password field. With a panel open the element also has to report itself to screen readers as a combobox, not a text field. And `autocomplete` is already a prop there, meaning browser autofill. |

The Design System already answers this question the same way twice: `ds-phone-input` and
`ds-datepicker` are both a text field plus a panel, and both are separate components that reuse the
input's field shell rather than props on `ds-input`.

### Isn't building our own too much work?

`ds-select` uses a third-party library called [slim-select](https://www.npmjs.com/package/slim-select)
(`4.6.2`, wrapped in `select.picker.ts`), and the APL uses Angular Material. The fair concern is that
a dropdown is a lot of work, so we should stay on a library. Three things argue against that here.

**The hard part is partly solved, but not where we need it.** The genuinely difficult piece of any
dropdown is placement: opening upwards when there is no room below, staying attached while the page
scrolls, avoiding the screen edges. `ds-popup` already does this with `@floating-ui/dom`. The catch,
found while building the POC: no form field in the Design System uses `ds-popup` for its dropdown.
`ds-select` uses slim-select, `ds-datepicker` uses air-datepicker, and `ds-phone-input` positions a
plain element with CSS. See [What the POC showed](#what-the-poc-showed).

**We have already built most of an autocomplete, twice.** `ds-phone-input` is a text field with a
filterable dropdown: a search field, a list, keyboard navigation, an active-option marker for screen
readers and a "no results" state. That is the bulk of the work, already shipped — and
[ADR-0023](adr/0023-ds-phone-input-bespoke-country-picker.md) records that it deliberately did not use
slim-select. So this would be the third one, which is an argument for extracting shared code, not for
avoiding the component.

**What is actually new is small:**

| Need                                           | Status                                            |
| ---------------------------------------------- | ------------------------------------------------- |
| Field, label, hint, error, required marker     | `ds-input` — have it                              |
| Panel placement and screen-edge handling       | floating-ui is shipped, but unused by form fields |
| Panel styling, "no results" text, clear button | `ds-select` — have it                             |
| Debounce                                       | `ds-input` — have it                              |
| Keyboard navigation in the list                | written twice, needs extracting                   |
| Combobox screen-reader semantics               | **new**                                           |
| Filtering, bold matching text, async loading   | **new**                                           |

**The select route has a cost too.** `ds-select` is used in nearly every app. Allowing free text
changes what its value can be for every existing consumer — a breaking change with a wide blast
radius. A new sibling component changes nothing that exists today.

**Open: one spike before deciding.** slim-select does have a feature for accepting typed values, so it
may be possible to keep it inside `ds-autocomplete` and drive it from the field. That has not been
tested. Half a day would settle it with evidence.

Worth noting: the APL used Material and still ended up with no component — three hand-written examples
and six empty styling files. The library did not save that work.

### What the POC showed

To replace guesswork with evidence we built a working `ds-autocomplete` MVP: a text field with a
filtered suggestion panel, bold matching text, keyboard navigation, screen-reader combobox semantics,
a clear button, a "no results" state, and free text. It is on branch
[`poc/ds-autocomplete`](https://github.com/helvetia-design/system/tree/poc/ds-autocomplete), not on
`main`. It needed **no new design tokens** — the panel reuses the existing `--ds-select-*` ones.

**It confirmed the recommendation.** Three things define the component, and each one is the opposite of
how a select works: the cursor never leaves the text field, the submitted value is whatever was typed,
and filtering runs on the field text rather than on a second search box inside the panel. Making
slim-select do all three means replacing how it handles focus and values, not configuring it.

**It also revealed a problem we did not see from reading the code.** The suggestion panel had to be
written by hand, because nothing shared exists to build it from:

| Component             | How its dropdown is built           |
| --------------------- | ----------------------------------- |
| `ds-select`           | slim-select (third-party)           |
| `ds-datepicker`       | air-datepicker (third-party)        |
| `ds-phone-input`      | by hand                             |
| `ds-autocomplete` POC | by hand                             |
| `ds-popup`            | floating-ui — used by no form field |

So the POC is the **third** hand-written dropdown list in the Design System, and roughly 110 of its 600
lines are near-identical to `ds-phone-input`: moving the highlighted option with the arrow keys, the
mouse handlers, the "no results" row, hiding the panel from assistive tech. The styling repeats too —
`ds-autocomplete` and `ds-phone-input` each declare their own panel background, shadow, border, radius
and option states, and both already borrow `--ds-select-*` tokens to do it.

**Recommendation: extract a shared internal listbox primitive** (panel plus option list plus keyboard
navigation) and move `ds-phone-input` and `ds-autocomplete` onto it. Either as a reusable piece on its
own, or by making `ds-popup` usable from inside another component. Today a bug in keyboard navigation
has to be fixed in three places. This is an argument for building the component and tidying up
underneath it — not for skipping the component.

**One gap is bigger than the others: async options.** The POC takes a fixed list of suggestions, and
that shape cannot express remote search. Remote search is not "the same list, fetched later" — it
brings a request per keystroke, cancelling requests that are no longer relevant, a loading state in the
panel, a failure state, a minimum number of characters before searching, and the question of who owns
the filtering (the server does, so the component must stop filtering locally). Applications rely on
this today for person and address lookup. **It is a second phase, with its own design input** — see
open question 4. The MVP should not pretend to cover it.

APL page: [/theme-demo/autocomplete](https://www.helvetia.com/corp/app-patternlibrary/theme-demo/autocomplete) ·
Used by: All · Confluence currently says _"Normal Text Input component > not needed"_, which does not
hold.

### Gaps

| #   | What's missing                   | Severity     | Note                                                                                         |
| --- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| 1   | Free text plus suggestion panel  | `Blocker`    | `ds-select` can only hold one of its options.                                                |
| 2   | Typing happens in the field      | `Blocker`    | `ds-select` puts the search box inside the panel, so you click, then type somewhere else.    |
| 3   | Combobox screen-reader semantics | `Blocker`    | `ds-popup` can be a listbox but moves focus into the panel. Focus must stay in the field.    |
| 4   | Async / remote options           | `Blocker`    | Apps only. Person search and address lookup. A second phase of its own, see the POC section. |
| 5   | Keyboard navigation in the list  | `Gap`        | Confirmed by the POC as the third hand-rolled one. Extract a shared listbox primitive.       |
| 6   | Bold the matching text           | `Gap`        | All three demos do this.                                                                     |
| 7   | Two-line options                 | `Gap`        | Demo page shows a title plus a smaller second line. DS options are a single text label.      |
| 8   | Extra row at the bottom of panel | `Gap`        | APL: _"Fahrzeug nicht gefunden? Manuell erfassen"_.                                          |
| 9   | Panel width and max height       | `Gap`        | No DS setting for either. One demo lists 68 options.                                         |
| 10  | Icons in options                 | `Gap`        | Apps only. Person search shows a person-type icon. Not on the demo page.                     |
| 11  | Minimum characters before open   | `Gap`        | Apps only. 2 characters in apps, 1 in a demo, none elsewhere.                                |
| 12  | "No results" message             | `Gap`        | Apps only. DS has the text, but only inside `ds-select`'s own panel.                         |
| 13  | Show label, submit a code        | `Gap`        | Apps only. `ds-input` submits exactly what is shown.                                         |
| 14  | Loading indicator in the panel   | `Partial`    | `ds-input loading` shows a spinner in the field. APL shows nothing at all.                   |
| 15  | Clear button                     | `Have it`    | `ds-select clearable`, or the shared `ClearButton`.                                          |
| 16  | Invalid state and error message  | `Have it`    | `invalid` / `invalidText`, filled in automatically from Angular form errors.                 |
| 17  | Label, hint, optional marker     | `Have it`    | `label`, `description`, `required`.                                                          |
| 18  | Debounce                         | `Have it`    | `ds-input debounce`. APL uses 300ms in apps.                                                 |
| 19  | Multi-select with chips          | `Gap`        | On the APL Chips page, not the autocomplete page. Scope question, see below.                 |
| 20  | Grouped options                  | `Gap`        | Also only on the Chips page. `ds-select` already supports groups.                            |
| 21  | Announce how many results        | `Don't copy` | The APL never announces this. Needed for WCAG 2.2 AA, so it is added scope.                  |
| 22  | Clear button label               | `Don't copy` | APL label is unevaluated code, so screen readers read the translation key out loud.          |
| 23  | Errors linked to the field       | `Don't copy` | APL app wrapper styles errors red but assistive tech never sees them.                        |
| 24  | Safe text highlighting           | `Don't copy` | APL injects unescaped HTML into options. Use `<mark>` instead.                               |

### Open questions for design

1. Does the component submit what the user typed, or the id of a chosen option? The demo page says
   typed text, the app wrapper says id. These are two different components.
2. How much can an option contain? One line of text, or a title plus a second line, or any content at
   all? The demo page needs the second line. Allowing any content means options become nested
   elements instead of a simple list, which cannot be changed later without breaking consumers.
3. Is multi-select with chips part of this component, or a separate one?
4. Are the "apps only" rows in scope? Applications already rely on them, but they are not shown on
   the APL demo page.
5. Is the extra action row at the bottom of the panel part of the component?

### Worth knowing

- **`ds-input` has an `autocomplete` prop, but it is not this.** It is the browser autofill attribute
  (values like `cc-number`, `street-address`). Any dropdown comes from the browser, cannot be styled,
  and shows only data the browser already saved. `autocomplete="on"` renders nothing. This is most
  likely why the Confluence row concluded a text input was enough.
- **`<ux-ng-select-autocomplete>` in the APL is not an autocomplete.** It is a select with a search
  box. Despite the name it belongs with Select Box (#9), not here.
- **Replacing the APL app wrapper is a breaking change.** It takes a form control as an input and
  writes to it directly, including a magic "invalid" value. Every person and address screen depends on
  that. There are also no behavioural tests for autocomplete in the APL at all.
- **The APL has no autocomplete component of its own.** The demo page is three hand-written Angular
  Material examples, and all six APL autocomplete styling files are empty.

### Proposed Confluence row

| Column            | Value                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Status**        | Partially available (unchanged)                                                                                          |
| **APL Component** | None — the page is plain Angular Material, with no APL styling                                                           |
| **DS Component**  | None — nearest are `ds-input` (field) and `ds-select searchable` (options only)                                          |
| **Category**      | Form                                                                                                                     |
| **Description**   | Text input with a panel of filtered suggestions. Not covered by Text Input. Recommend a new `ds-autocomplete` component. |
| **Effort Figma**  | To be set once question 2 is answered                                                                                    |
| **Effort Code**   | To be set once questions 1, 3 and 4 are answered                                                                         |

### Sources

**Design System** — `forms/input/input.tsx` (`autocomplete:204`, `:571`, `label:140`,
`description:147`, `loading:161`, `debounce:225`, `required:293`) ·
`forms/input/field.util.tsx` · `forms/input/clear-button.util.tsx` ·
`forms/select/select.tsx` (`searchable:205`, `clearable:212`) · `forms/select/select.interfaces.ts` ·
`forms/select/select.picker.ts` (`:147-148`) · `forms/select/select.host.scss:32-71` ·
`overlays/popup/popup.tsx` (`:331`, `:355`, `:397`, `:446`) ·
`forms/phone-input/phone-input.tsx:833-858` · `packages/angular/src/forms/value-accessor.ts` ·
[ADR-0023](adr/0023-ds-phone-input-bespoke-country-picker.md)

**APL** (`osui-ux-ng-material`, Angular + Material 22.1.8) —
`demo-ux-ng-material-theme/autocomplete/**` (demo page and its three examples) ·
`ux-ng-material-theme/overwrites/autocomplete/**` (all 6 files empty) ·
`ux-ng-material-common/.../autocomplete/ux-ng-autocomplete.component.{ts,html}` ·
`ux-ng-material-common/.../ux-ng-person-search/ux-ng-person-search.component.html` (icons, no-results) ·
`ux-ng-material-library/.../pipe/highlight.pipe.ts` ·
`demo-ux-ng-material-theme/chips/demo-code/chips-autocomplete-demo-code.component.{ts,html}`

---

## 2. Border

**TL;DR — nothing to build.** The APL border page is five rounded-corner helper classes, and the
Design System has a matching class for every one of them plus more. The status should move from
"Partially available" to "Available".

**Recommendation: close this one — it is already covered.** The Confluence row says it itself: not a
component, use design tokens. The APL border page documents five rounded-corner helper classes, and
the Design System has an equal or better class for every one of them. Nothing to build, in code or in
Figma.

APL page: [/theme-demo/border](https://www.helvetia.com/corp/app-patternlibrary/theme-demo/border) ·
Used by: All · Confluence estimate: none

### Gaps

| #   | What's missing                      | Severity     | Note                                                                                                                                                                         |
| --- | ----------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Square corners                      | `Have it`    | APL `uxngm-border-radius--none` → DS `radius-none`. Same result.                                                                                                             |
| 2   | Slightly rounded corners (4px)      | `Have it`    | APL `--normal` → DS `radius`. Both 4px.                                                                                                                                      |
| 3   | Strongly rounded corners (12px)     | `Have it`    | APL `--large` → DS `radius-lg`. Both 12px.                                                                                                                                   |
| 4   | Pill shape                          | `Have it`    | APL `--rounded` → DS `radius-rounded`. Both 9999px.                                                                                                                          |
| 5   | Circle                              | `Have it`    | APL `--circle` uses 50%. DS has no 50% class, but `radius-rounded` draws the same circle on a square element. Only differs on a non-square element, where 50% gives an oval. |
| 6   | Rounding single corners or one side | `Have it`    | DS only. Seven classes per size, e.g. `radius-top-lg`, `radius-bottom-left`.                                                                                                 |
| 7   | Border lines (width, style, color)  | `Have it`    | DS only. `border`, `border-top-primary`, `border-danger`, `border-none`, per side, from tokens.                                                                              |
| 8   | Two extra corner sizes              | `Have it`    | DS only. `radius-xs` (2px) and `radius-md` (6px). The APL jumps 4px → 12px.                                                                                                  |
| 9   | Responsive and state variants       | `Have it`    | DS only. The utility classes take breakpoint and `hover:`/`focus:` prefixes.                                                                                                 |
| 10  | Colors named after paintbox colors  | `Don't copy` | The APL has ~40 `uxngm-border-color--*` classes per brand, named `mischka`, `pampas` (already deprecated). DS names colors by role: `border-grey`, `border-danger`.          |

### Open questions for design

1. Do we want an exact 50% corner class for non-square elements (an oval), or is the pill class
   enough? Nothing in the APL needs the oval today.
2. The status can move from "Partially available" to "Available" — needs a sign-off, not a decision.

### Worth knowing

- **No APL component uses the five helper classes itself.** They are there for applications to use,
  and applications live outside the APL repository, so we cannot say how often they are used.
- **The APL border page is about corners only.** Border lines are not documented there at all; the
  border color classes come out of each brand's color palette file. DS covers both in one place.
- **DS generates these classes from the tokens**, so a token change updates every class. The APL
  values are hard-coded pixels in a stylesheet.

### Proposed Confluence row

| Column            | Value                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Status**        | Available (was: Partially available)                                                  |
| **APL Component** | None — five helper classes for rounded corners                                        |
| **DS Component**  | None needed — `radius-*` and `border-*` CSS utility classes                           |
| **Category**      | Design Tokens                                                                         |
| **Description**   | Corner rounding and border lines. Covered by DS utility classes. No component needed. |
| **Effort Figma**  | 0 — tokens exist                                                                      |
| **Effort Code**   | 0                                                                                     |

### Sources

**Design System** — `packages/styles/src/preset/rules/radius.ts` (7 classes per radius token) ·
`packages/styles/src/preset/rules/border-color.ts` (shorthand per side, width helpers) ·
`packages/tokens/tokens/Base.tokens.json` (`🔗 Alias › 🔵 Radius`: None, XS, Base, MD, LG, Rounded ·
`🔗 Alias › ▭ Border`: Color, Width, Style, Composite) ·
`packages/styles/src/preset/variants/responsive.ts`

**APL** (`osui-ux-ng-material`) — `ux-ng-material-theme/overwrites/border/border.scss` (all five
classes) · `ux-ng-material-theme/overwrites/border/theme/*.scss` (5 brands) ·
`demo-ux-ng-material-theme/border/border-demo.component.html` (the documented list) ·
`ux-ng-material-theme/theme/*/colors.scss` (`uxngm-border-color--*`)

---

## 8. Section

**TL;DR — no new component needed.** An APL section is a width-limited box with an optional grey
background and an optional title, and `.ds-container` plus a background class plus `ds-heading`
already cover all of it. The one decision: does this become a documented page pattern (our
recommendation) or a real `ds-section` component?

**Recommendation: no new component — use `.ds-container` with a background class.** An APL section is
a width-constrained box with an optional grey background and an optional title, and the Design System
already has each of those parts. The one thing not to copy is how the APL stretches a section to the
full window width.

APL page: [/library-demo/section](https://www.helvetia.com/corp/app-patternlibrary/library-demo/section) ·
Used by: unknown · Confluence estimate: 0.25

### Gaps

| #   | What's missing                          | Severity     | Note                                                                                                                                                                                                      |
| --- | --------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Centered, width-limited content         | `Have it`    | DS is **ahead**: `.ds-container` centers and caps the width, with `is-fluid` and `is-compact`. The APL section does neither — it relies on whatever wraps it.                                             |
| 2   | Side padding that follows the screen    | `Have it`    | `.ds-container` reads a device token. The APL hard-codes 30px.                                                                                                                                            |
| 3   | A grey background on the section        | `Partial`    | Background classes exist (`bg-grey-light`, `bg-grey`) but `.ds-container` has no background setting. Today: put the class on the element yourself.                                                        |
| 4   | Padding that comes with the background  | `Partial`    | The APL adds 30px only when a background is set. `.ds-container` has no vertical padding, so you add `py-md` by hand. Works, but easy to forget.                                                          |
| 5   | A section title                         | `Partial`    | `ds-heading` renders it, but nothing ties title and section together, so the space below the title is up to the page. The APL fixes it at 20px.                                                           |
| 6   | Full-window-width background band       | `Don't copy` | The APL uses `margin: 0 -50vw` with `padding: 0 50vw`, which causes sideways scrolling when a scrollbar is present. Correct pattern: a full-width wrapper with the background, `.ds-container` inside it. |
| 7   | A real `<section>` element              | `Partial`    | `.ds-container` is a class, so put it on `<section>` directly. Note a `<section>` without a name is not a landmark for screen readers — the APL never gives one.                                          |
| 8   | Backgrounds named after paintbox colors | `Don't copy` | `mischka`, `iron`, `pampas` — and `pampas` is already deprecated and silently maps to `mischka`. DS names backgrounds by role.                                                                            |

### Open questions for design

1. Is "section" a component we want at all, or a documented page pattern (wrapper + background class +
   `.ds-container`)? Our recommendation is the pattern.
2. If it should be a component: does it own the title, the background and the vertical padding, or only
   the background band?
3. How many background options does a section get? The APL offers two greys. DS has far more, and
   unrestricted choice is how pages drift apart.
4. Should the vertical padding be fixed to the background, as in the APL, or chosen per page?

### Worth knowing

- **The APL section is 40 lines of markup and CSS**, three inputs and no behaviour. There is no state,
  no keyboard handling and no accessibility work in it.
- **`.ds-container` already does the hard part** — centering, max width, and side padding that follows
  the screen size, which the APL does not do.
- **The 0.25 estimate looks right** if the answer to question 1 is "a documented pattern". It is low if
  a real component with a title slot and padding rules is wanted.
- **We cannot tell how widely it is used.** Consumers live outside the APL repository, no other APL
  component builds on it, and the Confluence "Used by" column is empty. Someone with that knowledge
  should fill it in before the status changes.

### Proposed Confluence row

| Column            | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Status**        | Available (was: Partially available) — pending the answer to question 1              |
| **APL Component** | `ux-ng-section` + `ux-ng-section-title`                                              |
| **DS Component**  | None needed — `.ds-container` + a `bg-*` class + `ds-heading`                        |
| **Category**      | Layout                                                                               |
| **Description**   | Groups elements in a width-limited box. Use `.ds-container` with a background class. |
| **Effort Figma**  | 0.25 — document the pattern, not a new component                                     |
| **Effort Code**   | 0 as a pattern. Re-estimate if a `ds-section` component is wanted instead.           |

### Sources

**Design System** — `structure/container/container.style.scss` (`.ds-container`, `is-fluid:37`,
`is-compact:41`, side padding from `--ds-device-container-space:19`) ·
`packages/styles/src/preset/rules/background.ts` (`bg-*`, `text-on-*`) ·
`packages/styles/src/preset/rules/spacing.ts` (`py-*`) · `structure/heading` ·
`packages/tokens/tokens/Base.tokens.json` (`🔗 Alias › 🗃️ Container › Width`: Modal, Compact, Default)

**APL** (`osui-ux-ng-material`) —
`ux-ng-material-library/src/lib/ux-ng-section/ux-ng-section.component.ts` (`backgroundColor`,
`sectionTitle`, `fullwidth`) · `ux-ng-section.component.html` · `ux-ng-section.component.scss`
(30px padding, 20px below the title, the `-50vw` trick) ·
`ux-ng-material-theme/overwrites/section/**` · `demo-ux-ng-material-library/section/**`

---

## 10. Slider

**TL;DR — keep `ds-slider`, add four settings.** Tick marks, a switch for the value bubble, labels at
both ends of the track, and hiding the filled part. All four are already supported by the library
`ds-slider` is built on, so this is settings and styling rather than new machinery. Two scope
questions are open: two-handle range sliders, and showing a formatted value instead of the number.

**Recommendation: keep `ds-slider` and add four settings.** Unlike Autocomplete, both sides exist and do
the same job, so this is a short list of missing options rather than a decision about a new component.
Everything missing is already supported by the library `ds-slider` is built on, so these are settings
and styling, not new machinery.

This is also the counter-example to the Autocomplete discussion, and worth putting next to it: here we
did stay on a third-party library (noUiSlider `15.8.1`), the APL stayed on Material, and the result is
the two implementations differ by four cosmetic options. The library question is not the deciding
factor — whether the component matches the platform is.

APL page: [/theme-demo/slider](https://www.helvetia.com/corp/app-patternlibrary/theme-demo/slider) ·
Used by: DiBe · Confluence estimate: 0.5

### Gaps

| #   | What's missing                       | Severity     | Note                                                                                              |
| --- | ------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| 1   | Tick marks along the track           | `Gap`        | On by default in the APL demo. noUiSlider calls them "pips" and already supports them.            |
| 2   | Switch the value bubble on or off    | `Gap`        | APL can pin the bubble open or hide it. DS always shows it, but only while dragging or focused.   |
| 3   | Labels at each end of the track      | `Gap`        | The APL demo prints min and max beside the track by hand. Not a Material feature either.          |
| 4   | Hide the filled part of the track    | `Gap`        | APL ships a helper class for this. DS always fills from the start to the handle.                  |
| 5   | A fixed width                        | `Partial`    | APL sets a pixel or percentage width inline. DS fills its container, which is usually better.     |
| 6   | Show something other than the number | `Gap`        | Apps only. The one real APL slider holds a list position and displays a Swiss franc amount.       |
| 7   | Two handles for a range              | `Gap`        | Material and noUiSlider both support it. The APL never uses it. Scope question.                   |
| 8   | Label, hint, error, optional marker  | `Have it`    | DS is **ahead**: a Material slider cannot sit in a form field, so the APL demo fakes the label.   |
| 9   | Disabled state                       | `Have it`    | Both have it, but see gap 15 for how the APL draws it.                                            |
| 10  | Minimum, maximum and step size       | `Have it`    | Including changing the step size at runtime, which the one real APL slider needs.                 |
| 11  | Keyboard operation                   | `Have it`    | Both support arrow keys.                                                                          |
| 12  | Form submission, reset, debounce     | `Have it`    | DS only. No APL equivalent.                                                                       |
| 13  | Brand colors on the filled track     | `Have it`    | DS only. Four brand colors. No APL equivalent.                                                    |
| 14  | Visible focus indicator              | `Don't copy` | The APL switches the focus ring off. Keyboard users cannot see where they are. Fails WCAG 2.2 AA. |
| 15  | Disabled drawn at 20% opacity        | `Don't copy` | Far below the contrast minimum. DS uses proper disabled tokens.                                   |
| 16  | Accessible name on the demo slider   | `Don't copy` | The demo points the name at an element that does not exist, so the slider is unnamed.             |
| 17  | Tick marks forced to white           | `Don't copy` | White at full opacity, so they vanish on the white card they are shown on.                        |

### One bug found on our side

`ds-slider` always tells screen readers that its handle is named by the field label and described by the
hint, but those two elements are only rendered when a `label` or `description` is actually set. A
`<ds-slider>` with no label therefore has a handle pointing at nothing, which means **no name at all**.
Putting `aria-label` on the element does not help either: it lands on the wrapper, not on the handle.

This matters beyond the APL comparison, because naming the handle with `aria-label` is exactly what the
one real APL slider does. It is a small fix and independent of any design decision below. Tracked as
[#350](https://github.com/helvetia-design/system/issues/350).

### Open questions for design

1. Tick marks: on by default, or opt-in? The APL demo page has them on, its basic example has them off.
2. Is the value bubble always visible, or only while the user is dragging or has focus? DS chose the
   second, the APL demo shows the first.
3. Are the min and max end labels part of the component, or left to the page?
4. Is a two-handle range slider in scope at all? Nothing in the APL uses one today.
5. Does the slider need to display something other than its own number — a currency amount, or a
   position in a list? This is the only item that changes the component's shape rather than adding an
   option.

### Worth knowing

- **The APL has no slider component of its own**, same as Autocomplete — it is plain Material. But
  unlike Autocomplete the theming here is real: one stylesheet and five brand variants, not empty
  files.
- **There is exactly one real slider in the whole APL**, a premium calculator in the CMS library. It
  needs a step size that changes at runtime, a name set via `aria-label`, and a formatted value
  displayed next to the slider rather than inside it. It is also the source of gaps 6 and 16.
- **Gaps 1 to 4 are all settings the underlying library already has.** That is why the 0.5 estimate
  looks right, provided range sliders and value formatting stay out of scope.
- **DS is the more complete component here.** It is form-associated, resets with the form, debounces,
  emits focus/blur/click, renders on the server, and derives its invalid state from Angular form
  errors. None of that exists on the APL side.

### Proposed Confluence row

| Column            | Value                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Status**        | Partially available (unchanged)                                                                    |
| **APL Component** | None — plain Angular Material with APL styling on top                                              |
| **DS Component**  | `ds-slider`                                                                                        |
| **Category**      | Form                                                                                               |
| **Description**   | Select a value from a range. `ds-slider` covers it; add tick marks, bubble control and end labels. |
| **Effort Figma**  | 0.5 — tick marks, bubble, end labels                                                               |
| **Effort Code**   | 0.5 for gaps 1 to 4. Separate estimate needed if questions 4 or 5 are answered yes.                |

### Sources

**Design System** — `forms/slider/slider.tsx` (`min:173`, `max:180`, `step:198`, `brandColor:147`,
`debounce:210`, `required:247`, `value:95`) · `forms/slider/slider.picker.ts`
(`connect: 'lower':101`, `tooltips: true:103`, `connectLabelToHandle:127-132`) ·
`forms/slider/slider.host.scss` (`.noUi-tooltip:165`, shown only on hover/active/focus `:188-191`) ·
`forms/input/field.util.tsx` (label rendered only when set `:55`, description `:81`) ·
[ADR-0007](adr/0007-ds-slider-nouislider.md) · [ADR-0010](adr/0010-ds-slider-change-commit.md)

**APL** (`osui-ux-ng-material`) —
`demo-ux-ng-material-theme/slider/slider-demo.component.html` (demo page, helper class documented) ·
`demo-ux-ng-material-theme/slider/demo-code/slider-configurable-demo-code.component.{html,ts}`
(tick marks, bubble, min/max labels, width, broken name) ·
`demo-ux-ng-material-theme/slider/demo-code/slider-default-demo-code.component.ts` ·
`ux-ng-material-theme/overwrites/slider/slider.scss` (focus ring removed, 20% disabled, white ticks) ·
`ux-ng-material-theme/overwrites/slider/theme/*.scss` (5 brand variants) ·
`ux-ng-material-cms/.../interactive-graphic/ux-ng-interactive-graphic-area-chart.component.html`
(the only real consumer)
