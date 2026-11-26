# CONTEXT — packages/core (Web Components)

This document captures domain language, architectural patterns, and key concepts specific to the core component package.

## Overview

**packages/core** is the primary source of truth for all UI components in the design system. It uses **Stencil.js** to author web components that compile to multiple output targets:

- Web Components (standard custom elements)
- Angular bindings (auto-generated wrapper components)
- React bindings (auto-generated hooks/components)
- Hydrate script (Node-compatible SSR renderer at `hydrate/`)
- TypeScript type definitions for all frameworks

## Core Concepts

### Component Authoring

- **Stencil components** are written as TypeScript classes (`.tsx` + `.scss`) in `packages/core/src/components/`
- Each component implements `ComponentInterface` and `Loggable` interfaces
- Components use `@Prop()`, `@Event()`, `@Method()`, `@Listen()`, `@Watch()` decorators from Stencil

### Component Lifecycle

1. **Authoring** → `.tsx` + `.scss` in `packages/core/src/components/<category>/<name>/`
2. **Compilation** → Stencil compiler transpiles to web components in `dist/`
3. **Output targets** → Additional targets (Angular, React, Web, hydrate) generate bindings and the SSR renderer
4. **Distribution** → Built artifacts published to npm as `@helvetia-design/core`

### Component Types

The system supports **three component architectures**:

#### 1. Web-Component-Only (`ds-*`)

- **Has**: `.host.scss` file (Shadow DOM styles)
- **No**: `.style.scss` file
- **Usage**: Custom element with Shadow DOM encapsulation and full JavaScript interactivity
- **Example**: `<ds-button color="primary">Click me</ds-button>`
- **Skills**: Full story generation, interactive controls, all test types
- **Identification**: Check for `.host.scss` only (not `.style.scss`)

#### 2. CSS-Only

- **Has**: `.style.scss` file (global CSS classes)
- **No**: `.host.scss` file
- **Usage**: Plain HTML elements with CSS classes, no JavaScript
- **Example**: `<button class="ds-button is-primary">Click me</button>`
- **Skills**: No stories, limited tests (visual + a11y only)
- **Identification**: Check for `.style.scss` only (not `.host.scss`)

#### 3. Hybrid

- **Has**: Both `.host.scss` (Shadow DOM) and `.style.scss` (global CSS)
- **Usage**: Supports both web component mode and CSS-only mode
- **Example**: Works as both `<ds-button>` and `<button class="ds-button">`
- **Skills**: Minimal stories (no prop controls), limited tests
- **Identification**: Check for both `.host.scss` AND `.style.scss`

All three types share styling logic via the `*.style.scss` → `*.host.scss` pattern where applicable.

**How to Identify Component Type Programmatically:**

```javascript
// Check for SCSS files in component directory
const hasHostScss = fs.existsSync(`${componentPath}/${componentName}.host.scss`)
const hasStyleScss = fs.existsSync(`${componentPath}/${componentName}.style.scss`)

if (hasHostScss && !hasStyleScss) return 'web-component-only'
if (!hasHostScss && hasStyleScss) return 'css-only'
if (hasHostScss && hasStyleScss) return 'hybrid'
```

### Design Tokens Integration

Components reference design tokens (`--ds-*` CSS variables) for:

- Colors, spacing, fonts, shadows, z-index values
- All theming is token-driven; direct color values should not appear in component CSS

## Notable Patterns

### `components/*.js` Is Guaranteed Dynamic-Import-Free

The `dist-custom-elements`/web output target (`components/*.js`, generated via `libs/output-target-web`) is documented for **static, non-lazy registration** — consumers import it directly (e.g. `@helvetia-design/core/components/ds-input.js`) instead of relying on Stencil's lazy loader. Any real `import()` reachable from those entry points breaks bundlers/build targets that can't code-split (e.g. a single-file IIFE embed for a plain `<script>` tag).

