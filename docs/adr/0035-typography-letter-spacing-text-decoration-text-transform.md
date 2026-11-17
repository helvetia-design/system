# 35. Typography gains letter-spacing, text-decoration and text-transform

Package: `packages/tokens`

Date: 2026-11-03

Status: Accepted

## Context

A typography token held four parts: font family, size, weight and line height. Designs also need letter
spacing, text decoration and text transform, and Figma shows each typography part as its own variable.
Figma has no variable type for text decoration or text case, and its letter spacing is a percentage of
the font size while the DTCG format stores letter spacing as a rem `dimension`.

## Decision

Every typography token carries three more required parts, each a reference to a primitive:

- **letterSpacing** is a `dimension` in `rem` (`Global.Font.LetterSpacing.0`, aliased by
  `Alias.Text.LetterSpacing.{Text,Heading}`).
- **textDecoration** and **textTransform** have their own `$type`s, limited to the CSS keywords
  `none | underline | line-through` and `none | uppercase | lowercase | capitalize`. Overline is not
  supported because Figma has no equivalent.

In Figma all three are `STRING` variables. Letter spacing is a percentage (`"20%"`) computed as
`letterSpacingPx / fontSizePx` against the token's **desktop** font size. Text decoration and text
transform use Figma's own names (`"NONE"`, `"UNDERLINE"`, `"STRIKETHROUGH"`; `"ORIGINAL"`, `"UPPER"`,
`"LOWER"`, `"TITLE"`), so a future native variable type needs no migration.

Typography tokens committed before this change keep their four `variableId`s. The first sync adds only the
three missing variables and backfills their ids ([ADR-0017](0017-direct-commit-variableid-backfill.md)).
Toky leaves such a token alone until the ids exist, instead of reading the missing variables as deleted.

## Consequences

- A non-zero letter spacing is exact in Figma only at the desktop font size, because the font size is
  responsive and a Figma percentage is not. Today every value is `0`, which is `"0%"` at every size.
- Pulling a letter spacing change from Figma is reported as unsupported, not written: the percentage
  cannot be mapped back to a reference without guessing.
- Adding the two types means every place that handles `fontWeight` has a counterpart: the build
  transform, the Figma sync tables, Toky's pull, validation and editor.
- Component stylesheets do not yet consume the new longhands. The defaults equal the browser defaults,
  so nothing changes visually until a non-default value is introduced.
