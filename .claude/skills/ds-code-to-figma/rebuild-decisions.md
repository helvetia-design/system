# Rebuild decisions

Component-specific decisions from the first Figma runs (04.–17.11.2026), saved before the
`*.figma.md` and `*.figma-validation.md` files were deleted for the full rebuild. Phase 1 reads the
component's section and applies what's recorded here instead of asking again; Phase 2 proposes
the recorded grouping. A decision that no longer matches the code (the code changed) is asked
again. General rules that came out of these runs are already in the phases and `conventions/*` and
aren't repeated here.

## Rebuild order

Phase 1 reads each nested component's key from its `<child>.figma.md` and stops when it's
missing, so children go first:

1. Icon (glyph library + `Icon` wrapper)
2. Spinner
3. Logo (no DS children)
4. Button (Icon, Spinner)
5. Close, Badge (Icon)
6. Input (Icon, Spinner; slots prefer Icon, Button)
7. Pagination (Button, Icon)

## Icon

- **`color` holds `inverted` and `disabled`** as two more options (user decision): one enum, no
  `inverted` / `disabled` booleans, no `state` axis. Options: `primary · info · grey · success ·
danger · warning · inverted · disabled`. `disabled` wins over `inverted` in code anyway.
- **`size`** is a variant axis with an explicit `base` option (the code default is unset and falls
  back to `Icon/Size/Base`): `base · sm · md · lg · xl`. Never a variable-override mitigation
  (user's rule: size axes are always crossed variants or splits).
- **Excluded:** `invalid` (same look as `color=danger`, no token), `inline` (no static effect),
  the SCSS-only `primary-light` (no token, no prop reaches it).
- **Architecture:** a 40-variant `Icon` wrapper set (`color` rows × `size` columns) with one
  `Icon` instance-swap property over a glyph library of 79 components; glyphs follow
  `--icon-padding` (component › `box` › `Vector`).
- **"🖼️ Icon names" section** (confirmed with the user, answers the Phase 3 "ask the user" step
  for asset components): a 9 × 9 grid of all 79 icons at `size=md`, `color=primary`, each an
  instance of the wrapper's default variant with its `Icon` swap set to the glyph, name label
  underneath.
- **Inverted row:** its cells get the dark preview background, or the pale glyphs disappear.
- **Open (Gery, 17.11.2026):** "Set color with variables" — also for Brand Icon.
- Orphaned token, not used: `Icon/Color/InvertedDisabled`.

## Spinner

- **4 sets:** `variation` (logo / circle) and `inverted` are both top-level splits — logo and
  circle have different layers. Each set crosses `size` (`sm · base`) × `labelPosition`
  (`right · bottom`).
- **Label:** text property + `show label`, default off (code default `label=''`).
- **Excluded:** `deactivated` (stops the animation only).
- **Logo glyph:** a hand-traced shape of the Helvetia mark at 86.3% of the `inner` container,
  corner radius scaled with it. **Circle:** `ring` ellipse + `progress` arc (top 90°).
- **Known, same in code:** the circle's progress arc is invisible on the inverted background.
- **Review findings:** code binds only the logo's width to the size token, its height comes from
  the Lottie SVG (64 / 32 in Figma vs. 70.5 / 38.5 live). The label color tokens
  (`--ds-spinner-label-color-primary` / `-inverted`) were pending the token sync.
- Code drift (follow-up): `spinner.tsx` hardcodes `#000d6e`; the label spacing is rem literals.

## Logo

- **`brand` is a top-level split:** Helvetia and Baloise are different artwork. Helvetia first and
  the default — code matches since 17.11.2026 (`LOGO_BRANDS = ['helvetia', 'baloise']`).
- `animated`, `color` (`primary · inverted`) and `size` (`sm · base · lg`) are variant axes;
  `animated=true` shows the static idle frame — the Lottie animation is out of scope.
- The width is calculated from the height by a fixed aspect ratio in code, so it's not a
  measurement row.

## Button

- **Sets:** `Button` and `ButtonInverted` (top-level split). `ButtonInverted` has only the 5 colors
  that look different when inverted (`primary · secondary · tertiary · ghost · link`): in code
  `primary`, the brand and the status colors share the same inverted tokens.
- **Instance overrides, not variants** (mitigation, approved 04.11.2026), with these steps:
  - `square`: `show label` off, `show icon` on; padding-x and gap → `Global/Dimension/Space/0`;
    min width / height → `Space/48` (`sm`: `Space/32`); icon → `size=md` (`sm`: `size=sm`).
  - `flat`: padding-x → `Global/Dimension/Space/0`; min height → 28px (hardcoded, accepted — no
    token; `Global/Font/Size/28` rejected as semantically wrong).
  - `shadow`: apply `Alias/Shadow/Box/Base` (`ghost` and `link`: `Alias/Shadow/Text`).
  - `iconTurn`: rotate the nested icon instance 180°.
- **Excluded** (no static visual difference, approved 04.11.2026): `elementType`, `href`,
  `target`, `rel`, `download`, `name`, `value`, `noWrap`, `a11yControls`, `a11yTitle`,
  `a11yLabel`, `a11yHaspopup`.
- **Not built yet:** `brandIcon` / `brandSize` (needs the Brand Icon run first; adds a `device:`
  section for the padding) and the `@attachment ds-badge top-right` (attachments plan, steps 3–5).
- **Icons:** the right icon now follows the button size like the left one (code fix, 16.11.2026):
  sm 14 / base 16 / lg 32px. Square buttons, Toast and App Footer now also set
  `--icon-inner-size`.
- **Loading spinner:** drawn at 24px (`--spinner-logo-size: 1.5rem`), not the spinner's own `sm`
  size; logo 20.71 (86.3%).
- **Measurements:** `drawnColor: secondary` (`primary` and the status colors draw the border in
  the fill color, so the border and the padding inside it can't be seen). Min width doesn't bind
  (border + padding are already wider) → skipped.
- **Anatomy:** two instances, because no single state shows all five parts — `loading` (A
  container, B spinner) and `default` with both icons on (C icon, D label, E icon right).
- **Review findings:** every `<button>` gets 1px `padding-block` from the browser default (only
  `padding-inline` is reset; `<a>` gets 0). Code drift (follow-up): square sizes, the spinner logo
  size and the flat min height are rem literals.

## Close

- **Excluded** (user instruction): `button`, `buttonColor`, `buttonSize` — only the native
  `<button>` path is modeled.
- **Sets:** `Close` / `CloseInverted` (top-level split). `sm` was removed from the code 16.11.2026
  (below the 24 × 24 target size); `ds-tag` still sets the `sm` tokens directly.
- **The X** is an inline SVG in the component's SCSS: a static vector, no icon swap.
- **Measurements:** `drawnState: hover` — the default background is transparent, so the circle
  the size line measures only shows on hover (user-confirmed).

## Badge

- **One set**, `size` (`base · sm · lg`) × `color` (`default · disabled · info · danger · warning
· success`), no `state` axis.
- **Label:** text property, placeholder `1`, plus `show label`, **default on** — off models the
  icon-only badge (an empty Figma text would keep its gap and width).
- **Icon:** `show icon` (default off) + swap; the glyph is nested directly, no Icon wrapper (user
  confirmed — a parent swap can't reach two levels down). `sm` never renders the icon.
- **`sm` is a dot:** font and icon tokens are 0 and padding has no effect, so the Sizes table
  shows `—` for Padding X, Icon size and Text.
- **Measurements:** the main drawing overrides the label to `Urgent` (`mainLabel`): with `1` the
  min width decides the width and the padding can't be seen.
- **Excluded:** `position` (placement comes from the parent), `pulse` (animation only).
- `default` and `danger` look identical (both `#ffaca6`) but stay separate options.
- **Long text overflows** (no truncation) — intended, see the TODO; Storybook's Do's and Don'ts
  covers it.
- **Review findings:** the `colors` and `icon` visual snapshots were out of date (24.09); the run
  continued on a dev-server comparison.

## Input

- **`show label` default on**, unlike the code default `label=''`: every real input has a label.
- **`required`** → an `optional` toggle (default off) on the generated " (optional)" text, not a
  variant axis (Gery's request, rule in `PHASE-2-PROPOSE.md`). Halves the set to 104 variants.
- **Gery's rebuild notes (TODO, 17.11.2026):**
  - **`loading` → a `loading` toggle** on the spinner's visibility (default off), not a variant
    axis — same rule as `optional` (`PHASE-2-PROPOSE.md`).
  - **No `disabled` + `loading` combination,** and **`loading` only when filled** (`filled=true`):
    the toggle exists on those variants only, or is hidden elsewhere — confirm how in Phase 2.
  - **`value` and `placeholder` don't wrap** — single line, truncated like the native input.
  - **`warning` and `danger` are out of scope** for the `color` axis.
- **Component states (previous build):** `invalid`, `loading` and `disabled` were `true` / `false`
  variants; `invalid` and `loading` stay interactive in code, so they crossed with the interaction
  states; `disabled` doesn't. `invalid=true` shows the `invalid text` node with a fixed `alert`
  glyph (nested directly, `base` 16px, measured) instead of `description`. `loading` now becomes a
  toggle (above).
- **Slots:** `start` / `end` open slots in `control` with `show start` / `show end` (default off),
  preferred Icon and Button; `end` sits before the loading spinner (code renders both — the
  `loading` JSDoc saying it replaces the end slot is wrong).
- **Excluded:** `type` (native sub-widgets a static frame can't show) and every other non-visual
  prop (`accept`, `autocapitalize`, `autocomplete`, `autocorrect`, `autofocus`, `debounce`, `max`,
  `maxLength`, `min`, `minLength`, `multiple`, `pattern`, `allowedKeyPress`, `spellcheck`,
  `readonly`, `suffix`, `inputmode`, `mask`, `autoInvalidOff`, `name`). `suffix` is text appended
  to the value after blur, not a slot.
- **Tokens without a `--ds-*` var** (resolved with the user): `#container` min height 48px →
  `Component/Button/Size/Base/MinHeight` (value match; no Form/Control token yet — code
  follow-up); padding-inline 8px → `Alias/Space/Padding/XS`; gap 4px → `Alias/Space/Gap/2XS`.
- **Anatomy:** `start` / `end` became `@part`s in code (17.11.2026) — add them to the anatomy list.

## Pagination

- **3 sets** (top-level splits, different layers): `Pagination` (numbered buttons + ellipsis),
  `PaginationDots` (counter badge, > 5 pages) and `PaginationDotsRow` (≤ 5 pages, a row of dot
  markers — added on user request 05.11.2026).
- **Axes:** `Pagination` = `size` (`base · sm`) × `state` (`default · disabled`); both dots sets =
  `state` only. `disabled` hides previous / next (`visible=false`).
- **Representative content:** `Pagination` `value=5, totalPages=10, pageRange=1` (previous · 1 ·
  … · 4 · 5 · 6 · … · 10 · next — every part visible); `PaginationDots` `value=10, totalPages=20`;
  `PaginationDotsRow` `value=2, totalPages=3` (middle dot active).
- **Excluded:** `align` (only visible when the consumer stretches the host — same as Icon's
  `inline`), `value` (content), `pageRange`, `totalPages`, `label`, `textPrevious`, `textNext`,
  `top`, `sticky`.
- **Buttons:** previous / next / page are plain `<button>`s styled with the forwarded
  `button.style.scss` — reuse the `Button` set (`ghost`, previous / next always `sm` in dots
  mode) instead of drawing them.
- **Tokens:** dot marker 10px hardcoded (accepted, no scale step fits); dots badge min / max width
  63 / 88 now real tokens (`Pagination/Dots/MinWidth` / `MaxWidth`, pending the Figma sync);
  ellipsis weight → `Alias/Text/Weight/Bold` and width → `Global/Space/32` / `48` (code has
  literals — follow-up).
- **Dot-row gap:** the CSS specificity bug was fixed 16.11.2026 — the row now renders the intended
  2px (`--ds-pagination-dots-gap`), not 8px; the dot-row snapshots need `/update-screenshots`.
- **Measurements:** the default `Pagination` set only; the dots sets are left out (user decision).
