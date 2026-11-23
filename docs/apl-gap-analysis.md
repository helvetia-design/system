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

## Progress

| #   | Component                | Analysed                 |
| --- | ------------------------ | ------------------------ |
| 1   | Autocomplete             | [below](#1-autocomplete) |
| 2   | Border                   | pending                  |
| 3   | Card Swiper              | pending                  |
| 4   | Header Twenty            | pending                  |
| 5   | List                     | pending                  |
| 6   | Popover                  | pending                  |
| 7   | Progress Spinner/Spinner | pending                  |
| 8   | Section                  | pending                  |
| 9   | Select Box               | pending                  |
| 10  | Slider                   | pending                  |
| 11  | Snackbar                 | pending                  |
| 12  | Teaser Button            | pending                  |

---

## 1. Autocomplete

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