This is enforced automatically, not just by convention: `libs/output-target-web/src/lib/inline-dynamic-imports.ts` runs on every `components/` build and rewrites any `import("./chunk.js")` into a hoisted static import + `Promise.resolve()`, then asserts none remain (build fails otherwise). The lazy-loader build (`dist/`, e.g. `spinner.tsx`'s `import(/* @vite-ignore */ './spinner.animation')` for the Lottie animation payload) is untouched and keeps its dynamic import, since that target is meant to code-split.

### Naming Conventions

- **Custom element prefix**: `ds-` (e.g., `<ds-button>`, `<ds-card>`)
- **Usage-context prefix**: `ds-app-*` for components built for application (product) usage, as opposed to marketing/website usage (e.g. `ds-app-navbar`, `ds-app-footer`). Each usage context gets its own component rather than a variant prop on a shared one — a future website-context navbar would be `ds-web-navbar`, not a prop on `ds-app-navbar`. Unrelated to `ds-root`, the root wrapper component (renamed from `ds-app` in ADR-0029). `ds-app` remains as a deprecated compatibility alias. See ADR-0026, ADR-0029.
- **Event naming**: `ds<Name>` (e.g., `dsChange`, `dsCloseClick`)
- **Handler naming**: `listenTo<Event>` (@Listen), `<Prop>Changed` (@Watch), `handle<Event>` (DOM handlers)
- **CSS classes**: `.is-<state>` for states (e.g., `.is-disabled`, `.is-primary`), `.mod-<variant>` for modifiers

### CSS Variable Cascade and Naming

The four-layer cascade (`--_` private → `--` public → `--mod-` modifier → `--ds-` token), the `vars.local()` mixin and the component/element variable naming are defined in [ARCHITECTURE.md → CSS Variable Cascade](../../docs/ARCHITECTURE.md#css-variable-cascade). Component variables reference alias or component tokens only — never hard-coded values or global tokens.

### Common Component Variables

Most components expose these variable groups:

**Color Variables:**

- `--{component}-color` — text color
- `--{component}-bg` — background color
- `--{component}-border` — border color

**Spacing Variables:**

Margin and padding both use the same seven-suffix shorthand — all sides, then the two axis
shorthands, then the four individual sides:

| Suffix | Side         | Margin example     | Padding example    |
| ------ | ------------ | ------------------ | ------------------ |
| `-m`   | all sides    | `--{component}-m`  | `--{component}-p`  |
| `-mx`  | left + right | `--{component}-mx` | `--{component}-px` |
| `-my`  | top + bottom | `--{component}-my` | `--{component}-py` |
| `-ml`  | left         | `--{component}-ml` | `--{component}-pl` |
| `-mr`  | right        | `--{component}-mr` | `--{component}-pr` |
| `-mt`  | top          | `--{component}-mt` | `--{component}-pt` |
| `-mb`  | bottom       | `--{component}-mb` | `--{component}-pb` |

Margin's suffix set is generated for free by `vars.margin($name)` (see `packages/core/src/vars.scss`'s `margin-vars` mixin), which every component using `vars.base($name)` picks up automatically. Padding has no shared mixin yet, so it's authored by hand per component — existing examples spell out the full word rather than using the `-p`/`-px`/`-py` shorthand (`--_container-padding-x`/`--_container-padding-y`, `--_notification-padding`). Follow whichever style the component already uses for its other spacing vars; the shorthand table above is the target scheme once/if padding gets a shared mixin like margin's.

**Typography Variables:**

Every text part wires all seven typography parts through the shared `typo.*` mixin family in
`packages/core/src/typography.scss` — never by hand. See [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md#typography)
for the full usage pattern (`typo.local`/`typo.apply`/`typo.mod`, and the inline-text-part exception
for links in running text). The seven public custom properties per text part:

- `--{component}[-<part>]-font-family` — typeface
- `--{component}[-<part>]-font-size` — text size
- `--{component}[-<part>]-font-weight` — text weight
- `--{component}[-<part>]-line-height` — line height
- `--{component}[-<part>]-letter-spacing` — letter spacing
- `--{component}[-<part>]-text-decoration` — text decoration
- `--{component}[-<part>]-text-transform` — text transform

**Border & Radius:**

- `--{component}-radius` — border radius
- `--{component}-border-width` — border thickness

### Customizing Components

Components can be customized at multiple levels:

**Override a Single Component Instance:**

```html
<ds-tag style="--tag-color: var(--ds-alias-text-color-danger);"> Custom Color </ds-tag>
```

**Override via JavaScript:**

```javascript
const tag = document.querySelector('ds-tag')
tag.style.setProperty('--tag-color', 'var(--ds-alias-text-color-success)')
```

**Override Multiple Instances via CSS:**

```css
.warning-context ds-tag {
  --tag-color: var(--ds-alias-text-color-warning);
  --tag-bg: var(--ds-alias-bg-color-warning-light);
}
```

**Override via Slot Parent:**

```html
<div style="--tag-color: var(--ds-alias-text-color-info);">
  <ds-tag>Info Tag</ds-tag>
</div>
```

### Shadow DOM Encapsulation

Component CSS variables respect Shadow DOM boundaries:

**Inside Shadow DOM (component author):**

- Uses `--_private` variables in CSS rules
- Modifiers set `--mod-` variables via `.is-*` classes
- Design tokens provide `--ds-` defaults

**Outside Shadow DOM (consumer):**

- Can only set public `--` variables on the host element
- Changes cascade into the component via the public layer
- Private variables are isolated and cannot be accessed

### Best Practices for Component Variables

**Do:**

- ✅ Use design token values when overriding (e.g., `--ds-alias-text-color-*`)
- ✅ Override at the appropriate scope (single element, class, global)
- ✅ Use `-device` suffix for responsive values
- ✅ Check component documentation for available variables

**Don't:**

- ❌ Try to access or set `--_private` variables (they're isolated in Shadow DOM)
- ❌ Set hardcoded hex colors; use tokens instead
- ❌ Override `--mod-` variables directly (let classes set them)
- ❌ Override `--ds-` tokens from outside (only change via design system)

### Component Organization

Each component directory contains:

- `component.tsx` — component logic and render
- `component.interfaces.ts` — types, enums, interfaces
- `component.host.scss` — web component styles (Shadow DOM)
- `component.style.scss` — shared styles (both modes)
- `test/` — see `packages/playwright/CONTEXT.md#test-file-organization` for the full file set

### Component Relationships — Language

**Sub-component**:
A DS component with no Storybook page of its own, documented under a sibling in the same component folder — its documentation owner (e.g. `ds-tab`, `ds-tab-panel` → `ds-tabs`; `ds-button-group` → `ds-button`). Whether it sits inside or wraps the owner doesn't matter.
_Avoid_: child component, companion

**Documentation owner**:
The component in a family folder that has its own Storybook page (`doc-config.ts`) and documents its sub-components on that page. One Storybook page = one documentation unit, in Storybook and in Figma alike.
_Avoid_: parent (ambiguous — the owner may be the inner element, as `ds-button` is to `ds-button-group`)

**Nested component**:
An independent DS component, with its own component folder, that another component uses (e.g. `ds-icon` inside `ds-button`).
_Avoid_: child component, inner component

**Attachment**:
An optional nested component that its host positions out of flow on the host's own box, e.g. `ds-badge` on the top-right corner of `ds-button`, `ds-tab` or `ds-card`. Optional means it can be present or absent — slotted by the consumer, or rendered by the host behind a prop. The host owns the placement; the attachment owns only its own look. Declared on the host with an `@attachment` JSDoc tag. A nested component that is always present at a fixed place is not an attachment.
_Avoid_: anchor, overlay, positioned slot, badge slot

**Inverted**:
A component shown on a dark surface. It is a state of the surface, not a color: it combines with any color the component offers, and every color has its own inverted look (see [ADR-0038](../../docs/adr/0038-inverted-is-not-a-color.md)).
_Avoid_: white, dark mode, inverted color

**List row**:
An expandable row in a list: `ds-accordion` with `list`, placed in `ds-list > li`. `ds-list` cascades its `size="lg"` and `inverted` into the rows through `--mod-accordion-list-*` and `--mod-accordion-*` custom properties (see [ADR-0040](../../docs/adr/0040-list-accordion-rows-live-on-ds-accordion.md)). `ds-item` has no accordion variant. Nest a list by wrapping the inner `ds-list` in `<section slot="content">` of the parent: with `slot="content"` on the `ds-list` itself, the HTML `li` start-tag rule (custom elements, `div`, `p`, `address` are transparent) lets the first nested `<li>` close the outer `<li>` in plain HTML, `innerHTML` and SSR. The wrapper adds no padding or margin.
_Avoid_: accordion item, `ds-item variant="accordion"`

### Usage-Category Taxonomy

Every component directory lives under a lowercase-plural **category** folder:
`packages/core/src/components/<category>/<name>/`. The identical category folder is mirrored
in `apps/storybook/src/components/<category>/<name>/` (see `apps/storybook/CONTEXT.md`) — this
mapping is the single source of truth for both trees.

A component's category is determined by what it **does**, not who consumes it. Scope prefixes
(`ds-app-*` today, future `ds-web-*`) stay a naming convention only — they do not get their own
folder tier (e.g. `app-navbar` lives under `navigation/`, not under an `app/` tree).

**Category order and component order within each category are alphabetical, everywhere** —
folder listing, Storybook sidebar, docs. There are seven categories:

| Category     | Components                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`    | button, close, link                                                                                                                                     |
| `forms`      | checkbox, counter, datepicker, file-upload, form, input, label, number-input, phone-input, radio, segment, select, slider, textarea, time-input, toggle |
| `indicators` | badge, hint, progress-bar, spinner, tag                                                                                                                 |
| `media`      | brand-icon, icon, logo, picture, shape                                                                                                                  |
| `navigation` | app-navbar, pagination, steps, tabs                                                                                                                     |
| `overlays`   | alert, drawer, modal, notification, popup, sheet, tooltip                                                                                               |
| `structure`  | accordion, app-footer, card, carousel, container, content, data, divider, grid, heading, list, root, stack, table, text                                 |

A new component is scaffolded into `components/<category>/<name>/` by the component-engineer
(`ds-implement-component`), which mirrors the same category folder in the storybook tree. No
public API, import path, package export, or custom-element tag name is affected by the category
folder — it is purely an internal organizational convention.

## Per-Component Deep Dives

Component-specific patterns live next to their component rather than here, to keep this
file scoped to cross-cutting concerns:

- [`navigation/app-navbar/CONTEXT.md`](src/components/navigation/app-navbar/CONTEXT.md) — three-section layout, mobile drawer, responsive behavior
- [`forms/datepicker/CONTEXT.md`](src/components/forms/datepicker/CONTEXT.md) — model/display value, shadow-root popup
- [`forms/slider/CONTEXT.md`](src/components/forms/slider/CONTEXT.md) — noUiSlider integration, event mapping
- [`forms/checkbox/checkbox-group/CONTEXT.md`](src/components/forms/checkbox/checkbox-group/CONTEXT.md) — controlled-group value sync
- [`forms/phone-input/CONTEXT.md`](src/components/forms/phone-input/CONTEXT.md) — E.164 model value, country picker
- [`forms/toggle/CONTEXT.md`](src/components/forms/toggle/CONTEXT.md) — label omission from `Field`
- [`overlays/modal/CONTEXT.md`](src/components/overlays/modal/CONTEXT.md) — component-overlay delegate pattern

## Global Configuration (`DesignSystem.config`)

`packages/core/src/global/config/` holds the singleton `config` (a `Config`
instance, exposed at runtime as `window.DesignSystem.config`) that drives
brand/region/language/icons/animation/etc. across all components. Consuming
apps bootstrap it either via JS (`initializeDesignSystem(userConfig)` /
`setupDsConfig(userConfig)`) or, for markup-only setups, via a `<meta>` tag:

```html
<meta name="design-system-config" data-brand="helvetia" data-region="CH" data-language="de" />
```

`setupDsConfig` merges three sources, **lowest to highest precedence**:

1. `defaultConfig` (`config.default.ts`)
2. `configFromMetaTag(win)` (`config.meta.ts`) — reads the `<meta
name="design-system-config">` tag's `data-*` attributes, but **only**
   an explicit allowlist (`DS_CONFIG_META_ATTRIBUTE_MAP` in
   `config.const.ts`): `brand`, `region`, `language`, `fallbackLanguage`,
   `allowedLanguages` (comma-separated), `animated` (`"false"` → `false`,
   anything else → `true`). Never spreads `dataset` wholesale — this
   keeps the config's shape/type guarantees intact even if a CMS editor
   or injected markup adds unrelated `data-*` attributes.
3. the `userConfig` object passed to `initializeDesignSystem`/`setupDsConfig`
   — always wins; this is how frameworks, Storybook, and tests override

Icons, `legalLinks`, `legalText`, and `socialLinks` are **not**
meta-tag-configurable — they're structured/nested data not representable
in a flat `data-*` attribute. See
[docs/adr/0002-ds-config-meta-tag.md](../../docs/adr/0002-ds-config-meta-tag.md)
for the full rationale.

`setupDsConfig` never replaces an existing `Config`-like instance (anything
with a `reset` method) on `window.DesignSystem.config`. It applies the merged
sources to that instance instead, so components attached to it keep receiving
changes. This matters when several bundles each ship a copy of
`@helvetia-design/core` (e.g. the extension repos): the first bundle's
instance stays the shared one, and a later bundle's exported `config` module
singleton is then not the registered instance. Read the live instance with
`useDsConfig()`. A plain object on `window.DesignSystem.config` is still
replaced by the module singleton.

### Dynamic-Import-Free Entry Point (`@helvetia-design/core/initialize`)

The bare `@helvetia-design/core` specifier resolves (via `module`/`es2015`) to the
ESM bundle that also contains Stencil's `bootstrapLazy`/`loadModule` lazy-
component-loader machinery — dozens of dynamic `import()` calls, one per
component. Consumers who can't code-split (single-file/IIFE bundler targets)
and hand-register components individually via `@helvetia-design/core/components/*.js`
need `initialize`/`initializeDesignSystem` without pulling that in.

`package.json`'s `exports["./initialize"]` maps to the pre-built CJS entry
(`dist/cjs/index.cjs.js`), which is `require()`-based end-to-end with zero
dynamic imports:

```ts
import { initialize } from '@helvetia-design/core/initialize'
```

`exports` also declares `"."`, `"./components"`, `"./loader"`, and
`"./hydrate"` explicitly (mirroring their `files`-listed directory-index
resolution) plus a `"./*"` fallback, so adding this map doesn't drop any
previously-working deep import.

### Hydrate Script (`@helvetia-design/core/hydrate`)

`stencil.config.ts` includes a `dist-hydrate-script` output target (skipped in
dev/docs builds, same as `dist` / `dist-custom-elements`). It produces a
Node-compatible renderer at `hydrate/` on the package root, published via the
`files` array. `exports["./hydrate"]` maps types to `hydrate/index.d.ts` and
the Node entries to `index.mjs`/`index.js` — the `"./*"` fallback is enough
for untyped Node resolution, but TypeScript (and the generated React server
wrappers that `import('@helvetia-design/core/hydrate')`) need the explicit types
condition, the same pattern as `./components` and `./loader`.

The React generator (`config/stencil.bindings.react.ts`) points
`hydrateModule` at that path and sets `serializeShadowRoot:
'declarative-shadow-dom'`, so a core build also emits
`packages/react/src/generated/components.server.ts` alongside the existing
client `components.ts`. Consumer-facing SSR (a `"node"`-condition exports map
on `@helvetia-design/react`, and a client-only carve-out for the Modal/Toast/Snackbar
idioms) is the next ticket — see
[ADR-0031](../../docs/adr/0031-ssr-hydrate-build.md).

`extras.addGlobalStyleToComponents: true` makes the hydrate build prepend a
`<style>` with the `globalStyle` (`src/global/global.scss`) to every
declarative shadow root. Without it the server markup has no reset and native
elements keep their UA margins (#326). The client keeps that `<style>` after
hydration, because it has no `sty-id`. Cost: about 2.5 KB of CSS per shadow
root in the SSR output. Known limitation: Stencil (4.45.x) does not set the
CSP `nonce` on this `<style>`, while component styles get it from
`<meta name="csp-nonce">`. With a nonce-based `style-src` policy the browser
blocks the reset in SSR markup.

## Token Preview Listener

`packages/core/src/global/token-preview.ts` (wired into the `globalScript`, `src/global/global.ts`, so it's bundled into every `www` page — playground.html and every `*.visual.html`) listens for `postMessage` from an embedding parent window and applies token changes live via `document.documentElement.style.setProperty`/`removeProperty`. It is a no-op unless the page is actually embedded in an iframe (`window.parent` is a distinct window). That also covers Node hydrate, where Stencil's `window.parent` is `null` and a `postMessage` would throw. It never activates during normal component consumption or Playwright visual-regression runs. No origin allowlist yet — MVP is localhost-only (toky ↔ core dev-server); see [`docs/plans/toky-live-token-preview-plan.md`](../../docs/plans/toky-live-token-preview-plan.md) for the message contract and the deferred "deployed / other DS websites" phase where real origin validation is planned.

`stencil.config.ts`'s existing `buildStart` hook (the one that already generates `docs/tags.json`) also globs every `*.visual.html` under `src/{blocks,templates,foundation,components}` and writes `docs/visual-pages.json`, copied into `www/visual-pages.json` by the `www` output target's `copy` config. This is the manifest Toky's Live Preview page picker fetches to list selectable pages — `blocks`/`templates` don't exist as directories yet, so they currently contribute nothing, but the glob picks them up automatically once they do.

## Key Constraints

- **Shadow DOM encapsulation** — Styles do not leak in/out
- **No framework-specific code** — Components must work in vanilla JS, React, Angular, Vue, etc.
- **Accessibility first** — WCAG 2.2 AA compliance is mandatory
- **Responsive by default** — Components must work 320px–2560px
- **Immutable props** — All @Prop() use `readonly`
- **No external dependencies** — Keep bundle size minimal

## Testing Requirements

| Test Type   | File Pattern         | Framework        | Purpose                           |
| ----------- | -------------------- | ---------------- | --------------------------------- |
| Unit        | `.spec.ts`           | Vitest           | Logic, prop validation, utilities |
| Interaction | `.component.play.ts` | Playwright       | User interactions, events         |
| Visual      | `.visual.play.ts`    | Playwright       | Visual regression detection       |
| A11y        | `.a11y.play.ts`      | Playwright + axe | WCAG 2.2 AA compliance            |

All tests mount via Page Objects from `@helvetia-design/playwright`.

## Related Contexts

See [CONTEXT-MAP.md](../../CONTEXT-MAP.md) for:

- [[packages/tokens|packages/tokens/CONTEXT.md]] — Design tokens reference
- [[packages/playwright|packages/playwright/CONTEXT.md]] — Testing library
- [[packages/styles|packages/styles/CONTEXT.md]] — Global styles
- [[apps/storybook|apps/storybook/CONTEXT.md]] — Storybook documentation
- [[root|CONTEXT.md]] — Repository-level concepts
