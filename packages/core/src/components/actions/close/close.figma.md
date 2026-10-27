# close → Figma mapping

> **Note**: this file did not exist in the repo checkout — the original Phase 1–4 mapping/build
> history for `ds-close` (props, token resolution, variant grouping decisions) was not found
> locally, even though the component is fully built in Figma (`Close/Primary` and
> `Close/Inverted` component sets, both documentation frames, on the `⏳ Core / Action / Close`
> page). Only this follow-up is recorded here; the original build documentation should be
> recovered or reconstructed separately if needed.

## Follow-up — header rebuilt to match the pattern introduced on `ds-spinner`

Same rebuild as `badge.figma.md`/`icon.figma.md`'s equivalent entries — see those files and
`DOCUMENTATION-TEMPLATE.md` for the full spec. Applied to **both** frames (`Close/Primary`'s
"Close Documentation" and `Close/Inverted`'s "Inverted Close Documentation"), since `ds-close`
has a true `inverted` top-level split like `ds-spinner`.

- Wrapped `top-bar`/`heading`/`body` into one `header` auto-layout frame on both frames.
- Replaced the single `title` text with a two-line `heading`: `"Close"` bold 48px + a
  light-weight qualifier — `"Main"` on the Primary frame, `"Inverted"` on the Inverted frame
  (same convention as `ds-spinner`).
- **Pitfall hit**: the Inverted frame's original `title` text content was literally
  `"Inverted Close"` (not just `"Close"`), so the first automated pass carried that into line 1,
  producing a redundant `"Inverted Close"` / `"Inverted"` heading. Fixed by explicitly setting
  line 1's text to the plain component name (`"Close"`) to match `ds-spinner`'s pattern, where
  line 1 reads identically on both frames and only line 2 differs. Check this on any component
  whose Inverted frame's original title included the word "Inverted" in the component name
  itself, rather than assuming `title.characters` is always the plain component name.
- Restyled the "View in Storybook ↗" link to Bold 16px underlined navy on both frames.
- Bumped `lead` from 14px to 16px on both frames.
- **Realigned the Main components overlay on both frames afterward** — `Close/Primary` and
  `Close/Inverted` are page-level siblings with page-absolute coordinates (not reparented into
  their table frames), so the taller two-line heading shifted both "Tables row" positions.
  Recomputed and reapplied against each table's current `absoluteTransform` (`size` × `state`
  grid: rows `base`/`sm`/`md`, columns `default`/`hover`/`active`/`focus`/`disabled`, 15 cells per
  frame). Verified via position math — 30/30 correct across both frames.
