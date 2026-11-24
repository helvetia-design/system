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

**Every component below starts with a TL;DR.** Read those first; the rest is the evidence behind
them.

## Progress

| #   | Component                | Analysed                              |
| --- | ------------------------ | ------------------------------------- |
| 1   | Autocomplete             | [below](#1-autocomplete)              |
| 2   | Border                   | [below](#2-border)                    |
| 3   | Card Swiper              | pending                               |
| 4   | Header Twenty            | pending                               |
| 5   | List                     | pending                               |
| 6   | Popover                  | [below](#6-popover)                   |
| 7   | Progress Spinner/Spinner | [below](#7-progress-spinner--spinner) |
| 8   | Section                  | [below](#8-section)                   |
| 9   | Select Box               | [below](#9-select-box)                |
| 10  | Slider                   | [below](#10-slider)                   |
| 11  | Snackbar                 | [below](#11-snackbar)                 |
| 12  | Teaser Button            | pending                               |

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

---

## 6. Popover

**TL;DR — no new component, but one decision to make.** `ds-popup` already covers the click popover
and `ds-tooltip` / `ds-hint` cover the hover hint, which is exactly the pair Confluence points at.
The only real question is whether a popover should carry a color and an alert style, as the APL one
does. The APL's hover mode should not be copied: it opens on mouse only and cannot be read with a
keyboard.

**Recommendation: use `ds-popup` for click popovers and `ds-tooltip` or `ds-hint` for hover hints.**
Both exist, both are documented, and `ds-popup` is ahead of the APL on placement, focus handling and
dismissing. What is worth adding is a documented pattern for a popover with a title and a
`ds-notification` inside it, which is how the APL's title and alert styles are better expressed.

APL page: [/library-demo/popover](https://www.helvetia.com/corp/app-patternlibrary/library-demo/popover) ·
Used by: All · Confluence estimate: 0.5 · Confluence already references both a popup and a tooltip
hint as the counterparts, which matches this recommendation.

### Gaps

| #   | What's missing                           | Severity     | Note                                                                                                                                               |
| --- | ---------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A panel anchored to a trigger on click   | `Have it`    | `ds-popup`, with the same twelve positions the APL has (named `top-start` where the APL says `top-left`).                                          |
| 2   | A close button and Escape to close       | `Have it`    | `ds-popup closable`. DS is **ahead**: the APL needs Escape switched on by hand (see gap 12).                                                       |
| 3   | A dimmed background behind the panel     | `Have it`    | `backdrop`, and `backdrop-dismiss` for click-outside closing.                                                                                      |
| 4   | A hover hint on an element               | `Have it`    | `ds-tooltip` for text, `ds-hint` for the small information icon. Both open on hover **and** focus, unlike the APL.                                 |
| 5   | Keeping focus inside the open panel      | `Have it`    | DS only. `trap-focus`. The APL moves focus into the panel but never traps it.                                                                      |
| 6   | Only one popover open at a time          | `Have it`    | DS only. `group` makes same-group popups dismiss each other. No APL equivalent.                                                                    |
| 7   | A little arrow pointing at the trigger   | `Have it`    | `arrow` on `ds-popup`. The APL draws one too.                                                                                                      |
| 8   | A title line in the panel                | `Partial`    | The APL has a `title` input. In DS you slot a heading, which is more flexible but means every team styles it themselves.                           |
| 9   | Info, warning, error and success styling | `Partial`    | The APL has `alertType` with a colored bar. In DS you slot a `ds-notification`, which already has those four colors — but there is no example.     |
| 10  | A colored panel background               | `Gap`        | The APL offers white, primary, secondary and iron. DS has a `--popup-background` variable but no ready-made variants, and no agreed text colors.   |
| 11  | A fixed panel width and height           | `Partial`    | The APL defaults to 400x600 pixels. DS has min and max width variables and no height cap, which suits small panels better than large ones.         |
| 12  | Escape only works if switched on         | `Don't copy` | `enableEscapeClose` is off by default in the APL, so the normal popover cannot be dismissed from the keyboard.                                     |
| 13  | Hover popovers open on mouse only        | `Don't copy` | The APL adds `mouseenter` but no focus listener, so keyboard users never see the content at all. Fails WCAG 1.4.13 and 2.1.1.                      |
| 14  | Hover content cannot be reached          | `Don't copy` | The panel closes 150ms after the pointer leaves the trigger and the panel itself does not keep it open, so links or scrolling inside are unusable. |
| 15  | The close button is a `div`              | `Don't copy` | A `div` with `role="button"` and hand-written Enter and Space handling. DS uses a real button (`ds-close`).                                        |
| 16  | The panel has no role unless one is set  | `Don't copy` | `panelRole` defaults to empty, so a popover is announced as plain text. `ds-popup` defaults to `dialog`.                                           |
| 17  | A timer checks whether the trigger moved | `Don't copy` | The APL polls every 500ms while open to notice the trigger scrolling out of view. floating-ui does this without a timer.                           |

### Open questions for design

1. Should a popover be able to carry a color (primary, secondary, iron), or does it always sit on
   white? This is the only genuine gap, and it brings text and contrast decisions with it.
2. Is the info/warning/error/success popover its own style, or simply a `ds-notification` placed inside
   a plain popover? Our recommendation is the second.
3. Does a popover need a built-in title, or is slotting a heading enough?
4. Rich content on hover: do we want it at all? Hover content that holds links or needs scrolling is a
   known accessibility trap. The safe split is text on hover, rich content on click.
5. Should DS be able to enable Escape without also showing a close button? Today `closable` turns on
   both together.

### Worth knowing

- **The APL popover and `ds-popup` solve the same problem with the same twelve positions.** The
  difference is underneath: `ds-popup` uses floating-ui, the APL uses the Angular CDK overlay plus a
  500ms timer.
- **The hover mode is where the APL component and the Design System genuinely disagree.** The APL
  makes one component do both hover and click; DS splits them into `ds-tooltip`/`ds-hint` for hover
  and `ds-popup` for click. The split is what lets the DS tooltip open on focus and stay dismissible.
- **The DS tooltip documents its WCAG 1.4.13 behaviour** — it opens on hover and focus and can be
  dismissed with Escape. The APL hover popover meets none of that.
- **The 0.5 estimate looks right** if it covers the colored panel plus documenting the title and
  notification patterns. Nothing needs building from scratch.

---

## 7. Progress Spinner / Spinner

**TL;DR — almost nothing to build, but the row covers two different things.** The APL has an inline
spinner (five fixed sizes) and a separate full-screen blocking overlay with a delayed message, and
Confluence merged both into this one row. `ds-spinner` already covers the inline one in every form the
APL demos; the only real gap is that the APL goes up to 100px and we stop at 64px. The overlay should
go to the "Wait Dialog" row, which already exists in Confluence and is already marked Missing.

**Recommendation: keep `ds-spinner`, decide on the larger sizes, and move the overlay to the Wait
Dialog row.** The inline cases are done: spinner on its own, spinner next to text or a link, spinner
inside a button. The overlay is a different component with different concerns — a backdrop, a focus
trap, a message that appears only when the wait gets long — and building it into the spinner would mean
the smallest indicator in the system carries the heaviest machinery. `ds-modal` already has the
backdrop and the focus trap to build it on, when the Wait Dialog row comes up.

APL pages: [/theme-demo/progress-spinner](https://www.helvetia.com/corp/app-patternlibrary/theme-demo/progress-spinner)
and [/library-demo/spinner](https://www.helvetia.com/corp/app-patternlibrary/library-demo/spinner) ·
Used by: All · Confluence estimate: 1

### Gaps

| #   | What's missing                       | Severity     | Note                                                                                                                                                   |
| --- | ------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Sizes above 64px                     | `Gap`        | APL has five: 100, 80, 60, 40, 20. DS has two per look: logo 64 and 32, circle 24 and 16. Nothing matches 80 or 100.                                   |
| 2   | Full-screen blocking overlay         | `Gap`        | The APL spinner covers the viewport with a 90% white backdrop. DS has nothing like it. Belongs to the Wait Dialog row.                                 |
| 3   | A title and a text under the spinner | `Partial`    | DS has one `label` that can sit right or below. The APL has a bold title plus a paragraph under it.                                                    |
| 4   | Message appears only after a delay   | `Gap`        | APL hides the text and reveals it after `textDelay` (8s by default), so short waits stay quiet. Good idea, belongs with the overlay.                   |
| 5   | Start and stop from anywhere         | `Gap`        | APL ships a service with `start()` / `stop()` and one instance at the app root. DS leaves this to the application.                                     |
| 6   | Free-form text size                  | `Partial`    | APL `textSize` picks one of seven typography classes. DS styles the label from tokens, with no setting.                                                |
| 7   | White variant for dark backgrounds   | `Have it`    | `inverted` on `ds-spinner`, against the APL's `uxngm-spinner--color-white`.                                                                            |
| 8   | Spinner inside a button              | `Have it`    | DS is **ahead**: `loading` on `ds-button` swaps the label, sets `aria-busy` and disables the button. The APL asks you to hand-build a wrapper div.     |
| 9   | Spinner next to text or a link       | `Have it`    | `label` plus `label-position`. The APL has two helper classes for this and still needs the markup by hand.                                             |
| 10  | Accessible name                      | `Have it`    | DS is **ahead**: `role="progressbar"` with a translated name in ten languages. Material supplies none, so every APL spinner is an unnamed progressbar. |
| 11  | A way to switch the animation off    | `Have it`    | DS only: the `animated` setting and the `deactivated` property. The APL animation always runs.                                                         |
| 12  | A plain circle look                  | `Have it`    | DS only: `variation="circle"` for places where the brand logo is too much. No APL equivalent.                                                          |
| 13  | Works when rendered on the server    | `Have it`    | DS only. It falls back to a fixed color instead of breaking.                                                                                           |
| 14  | Determinate progress                 | `Have it`    | Despite the name, the APL spinner is indeterminate only. For known progress DS has `ds-progress-bar`.                                                  |
| 15  | Backdrop color as a CSS string       | `Don't copy` | `backdropColor="rgba(192, 192, 192, 0.9)"` is passed straight into an inline style, so it bypasses the tokens entirely.                                |
| 16  | Size chosen by a debug attribute     | `Don't copy` | The theme also matches on `[ng-reflect-diameter='60']`. That attribute only exists in development builds, so in production that half does nothing.     |
| 17  | Size needs two inputs in sync        | `Don't copy` | Every spinner needs `[diameter]="60"` **and** `class="spinner-s"`, and the docs say so. One component property should be enough.                       |
| 18  | Logo drawn as a background image     | `Don't copy` | Material's own graphic is hidden and replaced with a background image, which disappears in high-contrast mode and when printing.                       |
| 19  | Keyboard users behind the overlay    | `Don't copy` | The overlay has no focus trap and does not disable the page behind it, so you can still tab into content you cannot see. Nothing announces the wait.   |
| 20  | Delay timer is never cleared         | `Don't copy` | The timer handle is a fresh local variable on every event, so stopping the spinner clears nothing and a stopped spinner's message still fires later.   |
| 21  | Broken class when no text size set   | `Don't copy` | `textSize` defaults to empty, which builds the class `uxngm-typography--`. The text then falls back to unstyled.                                       |
| 22  | One instance, one fixed message      | `Don't copy` | Title and text are set in the template of the single root instance, so the service cannot say what the user is actually waiting for.                   |

### Open questions for design

1. Do we need spinner sizes above 64px? That is the only thing the APL inline spinner has and we do
   not, and nothing inside the APL itself uses the two largest ones.
2. Does a spinner need a title **and** a text, or is one label enough?
3. Is the full-screen overlay its own component — the Wait Dialog row — rather than a mode of the
   spinner? Our recommendation is yes.
4. If it is, does the delayed message belong to it, and is 8 seconds the right wait?
5. Should the animation switch itself off when the operating system asks for reduced motion? Today the
   DS `animated` setting is chosen by the app or the user, and neither side reacts to the OS setting.
6. Is a service-style "start and stop the spinner from anywhere" API in scope for the Design System at
   all, or is that an application concern?

### Worth knowing

- **This row merges two components with different jobs.** The theme-level `mat-spinner` is an inline
  indicator; the library-level `ux-ng-spinner` is a blocking overlay that happens to contain one. The
  "Partially available" flag is really about the second.
- **Confluence already has the right home for the overlay.** The "Wait Dialog" row is marked Missing
  at 0.25, and its own description says it shows extra information about the state of the system and
  stays visible longer than the processing takes. That is the same component.
- **Inside the APL repository only the three smallest sizes appear** (20px eleven times, 60px four
  times, 40px once). The two largest are only on the demo page. Application usage is unknown, since
  applications live outside the repository.
- **The estimate of 1 looks high for what is left.** With the overlay moved to the Wait Dialog row,
  what remains is a decision about larger sizes and possibly a second line of text.
- **DS is the more complete component here.** It names itself to screen readers in ten languages, can
  be switched off for users who do not want animation, has a non-logo variant, renders on the server,
  and is already wired into `ds-button` and `ds-file-upload`. None of that exists on the APL side.

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

---

## 9. Select Box

**TL;DR — no new component needed.** Pick a product or option by clicking a box instead of a radio
button: `ds-radio-group tile` already does the single-choice version and `ds-checkbox-group tile` the
multiple-choice one, which is exactly what the Confluence row points at as its reference. What is
genuinely missing is small and all about content inside the box: a dark variant, photos, and a third
line of text.

**Recommendation: use `ds-radio-group tile` for "pick one" and `ds-checkbox-group tile` for "pick
several".** The Design System already has the boxes, the responsive column grid, four tile colors, the
option to hide the radio dot, and the option to deselect again — it is ahead of the APL on all of
those. Treat the three content gaps as small additions and document the pattern, rather than building
a `ds-select-box`.

APL page: [/library-demo/select-box](https://www.helvetia.com/corp/app-patternlibrary/library-demo/select-box) ·
Used by: myHelvetia, DiBe · Confluence estimate: 1 · Confluence already references a radio tile grid
as the counterpart, which matches this recommendation.

### Gaps

| #   | What's missing                            | Severity     | Note                                                                                                                                                                                                                |
| --- | ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Pick one option from boxes                | `Have it`    | `ds-radio-group tile`, with `cols`, `cols-tablet` and `cols-mobile`. Five worked examples in Storybook.                                                                                                             |
| 2   | Pick several options from boxes           | `Have it`    | `ds-checkbox-group tile`. The APL uses one `multiple` flag on one component; DS splits it in two, which is the correct choice for screen readers.                                                                   |
| 3   | Click the chosen box again to clear it    | `Have it`    | APL calls it `toggleable`; DS calls it `allow-empty-selection`.                                                                                                                                                     |
| 4   | Icon, title and description in a box      | `Have it`    | `ds-icon` or `ds-brand-icon` slotted in, and `ds-brand-icon` has its own tile size that follows the screen size.                                                                                                    |
| 5   | The wide row layout (APL "list" type)     | `Have it`    | `label-position="left"` with a horizontal `ds-stack`. Same component as the tile — only the layout differs.                                                                                                         |
| 6   | A check mark instead of a radio dot       | `Have it`    | `hide-trigger`, plus the box changing color when chosen.                                                                                                                                                            |
| 7   | Colored boxes                             | `Have it`    | DS is **ahead**: four brand colors. The APL has none.                                                                                                                                                               |
| 8   | A dark box                                | `Gap`        | APL `color="dark"` — demonstrated on the APL page. DS tiles have no dark variant.                                                                                                                                   |
| 9   | A photo inside a box                      | `Partial`    | A `ds-picture` can be slotted, but there is no agreed example and no answer for where the check mark sits on top of a photo. The APL has both.                                                                      |
| 10  | A third line of text ("remarks")          | `Partial`    | Anything can be slotted, so it works today, but there is no agreed style for a muted note after the description.                                                                                                    |
| 11  | Fixed pixel sizes and a group maximum     | `Partial`    | The APL sets width, height and a 345px group maximum by hand. DS uses a responsive column grid, which is usually the better answer.                                                                                 |
| 12  | Large illustrations in a box (180–460px)  | `Gap`        | Scope question. DS has ~400 brand icons in four colors, sized for tiles; it has nothing in the 460px illustration class. The APL has 113 illustrations.                                                             |
| 13  | Group label, hint, error, required marker | `Have it`    | DS only. No APL equivalent — the APL group has no label at all.                                                                                                                                                     |
| 14  | Form submission and Angular forms         | `Have it`    | DS only. The APL takes a form control as an input and writes into it, and its hidden input is never submitted.                                                                                                      |
| 15  | Every group announces "Transportart"      | `Don't copy` | The APL group has a hard-coded German `aria-label="Transportart"` ("mode of transport"), left over from an example. Every select box in every app announces that to a screen reader, whatever it actually contains. |
| 16  | Selection handled by a click listener     | `Don't copy` | The APL bypasses the toggle group's own value and tracks selection itself, so the highlighted box and the control's state can disagree.                                                                             |
| 17  | A 250ms timer to refresh the selection    | `Don't copy` | The APL exposes `updateSubscription()` and its demo page has a "Force Update (not needed)" button. DS tiles need no refreshing.                                                                                     |
| 18  | Cleanup crashes when a group has no items | `Don't copy` | `ngOnDestroy` unsubscribes a subscription that only exists once an item has emitted.                                                                                                                                |

### Open questions for design

1. Is the dark box still wanted? It is the only real visual gap, and it is used by myHelvetia or DiBe —
   worth confirming with them before building it.
2. Should a box be able to hold a photo, and if so where does the check mark go on top of it?
3. Is "remarks" a real third text level, or can it be folded into the description?
4. Are large illustrations inside boxes in scope, or are brand icons the answer? This is the one item
   that would need new assets rather than new code.
5. Fixed pixel sizes per box, or stay with the responsive column grid?

### Worth knowing

- **This is the first of the twelve with a real APL component and a real DS counterpart on both
  sides.** The comparison is therefore unusually concrete, and it comes out in the DS's favor.
- **The APL component is a wrapper around Material's button toggle group** that re-implements
  selection on top of it. That is where gaps 16 to 18 come from — they are consequences of the
  wrapping, not of the design.
- **Confluence's own reference is a radio tile grid**, so the recommendation here agrees with what was
  already written in the row; it just needs the status and the estimate brought in line.
- **"List" and "tile" are not two things in the Design System.** Both are the same tile with a
  different label position, which removes a whole input from the API.
- **The estimate of 1 looks high.** Nothing has to be built for the main use cases; the work is the
  dark variant plus documenting the photo and remarks patterns.

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

---

## 11. Snackbar

**TL;DR — keep `ds-snackbar`, two real gaps.** The APL snackbar is plain Material with a Helvetia
skin, and `ds-snackbar` already matches it on types, action link, message text and timing, while
adding a close button, a heading line, a queue and a mobile form. Missing: a busy variant with a
spinner in it, and the option to put the action link below the text. One decision is open, whether an
error snackbar should interrupt a screen reader rather than wait its turn.

**Recommendation: keep `ds-snackbar` and add the busy variant.** Both sides do the same job and the
list of differences is short, so this is settings and styling rather than a new component. The busy
variant is the only one that needs real work, because the message has to carry a running spinner
instead of a static icon. If the "action link below the text" layout is wanted it is one extra class.

APL page: [/theme-demo/snackbar](https://www.helvetia.com/corp/app-patternlibrary/theme-demo/snackbar) ·
Used by: All · Confluence estimate: 1

### Gaps

| #   | What's missing                        | Severity     | Note                                                                                                                                                           |
| --- | ------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A busy variant with a spinner         | `Gap`        | The APL has a fifth type that shows a spinning logo instead of an icon, used while a document is being prepared. DS has `ds-spinner` but cannot place it.      |
| 2   | Action link below the text            | `Gap`        | One APL class moves the action under the message instead of beside it, for long texts. DS always puts it beside.                                               |
| 3   | Announce errors urgently              | `Gap`        | Material lets the app choose to interrupt the screen reader. DS always announces politely, so an error waits until the screen reader is finished.              |
| 4   | Choose where it appears               | `Partial`    | Material can place it top or bottom, left, center or right. DS pins snackbars to the bottom and toasts to the top, which is the more consistent choice.        |
| 5   | More than one action button           | `Partial`    | The APL builds a two-button snackbar by hand. DS has an `action` slot that takes several buttons, but the controller API only accepts one.                     |
| 6   | Free markup in the message            | `Partial`    | The APL passes an HTML string. DS has a slot for markup, but only when the element is written in the page, not through the controller.                         |
| 7   | Five types with their own icon        | `Have it`    | Info, success, warning and error match one for one. The fifth is the busy variant in gap 1.                                                                    |
| 8   | Action link                           | `Have it`    | Plus `action-href` and `action-target`, so the action can be a link. The APL action is always a button.                                                        |
| 9   | How long it stays                     | `Have it`    | Both take seconds, and both treat zero as "stays until dismissed". DS defaults snackbars to staying.                                                           |
| 10  | A close button                        | `Have it`    | DS is **ahead**: `closable` adds a real close button. The APL has none — you pass an action labelled "Close" and wire it up yourself.                          |
| 11  | A heading above the message           | `Have it`    | DS only. The APL message is a single run of text unless you hand-build the content.                                                                            |
| 12  | Queue, limit and duplicate filter     | `Have it`    | DS only: at most five at a time and the same message is not shown twice. The APL stacks whatever the app opens.                                                |
| 13  | Collapses to an icon button on phones | `Have it`    | DS only. The snackbar shrinks to a single round button the user can tap to read it.                                                                            |
| 14  | Announced to screen readers           | `Have it`    | Both announce politely out of the box. See gap 3 for the urgent case.                                                                                          |
| 15  | Icon drawn as a background image      | `Don't copy` | Every type icon is a CSS background image, so it disappears in high-contrast mode and when printing. DS uses a real icon element.                              |
| 16  | HTML message injected as a string     | `Don't copy` | The APL example passes markup into `[innerHTML]`. If any part of that text ever comes from data, it is a cross-site scripting hole.                            |
| 17  | "Close" as a dummy link               | `Don't copy` | The same example closes via `<a href="javascript:void(0)">`. That is a button, and it is not reachable in a sensible order.                                    |
| 18  | Two snackbars timed by hand           | `Don't copy` | The download example opens a busy snackbar for 5 seconds and a success one after 4, so they overlap. Whatever replaces it should be one snackbar that changes. |
| 19  | Spinner animation never stops         | `Don't copy` | The busy variant spins forever with no way to switch it off. DS has an app-wide setting for exactly this.                                                      |
| 20  | Fixed minimum width of 344px          | `Don't copy` | Below roughly 380px of screen the snackbar plus its margins no longer fit. DS sizes itself to its content.                                                     |

### One limitation found on our side

`ds-toast` pauses its countdown while the pointer is over it or the keyboard focus is inside it.
`ds-snackbar` does not, because snackbars stay open by default. But an app **can** give a snackbar a
duration, and the APL demos all do — 2, 3, 5 and 6 seconds. In that case the message can disappear
while someone is still reading it or tabbing towards its action, which is the thing WCAG asks us to
avoid. Either the snackbar should pause the same way the toast does, or giving a snackbar a duration
should be discouraged in the documentation.

### Open questions for design

1. Should an error snackbar interrupt the screen reader, or wait its turn as it does today?
2. Is the busy variant a snackbar type, or is it the Wait Dialog from the spinner section in a
   different place? The APL uses it for exactly that: a document being prepared.
3. Is the "action link below the text" layout needed, or is a shorter message the better answer?
4. Should the controller API accept more than one action, or is two buttons in a snackbar too much?
5. Do we want to keep the mobile collapse behavior? It is ours alone and the APL has no equivalent,
   so it has never been compared.

### Worth knowing

- **The APL has no snackbar component**, same as Slider — it is Material plus one stylesheet and five
  brand variants. Every usage calls `MatSnackBar.open()` with a class name chosen by hand.
- **The visual design is already the same idea**: white panel, colored bar down the left edge, large
  type icon, action separated by a thin line. DS reaches it with tokens instead of a skin.
- **The one real pattern in the APL is the document download**, and it is the reason the busy variant
  exists. That is worth designing properly rather than copying.
- **The estimate of 1 looks high.** The busy variant plus an optional layout class is the whole list,
  unless the urgent-announcement question turns into work.
- **DS is the more complete component here.** Close button, heading, queue with a duplicate filter,
  action as a link, mobile form, and a React hook. None of that exists on the APL side.
