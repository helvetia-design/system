import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanCleanup } from '../skills/ds-migrate-from-baloise/scripts/scan-cleanup.mjs'

const TODO = 'TODO: remove these legacy Baloise imports once the Helvetia migration is verified'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-cleanup-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

function writeManifest(root: string, manifest: Record<string, unknown>, rel = 'package.json') {
  write(root, rel, `${JSON.stringify(manifest, null, 2)}\n`)
}

describe('scanCleanup', () => {
  it('refuses while a bal-* component is left and lists what is outstanding', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { 'react': '19.0.0', '@baloise/ds-react': '19.0.0' } })
    write(root, 'src/main.tsx', "import '@baloise/ds-styles/css/structure.css'\n")
    write(root, 'src/App.tsx', '<bal-button>Go</bal-button>\n<bal-unknown-widget />\n')

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [{ name: 'button', total: 1 }],
        notYet: [{ name: 'unknown-widget', total: 1 }],
        types: [],
        hidden: [],
      },
    })
  })

  it('refuses while a legacy tag without a ds-* equivalent is left and lists it under byHand', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-angular': '19.0.0' } })
    write(
      root,
      'src/app.component.html',
      '<ds-checkbox></ds-checkbox>\n<bal-check checked></bal-check>\n<bal-radio-icon></bal-radio-icon>\n',
    )

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [],
        notYet: [],
        types: [],
        hidden: [],
        byHand: [
          { name: 'check', total: 1 },
          { name: 'radio-icon', total: 1 },
        ],
      },
    })
  })

  it('refuses while an HTMLBal*Element type is the only legacy reference left', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-angular': '19.0.0' } })
    write(
      root,
      'src/field.directive.ts',
      'export class FieldDirective {\n  constructor(private el: ElementRef<HTMLBalInputElement>) {}\n}\n',
    )

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: { suggested: [{ name: 'input', total: 1 }], notYet: [], types: [], hidden: [] },
    })
  })

  it('refuses while a legacy type namespace is still imported', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-angular': '19.0.0' } })
    write(root, 'src/app.component.ts', "import { BalEvents, BalLanguage } from '@baloise/ds-angular'\n")

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [],
        notYet: [],
        types: [
          { name: 'events', total: 1 },
          { name: 'language', total: 1 },
        ],
        hidden: [],
      },
    })
  })

  it('removes structure, core, the Init TODO and every legacy dependency of a React app after Init and Assets', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: {
        'react': '19.0.0',
        '@baloise/ds-react': '19.0.0',
        '@baloise/ds-styles': '19.0.0',
        '@helvetia-design/react': '1.0.0',
      },
    })
    write(root, 'pnpm-lock.yaml', '')
    write(
      root,
      'src/main.tsx',
      [
        "// import '@baloise/ds-styles/css/normalize.css'",
        "import '@helvetia-design/tokens/css/base'",
        `/* ${TODO} */`,
        "import '@baloise/ds-styles/css/structure.css'",
        "import '@baloise/ds-styles/css/core.css'",
        "import '@helvetia-design/styles/css/design-system.local'",
        "import App from './App'",
        '',
      ].join('\n'),
    )
    write(root, 'src/App.tsx', 'export const App = () => <ds-button>Go</ds-button>\n')

    expect(scanCleanup(root)).toEqual({
      status: 'ready',
      packageManager: 'pnpm',
      installCommand: 'pnpm install',
      remove: {
        lines: [
          { file: 'src/main.tsx', line: 3, snippet: `/* ${TODO} */`, kind: 'todo' },
          { file: 'src/main.tsx', line: 4, snippet: "import '@baloise/ds-styles/css/structure.css'", kind: 'import' },
          { file: 'src/main.tsx', line: 5, snippet: "import '@baloise/ds-styles/css/core.css'", kind: 'import' },
        ],
        dependencies: [
          { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-react' },
          { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' },
        ],
      },
      keep: { lines: [], dependencies: [] },
      commented: [{ file: 'src/main.tsx', line: 1, snippet: "// import '@baloise/ds-styles/css/normalize.css'" }],
      unreadable: [],
    })
  })

  it('keeps the font line for Assets, the TODO above it and the package it still imports', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: { 'react': '19.0.0', '@baloise/ds-react': '19.0.0', '@baloise/ds-styles': '19.0.0' },
    })
    write(
      root,
      'src/main.tsx',
      [
        `/* ${TODO} */`,
        "import '@baloise/ds-styles/css/font.css'",
        "import '@baloise/ds-styles/css/structure.css'",
        "import '@baloise/ds-styles/css/core.css'",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.status).toBe('ready')
    expect(result.remove).toEqual({
      lines: [
        { file: 'src/main.tsx', line: 3, snippet: "import '@baloise/ds-styles/css/structure.css'", kind: 'import' },
        { file: 'src/main.tsx', line: 4, snippet: "import '@baloise/ds-styles/css/core.css'", kind: 'import' },
      ],
      dependencies: [{ packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-react' }],
    })
    expect(result.keep).toEqual({
      lines: [
        { file: 'src/main.tsx', line: 1, snippet: `/* ${TODO} */`, reason: 'legacy-below' },
        { file: 'src/main.tsx', line: 2, snippet: "import '@baloise/ds-styles/css/font.css'", reason: 'assets' },
      ],
      dependencies: [
        {
          packageJsonPath: 'package.json',
          field: 'dependencies',
          name: '@baloise/ds-styles',
          reason: 'used',
          usedBy: ['src/main.tsx:2'],
        },
      ],
    })
  })

  it('removes the angular.json styles entries and the dependencies in their own fields', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: { '@angular/core': '18.0.0', '@baloise/ds-angular': '19.0.0' },
      devDependencies: { '@baloise/ds-styles': '19.0.0' },
    })
    write(root, 'package-lock.json', '{}')
    write(
      root,
      'angular.json',
      [
        '{',
        '  "projects": {',
        '    "app": {',
        '      "architect": {',
        '        "build": {',
        '          "options": {',
        '            "styles": [',
        '              "node_modules/@helvetia-design/styles/dist/css/design-system.local.css",',
        '              "node_modules/@baloise/ds-styles/css/structure.css",',
        '              "node_modules/@baloise/ds-styles/css/core.css",',
        '              "src/styles.scss"',
        '            ]',
        '          }',
        '        }',
        '      }',
        '    }',
        '  }',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root)).toEqual({
      status: 'ready',
      packageManager: 'npm',
      installCommand: 'npm install',
      remove: {
        lines: [
          {
            file: 'angular.json',
            line: 9,
            snippet: '"node_modules/@baloise/ds-styles/css/structure.css",',
            kind: 'import',
          },
          {
            file: 'angular.json',
            line: 10,
            snippet: '"node_modules/@baloise/ds-styles/css/core.css",',
            kind: 'import',
          },
        ],
        dependencies: [
          { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-angular' },
          { packageJsonPath: 'package.json', field: 'devDependencies', name: '@baloise/ds-styles' },
        ],
      },
      keep: { lines: [], dependencies: [] },
      commented: [],
      unreadable: [],
    })
  })

  it('removes the SCSS @use lines and a // TODO comment', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'yarn.lock', '')
    write(
      root,
      'src/styles.scss',
      [
        "@use '@helvetia-design/tokens/css/base';",
        "@use '@helvetia-design/styles/css/design-system.local';",
        `// ${TODO}`,
        "@use '@baloise/ds-styles/css/structure';",
        "@use '@baloise/ds-styles/css/core';",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.installCommand).toBe('yarn install')
    expect(result.remove.lines).toEqual([
      { file: 'src/styles.scss', line: 3, snippet: `// ${TODO}`, kind: 'todo' },
      { file: 'src/styles.scss', line: 4, snippet: "@use '@baloise/ds-styles/css/structure';", kind: 'import' },
      { file: 'src/styles.scss', line: 5, snippet: "@use '@baloise/ds-styles/css/core';", kind: 'import' },
    ])
    expect(result.remove.dependencies).toEqual([
      { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' },
    ])
  })

  it('removes the HTML link tags and the <!-- TODO --> comment', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-core': '19.0.0', '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'index.html',
      [
        '<head>',
        '  <link rel="stylesheet" href="node_modules/@helvetia-design/styles/dist/css/design-system.local.css" />',
        `  <!-- ${TODO} -->`,
        '  <link rel="stylesheet" href="node_modules/@baloise/ds-styles/dist/css/structure.min.css" />',
        '  <link rel="stylesheet" href="node_modules/@baloise/ds-styles/dist/css/core.min.css" />',
        '</head>',
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.remove).toEqual({
      lines: [
        { file: 'index.html', line: 3, snippet: `<!-- ${TODO} -->`, kind: 'todo' },
        {
          file: 'index.html',
          line: 4,
          snippet: '<link rel="stylesheet" href="node_modules/@baloise/ds-styles/dist/css/structure.min.css" />',
          kind: 'import',
        },
        {
          file: 'index.html',
          line: 5,
          snippet: '<link rel="stylesheet" href="node_modules/@baloise/ds-styles/dist/css/core.min.css" />',
          kind: 'import',
        },
      ],
      dependencies: [
        { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-core' },
        { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' },
      ],
    })
    expect(result.keep).toEqual({ lines: [], dependencies: [] })
  })

  it('keeps the font and utilities lines of the bundled css/all block and the shared TODO above them', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'src/styles.scss',
      [
        "/* @import '@baloise/ds-styles/css/all'; */",
        "@import '@helvetia-design/tokens/css/base';",
        `/* ${TODO} */`,
        "@import '@baloise/ds-styles/css/font';",
        "@import '@baloise/ds-styles/css/structure';",
        "@import '@baloise/ds-styles/css/core';",
        "@import '@helvetia-design/styles/css/design-system';",
        "@import '@baloise/ds-styles/css/utilities/all';",
        "@import '@helvetia-design/styles/css/utilities';",
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root)).toEqual({
      status: 'ready',
      packageManager: 'npm',
      installCommand: 'npm install',
      remove: {
        lines: [
          { file: 'src/styles.scss', line: 5, snippet: "@import '@baloise/ds-styles/css/structure';", kind: 'import' },
          { file: 'src/styles.scss', line: 6, snippet: "@import '@baloise/ds-styles/css/core';", kind: 'import' },
        ],
        dependencies: [],
      },
      keep: {
        lines: [
          { file: 'src/styles.scss', line: 3, snippet: `/* ${TODO} */`, reason: 'legacy-below' },
          { file: 'src/styles.scss', line: 4, snippet: "@import '@baloise/ds-styles/css/font';", reason: 'assets' },
          {
            file: 'src/styles.scss',
            line: 8,
            snippet: "@import '@baloise/ds-styles/css/utilities/all';",
            reason: 'css-utils',
          },
        ],
        dependencies: [
          {
            packageJsonPath: 'package.json',
            field: 'dependencies',
            name: '@baloise/ds-styles',
            reason: 'used',
            usedBy: ['src/styles.scss:4', 'src/styles.scss:8'],
          },
        ],
      },
      commented: [{ file: 'src/styles.scss', line: 1, snippet: "/* @import '@baloise/ds-styles/css/all'; */" }],
      unreadable: [],
    })
  })

  it('keeps any other legacy import for the consumer and the package it imports', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-core': '19.0.0', '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'src/main.ts',
      [
        `/* ${TODO} */`,
        "import '@baloise/ds-styles/css/structure.css'",
        "import '@baloise/ds-styles/css/core.css'",
        "import '@baloise/ds-core/components/bal-notices.js'",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.status).toBe('ready')
    expect(result.remove.lines.map(entry => [entry.line, entry.kind])).toEqual([
      [2, 'import'],
      [3, 'import'],
    ])
    expect(result.remove.dependencies).toEqual([
      { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' },
    ])
    expect(result.keep).toEqual({
      lines: [
        { file: 'src/main.ts', line: 1, snippet: `/* ${TODO} */`, reason: 'legacy-below' },
        {
          file: 'src/main.ts',
          line: 4,
          snippet: "import '@baloise/ds-core/components/bal-notices.js'",
          reason: 'manual',
        },
      ],
      dependencies: [
        {
          packageJsonPath: 'package.json',
          field: 'dependencies',
          name: '@baloise/ds-core',
          reason: 'used',
          usedBy: ['src/main.ts:4'],
        },
      ],
    })
  })

  it('keeps a legacy package that a package.json script still copies from, but not its dependency entry line', () => {
    const root = createScratchDir()
    writeManifest(root, {
      scripts: { 'copy:fonts': 'cp -r node_modules/@baloise/ds-fonts/assets public/assets/fonts' },
      dependencies: { '@baloise/ds-fonts': '19.0.0' },
    })

    const result = scanCleanup(root)

    expect(result.status).toBe('nothing-to-clean-up')
    expect(result.keep).toEqual({
      lines: [
        {
          file: 'package.json',
          line: 3,
          snippet: '"copy:fonts": "cp -r node_modules/@baloise/ds-fonts/assets public/assets/fonts"',
          reason: 'assets',
        },
      ],
      dependencies: [
        {
          packageJsonPath: 'package.json',
          field: 'dependencies',
          name: '@baloise/ds-fonts',
          reason: 'used',
          usedBy: ['package.json:3'],
        },
      ],
    })
  })

  it('scopes kept lines to the manifest whose folder holds them', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } }, 'apps/a/package.json')
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } }, 'apps/b/package.json')
    write(root, 'apps/b/src/main.ts', "import '@baloise/ds-styles/css/font.css'\n")

    const result = scanCleanup(root)

    expect(result.remove.dependencies).toEqual([
      { packageJsonPath: 'apps/a/package.json', field: 'dependencies', name: '@baloise/ds-styles' },
    ])
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'apps/b/package.json',
        field: 'dependencies',
        name: '@baloise/ds-styles',
        reason: 'used',
        usedBy: ['apps/b/src/main.ts:1'],
      },
    ])
  })

  it('reports nothing to clean up when no legacy line or dependency is left', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { 'react': '19.0.0', '@helvetia-design/react': '1.0.0' } })
    write(
      root,
      'src/main.tsx',
      [
        "// import '@baloise/ds-styles/css/normalize.css'",
        "import '@helvetia-design/styles/css/design-system'",
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root)).toEqual({
      status: 'nothing-to-clean-up',
      packageManager: 'npm',
      installCommand: 'npm install',
      remove: { lines: [], dependencies: [] },
      keep: { lines: [], dependencies: [] },
      commented: [{ file: 'src/main.tsx', line: 1, snippet: "// import '@baloise/ds-styles/css/normalize.css'" }],
      unreadable: [],
    })
  })

  it('stays incomplete while dropdown, form, table or time-input is left and completes once they are migrated', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { 'react': '19.0.0', '@helvetia-design/react': '1.0.0' } })
    write(
      root,
      'src/App.tsx',
      [
        '<bal-form native>',
        '  <bal-dropdown name="d">',
        '    <bal-option-list>',
        '      <bal-option value="a" label="A"></bal-option>',
        '    </bal-option-list>',
        '  </bal-dropdown>',
        '  <bal-time-input name="t"></bal-time-input>',
        '  <bal-table><table></table></bal-table>',
        '</bal-form>',
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [
          { name: 'dropdown', total: 3 },
          { name: 'form', total: 1 },
          { name: 'table', total: 1 },
          { name: 'time-input', total: 1 },
        ],
        notYet: [],
        types: [],
        hidden: [],
      },
    })

    write(
      root,
      'src/App.tsx',
      [
        '<form noValidate>',
        '  <ds-select name="d">',
        '    <ds-select-option value="a">A</ds-select-option>',
        '  </ds-select>',
        '  <input type="time" className="ds-time-input" name="t" />',
        '  <table className="ds-table"></table>',
        '</form>',
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root)).toMatchObject({ status: 'nothing-to-clean-up' })
  })

  it('stays incomplete while a bal-table is left, also one around an AG Grid that the table migration keeps', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { 'react': '19.0.0', '@helvetia-design/react': '1.0.0' } })
    write(root, 'src/Grid.tsx', '<BalTable>\n  <AgGridReact rowData={rows} />\n</BalTable>\n')

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: { suggested: [{ name: 'table', total: 1 }], notYet: [], types: [], hidden: [] },
    })
  })

  it('skips node_modules, build output and lockfiles but keeps a dependency that tsconfig names', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-core': '19.0.0' } })
    write(root, 'node_modules/@baloise/ds-styles/package.json', '{ "name": "@baloise/ds-styles" }')
    write(root, 'node_modules/x/index.ts', "import '@baloise/ds-core'\n")
    write(root, 'dist/main.js', "import '@baloise/ds-core'\n")
    write(root, 'pnpm-lock.yaml', "  '@baloise/ds-core': 19.0.0\n")
    write(
      root,
      'tsconfig.json',
      [
        '{',
        '  "compilerOptions": {',
        '    "types": ["@baloise/ds-core"],',
        '    "paths": { "x": ["node_modules/@baloise/ds-core"] }',
        '  }',
        '}',
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.status).toBe('nothing-to-clean-up')
    expect(result.installCommand).toBe('pnpm install')
    expect(result.keep).toEqual({
      lines: [
        { file: 'tsconfig.json', line: 3, snippet: '"types": ["@baloise/ds-core"],', reason: 'manual' },
        {
          file: 'tsconfig.json',
          line: 4,
          snippet: '"paths": { "x": ["node_modules/@baloise/ds-core"] }',
          reason: 'manual',
        },
      ],
      dependencies: [
        {
          packageJsonPath: 'package.json',
          field: 'dependencies',
          name: '@baloise/ds-core',
          reason: 'used',
          usedBy: ['tsconfig.json:3', 'tsconfig.json:4'],
        },
      ],
    })
  })

  it('reads a nested source folder named like build output and refuses while it still has a bal-* tag', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-angular': '19.0.0' } })
    write(root, 'src/app/coverage/coverage.component.html', '<bal-button>Go</bal-button>\n')

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: { suggested: [{ name: 'button', total: 1 }], notYet: [], types: [], hidden: [] },
    })
  })

  it('classifies YAML lines and treats # lines as commented', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-fonts': '19.0.0', '@baloise/ds-core': '19.0.0' } })
    write(
      root,
      '.github/workflows/ci.yml',
      [
        'steps:',
        '  - run: cp -r node_modules/@baloise/ds-fonts/assets public',
        "  # - run: echo '@baloise/ds-core'",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.keep.lines).toEqual([
      {
        file: '.github/workflows/ci.yml',
        line: 2,
        snippet: '- run: cp -r node_modules/@baloise/ds-fonts/assets public',
        reason: 'assets',
      },
    ])
    expect(result.commented).toEqual([
      { file: '.github/workflows/ci.yml', line: 3, snippet: "# - run: echo '@baloise/ds-core'" },
    ])
    expect(result.remove.dependencies).toEqual([
      { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-core' },
    ])
  })

  it('refuses while a bal-* component is left in a .vue or .js file', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/App.vue', '<template>\n  <bal-button>Go</bal-button>\n</template>\n')
    write(root, 'src/x.js', 'export const tag = BalTag\n')

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [
          { name: 'button', total: 1 },
          { name: 'tag', total: 1 },
        ],
        notYet: [],
        types: [],
        hidden: [],
      },
    })
  })

  it('removes only single-line statements of a shape Init keeps and leaves every other structure or core line to the consumer', () => {
    const root = createScratchDir()
    writeManifest(root, {
      scripts: { 'build:css': 'sass node_modules/@baloise/ds-styles/css/core.css out.css' },
      dependencies: { '@baloise/ds-styles': '19.0.0' },
    })
    write(root, 'src/a.scss', "@import '@baloise/ds-styles/css/structure', '@baloise/ds-styles/css/core';\n")
    write(root, 'src/b.scss', "@import '@baloise/ds-styles/css/core';\n")
    write(root, 'src/c.ts', "import styles from '@baloise/ds-styles/css/core.css'\n")
    write(
      root,
      'index.html',
      ['<link', '  rel="stylesheet"', '  href="node_modules/@baloise/ds-styles/css/core.css"', '/>', ''].join('\n'),
    )
    write(
      root,
      'angular.json',
      [
        '{',
        '  "styles": [',
        '    { "input": "node_modules/@baloise/ds-styles/css/core.css", "bundleName": "core" }',
        '  ]',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'vite.config.ts',
      [
        'export default {',
        '  css: { preprocessorOptions: { scss: { additionalData: "@import \'@baloise/ds-styles/css/structure\';" } } },',
        '}',
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.remove).toEqual({
      lines: [{ file: 'src/b.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", kind: 'import' }],
      dependencies: [],
    })
    expect(result.keep.lines.map(({ file, line, reason }) => `${file}:${line} ${reason}`)).toEqual([
      'angular.json:3 manual',
      'index.html:3 manual',
      'package.json:3 manual',
      'src/a.scss:1 manual',
      'src/c.ts:1 manual',
      'vite.config.ts:2 manual',
    ])
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'package.json',
        field: 'dependencies',
        name: '@baloise/ds-styles',
        reason: 'used',
        usedBy: ['angular.json:3', 'index.html:3', 'package.json:3', 'src/a.scss:1', 'src/c.ts:1', 'vite.config.ts:2'],
      },
    ])
  })

  it('keeps a dependency of a workspace app that a workspace library still imports', () => {
    const root = createScratchDir()
    writeManifest(root, { private: true, workspaces: ['apps/*', 'libs/*'] })
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } }, 'apps/web/package.json')
    write(root, 'libs/theme/src/index.scss', "@import '@baloise/ds-styles/css/font';\n")

    const result = scanCleanup(root)

    expect(result.remove.dependencies).toEqual([])
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'apps/web/package.json',
        field: 'dependencies',
        name: '@baloise/ds-styles',
        reason: 'used',
        usedBy: ['libs/theme/src/index.scss:1'],
      },
    ])
  })

  it('keeps legacy keys in overrides as manual lines and the dependency they name', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: { '@baloise/ds-core': '19.0.0' },
      overrides: { '@baloise/ds-core': '19.1.0' },
      pnpm: { overrides: { '@baloise/ds-styles': '19.1.0' } },
    })

    const result = scanCleanup(root)

    expect(result.keep).toEqual({
      lines: [
        { file: 'package.json', line: 6, snippet: '"@baloise/ds-core": "19.1.0"', reason: 'manual' },
        { file: 'package.json', line: 10, snippet: '"@baloise/ds-styles": "19.1.0"', reason: 'manual' },
      ],
      dependencies: [
        {
          packageJsonPath: 'package.json',
          field: 'dependencies',
          name: '@baloise/ds-core',
          reason: 'used',
          usedBy: ['package.json:6'],
        },
      ],
    })
  })

  it('lists a package.json it cannot parse as unreadable', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'apps/x/package.json', '{ "dependencies": { "@baloise/ds-core": ')

    const result = scanCleanup(root)

    expect(result.unreadable).toEqual(['apps/x/package.json'])
    expect(result.keep.lines).toEqual([])
    expect(result.remove.dependencies).toEqual([
      { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' },
    ])
  })

  it('keeps a legacy dependency that no step of this skill migrates', () => {
    const root = createScratchDir()
    writeManifest(root, { devDependencies: { '@baloise/ds-testing': '19.0.0' } })

    const result = scanCleanup(root)

    expect(result.status).toBe('nothing-to-clean-up')
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'package.json',
        field: 'devDependencies',
        name: '@baloise/ds-testing',
        reason: 'manual',
        usedBy: [],
      },
    ])
  })

  it('lists a package declared in two fields once per field, including peerDependencies', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: { '@baloise/ds-core': '19.0.0' },
      peerDependencies: { '@baloise/ds-core': '>=19', '@baloise/ds-styles': '>=19' },
    })

    expect(scanCleanup(root).remove.dependencies).toEqual([
      { packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-core' },
      { packageJsonPath: 'package.json', field: 'peerDependencies', name: '@baloise/ds-core' },
      { packageJsonPath: 'package.json', field: 'peerDependencies', name: '@baloise/ds-styles' },
    ])
  })

  it('removes an orphan TODO and ignores the TODO text outside a comment', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { react: '19.0.0' } })
    write(
      root,
      'src/main.ts',
      [`// ${TODO}`, "import '@helvetia-design/styles/css/design-system'", `const note = '/* ${TODO} */'`, ''].join(
        '\n',
      ),
    )

    const result = scanCleanup(root)

    expect(result.status).toBe('ready')
    expect(result.remove.lines).toEqual([{ file: 'src/main.ts', line: 1, snippet: `// ${TODO}`, kind: 'todo' }])
    expect(result.keep.lines).toEqual([])
  })

  it('removes structure and core lines from .less and .mts files', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/theme.less', "@import '@baloise/ds-styles/css/core.css';\n")
    write(root, 'src/main.mts', "import '@baloise/ds-styles/css/structure.css';\n")

    expect(scanCleanup(root).remove.lines).toEqual([
      { file: 'src/main.mts', line: 1, snippet: "import '@baloise/ds-styles/css/structure.css';", kind: 'import' },
      { file: 'src/theme.less', line: 1, snippet: "@import '@baloise/ds-styles/css/core.css';", kind: 'import' },
    ])
  })

  it('refuses while a bal-* tag follows an apostrophe or a glob in markup text', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n")
    write(root, 'src/index.html', "<p>Ab CHF 1'000 <bal-tag>Neu</bal-tag></p>\n")
    write(
      root,
      'src/App.vue',
      '<template>\n  <p>Files under src/* are watched</p>\n  <bal-button>Go</bal-button>\n</template>\n',
    )

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [
          { name: 'button', total: 1 },
          { name: 'tag', total: 1 },
        ],
        notYet: [],
        types: [],
        hidden: [],
      },
    })
  })

  it('refuses while a bal-* tag hides in a string literal', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n")
    write(root, 'src/banner.ts', "el.innerHTML = '<bal-tag>Neu</bal-tag>'\n")

    expect(scanCleanup(root)).toEqual({
      status: 'incomplete',
      outstanding: {
        suggested: [],
        notYet: [],
        types: [],
        hidden: [{ file: 'src/banner.ts', line: 1, snippet: "el.innerHTML = '<bal-tag>Neu</bal-tag>'" }],
      },
    })
  })

  it('keeps a YAML or .htm reference that follows a URL', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-fonts': '19.0.0', '@baloise/ds-core': '19.0.0' } })
    write(root, 'ci.yml', 'steps:\n  - run: curl https://x.com && cp -r node_modules/@baloise/ds-fonts/assets public\n')
    write(
      root,
      'index.htm',
      '<p>see https://example.com</p><script src="node_modules/@baloise/ds-core/dist/x.js"></script>\n',
    )

    const result = scanCleanup(root)

    expect(result.keep.lines.map(({ file, line, reason }) => `${file}:${line} ${reason}`)).toEqual([
      'ci.yml:2 assets',
      'index.htm:1 manual',
    ])
    expect(result.commented).toEqual([])
    expect(result.remove.dependencies).toEqual([])
  })

  it('keeps a dependency that a script in a one-line package.json still uses', () => {
    const root = createScratchDir()
    write(
      root,
      'package.json',
      JSON.stringify({
        scripts: { 'copy:fonts': 'cp -r node_modules/@baloise/ds-fonts/assets public' },
        dependencies: { '@baloise/ds-fonts': '19.0.0' },
      }),
    )

    const result = scanCleanup(root)

    expect(result.status).toBe('nothing-to-clean-up')
    expect(result.keep.lines.map(({ file, line, reason }) => `${file}:${line} ${reason}`)).toEqual([
      'package.json:1 assets',
    ])
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'package.json',
        field: 'dependencies',
        name: '@baloise/ds-fonts',
        reason: 'used',
        usedBy: ['package.json:1'],
      },
    ])
  })

  it('classifies a legacy line that carries the Init TODO comment as a legacy line, not as the TODO', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', `@import '@baloise/ds-styles/css/all'; // ${TODO}\n`)

    const result = scanCleanup(root)

    expect(result.remove).toEqual({ lines: [], dependencies: [] })
    expect(result.keep.lines.map(({ line, reason }) => `${line} ${reason}`)).toEqual(['1 manual'])
  })

  it('keeps legacy icon and favicon references for Assets', () => {
    const root = createScratchDir()
    writeManifest(root, {
      dependencies: {
        '@baloise/ds-icons': '19.0.0',
        '@baloise/ds-brand-icons': '19.0.0',
        '@baloise/ds-favicons': '19.0.0',
      },
    })
    write(
      root,
      'src/icons.ts',
      [
        "import { balIconCheck } from '@baloise/ds-icons'",
        "import { balBrandIconCar } from '@baloise/ds-brand-icons'",
        "export const favicon = 'node_modules/@baloise/ds-favicons/assets/primary/favicon.ico'",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.keep.lines.map(({ line, reason }) => `${line} ${reason}`)).toEqual([
      '1 assets',
      '2 assets',
      '3 assets',
    ])
    expect(result.remove.dependencies).toEqual([])
  })

  it('removes a bare string entry in project.json but keeps it in tsconfig.json', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    const styles = [
      '{',
      '  "styles": [',
      '    "node_modules/@baloise/ds-styles/css/core.css",',
      '    "src/a.css"',
      '  ]',
      '}',
      '',
    ]
    write(root, 'project.json', styles.join('\n'))
    write(root, 'tsconfig.json', styles.join('\n'))

    const result = scanCleanup(root)

    expect(result.remove.lines.map(({ file, line, kind }) => `${file}:${line} ${kind}`)).toEqual([
      'project.json:3 import',
    ])
    expect(result.keep.lines.map(({ file, line, reason }) => `${file}:${line} ${reason}`)).toEqual([
      'tsconfig.json:3 manual',
    ])
  })

  it('removes the TODO when the next kept legacy line is not directly below it', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { react: '19.0.0' } })
    write(
      root,
      'src/main.ts',
      [
        `// ${TODO}`,
        "import '@helvetia-design/styles/css/design-system'",
        "import '@baloise/ds-styles/css/font.css'",
        '',
      ].join('\n'),
    )

    const result = scanCleanup(root)

    expect(result.remove.lines.map(({ line, kind }) => `${line} ${kind}`)).toEqual(['1 todo'])
    expect(result.keep.lines.map(({ line, reason }) => `${line} ${reason}`)).toEqual(['3 assets'])
  })

  it('removes the TODO when only commented-out legacy lines sit between it and the removed imports', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'src/main.ts',
      [`// ${TODO}`, "// import '@baloise/ds-styles/css/all.css'", "import '@baloise/ds-styles/css/core.css'", ''].join(
        '\n',
      ),
    )

    const result = scanCleanup(root)

    expect(result.remove.lines.map(({ line, kind }) => `${line} ${kind}`)).toEqual(['1 todo', '3 import'])
    expect(result.commented.map(({ line }) => line)).toEqual([2])
  })

  it('sorts lines by file name, not by directory order', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/B.scss', "@import '@baloise/ds-styles/css/core';\n")
    write(root, 'src/a.scss', "@import '@baloise/ds-styles/css/core';\n")

    expect(scanCleanup(root).remove.lines.map(({ file }) => file)).toEqual(['src/a.scss', 'src/B.scss'])
  })

  it('removes an uppercase <LINK> tag and keeps a legacy key in a nested dependencies object', () => {
    const root = createScratchDir()
    writeManifest(root, { config: { dependencies: { '@baloise/ds-styles': '19.0.0' } } })
    write(root, 'index.html', '<LINK REL="stylesheet" HREF="node_modules/@baloise/ds-styles/css/core.css">\n')

    const result = scanCleanup(root)

    expect(result.remove).toEqual({
      lines: [
        {
          file: 'index.html',
          line: 1,
          snippet: '<LINK REL="stylesheet" HREF="node_modules/@baloise/ds-styles/css/core.css">',
          kind: 'import',
        },
      ],
      dependencies: [],
    })
    expect(result.keep.lines.map(({ file, line, reason }) => `${file}:${line} ${reason}`)).toEqual([
      'package.json:4 manual',
    ])
  })

  it('keeps the core line and the TODO above it for CSS utils while a core.css class is left, and removes the structure line', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { 'react': '19.0.0', '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'src/main.tsx',
      [
        `/* ${TODO} */`,
        "import '@baloise/ds-styles/css/structure.css'",
        "import '@baloise/ds-styles/css/core.css'",
        '',
      ].join('\n'),
    )
    write(root, 'src/Table.tsx', 'export const T = () => <table className="table is-striped" />\n')

    const result = scanCleanup(root)

    expect(result.status).toBe('ready')
    expect(result.remove).toEqual({
      lines: [
        { file: 'src/main.tsx', line: 2, snippet: "import '@baloise/ds-styles/css/structure.css'", kind: 'import' },
      ],
      dependencies: [],
    })
    expect(result.keep.lines).toEqual([
      { file: 'src/main.tsx', line: 1, snippet: `/* ${TODO} */`, reason: 'legacy-below' },
      { file: 'src/main.tsx', line: 3, snippet: "import '@baloise/ds-styles/css/core.css'", reason: 'css-utils' },
    ])
    expect(result.keep.dependencies).toEqual([
      {
        packageJsonPath: 'package.json',
        field: 'dependencies',
        name: '@baloise/ds-styles',
        reason: 'used',
        usedBy: ['src/main.tsx:3'],
      },
    ])
  })

  it('keeps the core line while a core.css selector in code or a core-lost class is left', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n")
    write(root, 'src/main.ts', "document.querySelector('.link')\n")

    expect(scanCleanup(root).keep.lines).toEqual([
      { file: 'src/styles.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", reason: 'css-utils' },
    ])

    write(root, 'src/main.ts', '')
    write(root, 'src/upload.html', '<div class="file"></div>\n')

    expect(scanCleanup(root).keep.lines).toEqual([
      { file: 'src/styles.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", reason: 'css-utils' },
    ])
  })

  it('removes the core line when only the app stylesheet selects a core.css class', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n.card .title { margin: 0 }\n")

    const result = scanCleanup(root)

    expect(result.remove.lines).toEqual([
      { file: 'src/styles.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", kind: 'import' },
    ])
    expect(result.keep.lines).toEqual([])
  })

  it('keeps a minified core entry in angular.json while a core.css class is left', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@angular/core': '18.0.0', '@baloise/ds-styles': '19.0.0' } })
    write(
      root,
      'angular.json',
      [
        '{',
        '  "projects": {',
        '    "app": {',
        '      "architect": {',
        '        "build": {',
        '          "options": {',
        '            "styles": [',
        '              "node_modules/@baloise/ds-styles/css/core.min.css",',
        '              "src/styles.scss"',
        '            ]',
        '          }',
        '        }',
        '      }',
        '    }',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'src/app/app.component.html', '<table class="table"></table>\n')

    const result = scanCleanup(root)

    expect(result.remove.lines).toEqual([])
    expect(result.keep.lines).toEqual([
      {
        file: 'angular.json',
        line: 8,
        snippet: '"node_modules/@baloise/ds-styles/css/core.min.css",',
        reason: 'css-utils',
      },
    ])
  })

  it('removes the core line once only Helvetia classes and utility classes are left', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/main.ts', "import '@baloise/ds-styles/css/core'\nconst type = 'button'\n")
    write(root, 'src/a.html', '<table class="ds-table shadow-small"></table>\n')

    const result = scanCleanup(root)

    expect(result.remove.lines).toEqual([
      { file: 'src/main.ts', line: 1, snippet: "import '@baloise/ds-styles/css/core'", kind: 'import' },
    ])
    expect(result.keep.lines).toEqual([])
  })

  it('keeps the core line while a core.css class sits in an interpolation, a substitution or a mixed literal', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n")
    const kept = [
      { file: 'src/styles.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", reason: 'css-utils' },
    ]

    write(root, 'src/a.component.html', `<table class="{{ striped ? 'table is-striped' : 'table' }}"></table>\n`)
    expect(scanCleanup(root).keep.lines).toEqual(kept)

    write(root, 'src/a.component.html', '')
    write(root, 'src/b.tsx', "export const B = () => <table className={`${s ? 'table is-striped' : 'table'}`} />\n")
    expect(scanCleanup(root).keep.lines).toEqual(kept)

    write(root, 'src/b.tsx', "export const B = () => <div className={cx({ 'table shadow-small': on })} />\n")
    expect(scanCleanup(root).keep.lines).toEqual(kept)

    write(root, 'src/b.tsx', "const mixed = 'table shadow-small'\n")
    expect(scanCleanup(root).keep.lines).toEqual(kept)
  })

  it('keeps the core line while HostBinding, Renderer2 addClass or setAttribute sets a core.css class', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'src/styles.scss', "@import '@baloise/ds-styles/css/core';\n")
    const kept = [
      { file: 'src/styles.scss', line: 1, snippet: "@import '@baloise/ds-styles/css/core';", reason: 'css-utils' },
    ]

    for (const code of [
      "@HostBinding('class') cls = 'table'",
      "renderer.addClass(el, 'link')",
      "renderer.setAttribute(el, 'class', 'button')",
    ]) {
      write(root, 'src/a.component.ts', `${code}\n`)
      expect(scanCleanup(root).keep.lines).toEqual(kept)
    }
  })

  it('keeps legacy config imports for the legacy config step of Assets', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-core': '19.0.0', '@baloise/ds-react': '19.0.0' } })
    write(
      root,
      'src/main.ts',
      [
        "import { initializeBaloiseDesignSystem } from '@baloise/ds-core'",
        'import {',
        '  updateBalLanguage,',
        "} from '@baloise/ds-core'",
        "import { useBaloiseDesignSystem } from '@baloise/ds-react'",
        "import { something } from '@baloise/ds-core'",
        '',
      ].join('\n'),
    )

    expect(scanCleanup(root).keep.lines.map(({ line, reason }) => [line, reason])).toEqual([
      [1, 'legacy-config'],
      [4, 'legacy-config'],
      [5, 'legacy-config'],
      [6, 'manual'],
    ])
  })

  it('prints the scan JSON and exits 0', () => {
    const root = createScratchDir()
    writeManifest(root, { dependencies: { '@baloise/ds-styles': '19.0.0' } })
    write(root, 'main.ts', "import '@baloise/ds-styles/css/core'\n")
    let text = ''

    const code = run(root, {
      write(chunk: string) {
        text += chunk
      },
    })

    expect(code).toBe(0)
    expect(JSON.parse(text)).toEqual({
      status: 'ready',
      packageManager: 'npm',
      installCommand: 'npm install',
      remove: {
        lines: [{ file: 'main.ts', line: 1, snippet: "import '@baloise/ds-styles/css/core'", kind: 'import' }],
        dependencies: [{ packageJsonPath: 'package.json', field: 'dependencies', name: '@baloise/ds-styles' }],
      },
      keep: { lines: [], dependencies: [] },
      commented: [],
      unreadable: [],
    })
  })
})
