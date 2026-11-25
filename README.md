<a href="https://helvetia-design.vercel.app" target="blank">
    <img src="https://raw.githubusercontent.com/helvetia-design/system/main/apps/storybook/src/assets/images/banner.svg?sanitize=true" alt="Helvetia Design System" />
</a>

Built with accessibility and simplicity in mind, the Helvetia Design System provides UI components and a clearly defined visual style for building web applications.

## Core Principles

- **Accessibility** — WCAG 2.2 AA compliant, keyboard navigation, screen reader support
- **Simplicity** — HTML → CSS → JavaScript approach, minimal complexity
- **Responsiveness** — Works seamlessly from 320px to 2560px viewports
- **Standards Compliance** — W3C best practices, modern web standards
- **Compatibility** — Browser support verified via webstatus.dev and caniuse.com
- **Inclusion** — Designed for diverse abilities and technologies

## Installation

### Run this repo locally

```bash
# Use the Node.js version from .nvmrc (lts/krypton, Node 24.x)
nvm install
nvm use

# Enable Corepack so the pnpm version pinned in package.json is used
corepack enable

# Install dependencies — npm fails here (blocked by a preinstall guard, and
# dependency versions use pnpm's "catalog:" protocol)
pnpm install --frozen-lockfile
```

> Running `pnpm install @helvetia-design/core` from the repo root adds the published package to the root `package.json` — it is not the setup command for this repo.

```bash
# Build libs-output-target-web — packages/core/stencil.config.ts imports it,
# and pnpm start (unlike pnpm build/docs) doesn't build it automatically
pnpm --filter libs-output-target-web build

# Generate tags.constant.ts and _component-names.scss (gitignored, regenerated on demand)
node --input-type=module -e "import { generateComponentTags } from './packages/core/config/generate-component-tags.mjs'; import { resolve } from 'node:path'; await generateComponentTags(resolve('packages/core'))"

pnpm start   # Dev server at http://localhost:4000 (also builds the styles)
pnpm docs    # Optional: Storybook at http://localhost:6006
```

### Use the package in your own app

Install the core design system package via npm:

```bash
npm install @helvetia-design/core
```

Then import the CSS and component loader in your application:

```html
<link rel="stylesheet" href="node_modules/@helvetia-design/styles/dist/css/design-system.css" />
<script type="module" src="node_modules/@helvetia-design/core/dist/design-system/design-system.esm.js"></script>
```

For framework-specific integrations, see the [Quick Start guide](https://helvetia-design.vercel.app/?path=/docs/development-getting-started--getting-started).

## Quick Start

Use any design system component in your HTML:

```html
<ds-button>Click me</ds-button>
<ds-card>
  <ds-heading level="2">Welcome</ds-heading>
  <p>Start building with the Helvetia Design System</p>
</ds-card>
```

Explore all available components, design tokens, and examples in the [component library](https://helvetia-design.vercel.app).

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](https://github.com/helvetia-design/system/blob/main/CONTRIBUTING.md) guide to learn about:

- Reporting bugs and requesting features
- Development setup and workflow
- Creating new components
- Testing and code quality standards
- Semantic versioning and changesets

Follow our [Code of Conduct](https://github.com/helvetia-design/system/blob/main/CODE_OF_CONDUCT.md) for all interactions.

## Learn More

- **[Documentation](https://helvetia-design.vercel.app)** — Component library, design tokens, and interactive examples in Storybook
- **[Quick Start](https://helvetia-design.vercel.app/?path=/docs/development-getting-started--getting-started)** — Get started with the design system in your project
- **[llms.txt](https://helvetia-design.vercel.app/llms.txt)** / **[llms-full.txt](https://helvetia-design.vercel.app/llms-full.txt)** — Machine-readable component API and usage docs for AI coding tools ([llmstxt.org](https://llmstxt.org))
- **[CHANGELOG.md](https://github.com/helvetia-design/system/blob/main/CHANGELOG.md)** — Release notes, version history, and changes for each version
- **[ARCHITECTURE.md](https://github.com/helvetia-design/system/blob/main/docs/ARCHITECTURE.md)** — System design, workspace structure, component lifecycle, web components patterns, CSS variables, testing strategy
- **[DEVELOPMENT.md](https://github.com/helvetia-design/system/blob/main/docs/DEVELOPMENT.md)** — Local setup, dev servers, building, testing, troubleshooting
- **[CONTRIBUTING.md](https://github.com/helvetia-design/system/blob/main/CONTRIBUTING.md)** — Contribution workflow, PR process, component checklist, accessibility requirements
- **[STYLE_GUIDE.md](https://github.com/helvetia-design/system/blob/main/docs/STYLE_GUIDE.md)** — Code standards, naming conventions, best practices
- **[SECURITY.md](https://github.com/helvetia-design/system/blob/main/SECURITY.md)** — Security policy, vulnerability reporting, and compliance guidelines
- **[CODE_OF_CONDUCT.md](https://github.com/helvetia-design/system/blob/main/CODE_OF_CONDUCT.md)** — Community standards and expectations

## License

This project is licensed under the Apache License 2.0. See [LICENSE](https://github.com/helvetia-design/system/blob/main/LICENSE) for details.
