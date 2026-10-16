import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { componentNameToSlug, run, scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-detect-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanMigratable', () => {
  it('suggests used components with migrations and separates unsupported components', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalFictional, BalSpinner } from '@baloise/ds-react'",
        'export const App = () => <><BalSpinner /><BalFictional /></>',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'spinner', total: 2 }],
      notYet: [{ name: 'fictional', total: 2 }],
    })
  })

  it('ignores Bal*Bundle arrays, which are groups of components and not components', () => {
    const root = createScratchDir()
    write(
      root,
      'shell.component.ts',
      [
        "import { BalLayoutBundle, BalTypographyBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [BalLayoutBundle, BalTypographyBundle] })',
        'export class ShellComponent {}',
        '',
      ].join('\n'),
    )
    write(root, 'index.html', '<bal-app></bal-app>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'app', total: 2 }],
      notYet: [],
    })
  })

  it('suggests app when the project uses bal-app', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalApp } from '@baloise/ds-react'", 'export const App = () => <BalApp />'].join('\n'),
    )
    write(root, 'index.html', '<bal-app></bal-app>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'app', total: 4 }],
      notYet: [],
    })
  })

  it('suggests accordion when the project uses bal-accordion and folds its child tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalAccordion } from '@baloise/ds-react'", 'export const App = () => <BalAccordion active />'].join(
        '\n',
      ),
    )
    write(
      root,
      'index.html',
      [
        '<bal-accordion active>',
        '  <bal-accordion-summary trigger></bal-accordion-summary>',
        '  <bal-accordion-details>Content</bal-accordion-details>',
        '</bal-accordion>',
        '',
      ].join('\n'),
    )

    // The child tags have no migration of their own; the accordion migration covers
    // them, so they count towards accordion rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'accordion', total: 8 }],
      notYet: [],
    })
  })

  it('suggests card when the project uses bal-card and folds its child tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalCard } from '@baloise/ds-react'", 'export const App = () => <BalCard flat />'].join('\n'),
    )
    write(
      root,
      'index.html',
      [
        '<bal-card flat>',
        '  <bal-card-title>Title</bal-card-title>',
        '  <bal-card-content>Body</bal-card-content>',
        '</bal-card>',
        '',
      ].join('\n'),
    )

    // The child tags have no migration of their own; the card migration covers
    // them, so they count towards card rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'card', total: 8 }],
      notYet: [],
    })
  })

  it('suggests carousel when the project uses bal-carousel and folds its child tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalCarousel } from '@baloise/ds-react'",
        'export const App = () => <BalCarousel controls="dots" />',
      ].join('\n'),
    )
    write(
      root,
      'index.html',
      [
        '<bal-carousel controls="dots">',
        '  <bal-carousel-item src="a.jpg"></bal-carousel-item>',
        '</bal-carousel>',
        '',
      ].join('\n'),
    )

    // The child tag has no migration of its own; the carousel migration covers
    // it, so it counts towards carousel rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'carousel', total: 6 }],
      notYet: [],
    })
  })

  it('suggests button when the project uses bal-button and folds the group tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalButton } from '@baloise/ds-react'", 'export const App = () => <BalButton color="primary" />'].join(
        '\n',
      ),
    )
    write(
      root,
      'index.html',
      ['<bal-button-group position="right">', '  <bal-button>Save</bal-button>', '</bal-button-group>', ''].join('\n'),
    )

    // bal-button-group has no migration of its own; the button migration covers
    // it, so it counts towards button rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'button', total: 6 }],
      notYet: [],
    })
  })

  it('suggests checkbox when the project uses bal-checkbox and folds the group tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalCheckbox } from '@baloise/ds-react'", 'export const App = () => <BalCheckbox value="1" />'].join(
        '\n',
      ),
    )
    write(
      root,
      'index.html',
      ['<bal-checkbox-group control>', '  <bal-checkbox value="1"></bal-checkbox>', '</bal-checkbox-group>', ''].join(
        '\n',
      ),
    )

    // bal-checkbox-group has no migration of its own; the checkbox migration covers
    // it, so it counts towards checkbox rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'checkbox', total: 6 }],
      notYet: [],
    })
  })

  it('suggests hint, folding the hint-title and hint-text children into it', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-hint>',
        '  <bal-hint-title>Title</bal-hint-title>',
        '  <bal-hint-text>Text</bal-hint-text>',
        '</bal-hint>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'hint', total: 6 }],
      notYet: [],
    })
  })

  it('suggests input, folding bal-input-date into it and leaving sibling components in notYet', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-input name="a"></bal-input>',
        '<bal-input-date name="d"></bal-input-date>',
        '<bal-input-group></bal-input-group>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'input', total: 4 }],
      notYet: [{ name: 'input-group', total: 2 }],
    })
  })

  it('suggests file-upload when the project uses bal-file-upload', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalFileUpload } from '@baloise/ds-react'",
        'export const App = () => <BalFileUpload label="Drop" />',
      ].join('\n'),
    )
    write(root, 'index.html', '<bal-file-upload label="Drop"></bal-file-upload>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'file-upload', total: 4 }],
      notYet: [],
    })
  })

  it('suggests toast when the project uses bal-toast', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalToast } from '@baloise/ds-react'", 'export const App = () => <BalToast message="Hi" />'].join('\n'),
    )
    write(root, 'index.html', '<bal-toast message="Hi"></bal-toast>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'toast', total: 4 }],
      notYet: [],
    })
  })

  it('suggests text when the project uses bal-text', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalText } from '@baloise/ds-react'", 'export const App = () => <BalText>Hi</BalText>'].join('\n'),
    )
    write(root, 'index.html', '<bal-text>Hi</bal-text>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'text', total: 5 }],
      notYet: [],
    })
  })

  it('suggests tooltip when the project uses bal-tooltip', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalTooltip } from '@baloise/ds-react'",
        'export const App = () => <BalTooltip reference="save">Hint</BalTooltip>',
      ].join('\n'),
    )
    write(root, 'index.html', '<bal-tooltip reference="save">Hint</bal-tooltip>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'tooltip', total: 5 }],
      notYet: [],
    })
  })

  it('suggests badge when the project uses bal-badge', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalBadge } from '@baloise/ds-react'", 'export const App = () => <BalBadge>2</BalBadge>'].join('\n'),
    )
    write(root, 'index.html', '<bal-badge color="grey">2</bal-badge>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'badge', total: 5 }],
      notYet: [],
    })
  })

  it('suggests close when the project uses bal-close', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalClose } from '@baloise/ds-react'", 'export const App = () => <BalClose size="small" />'].join('\n'),
    )
    write(root, 'index.html', '<bal-close inverted></bal-close>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'close', total: 4 }],
      notYet: [],
    })
  })

  it('suggests content when the project uses bal-content', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalContent } from '@baloise/ds-react'", 'export const App = () => <BalContent space="small" />'].join(
        '\n',
      ),
    )
    write(root, 'index.html', '<bal-content align="center"></bal-content>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'content', total: 4 }],
      notYet: [],
    })
  })

  it('suggests data when the project uses bal-data and folds its child tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalData } from '@baloise/ds-react'", 'export const App = () => <BalData horizontal />'].join('\n'),
    )
    write(
      root,
      'index.html',
      [
        '<bal-data>',
        '  <bal-data-item>',
        '    <bal-data-label>Name</bal-data-label>',
        '    <bal-data-value>Ada</bal-data-value>',
        '  </bal-data-item>',
        '</bal-data>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'data', total: 10 }],
      notYet: [],
    })
  })

  it('suggests date when the project uses bal-date and folds its internal calendar tags in', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-date></bal-date>', '<bal-date-calendar></bal-date-calendar>', ''].join('\n'))

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'date', total: 4 }],
      notYet: [],
    })
  })

  it('suggests divider when the project uses bal-divider', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalDivider } from '@baloise/ds-react'", 'export const App = () => <BalDivider space="small" />'].join(
        '\n',
      ),
    )
    write(root, 'index.html', '<bal-divider color="white"></bal-divider>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'divider', total: 4 }],
      notYet: [],
    })
  })

  it('suggests footer when the project uses bal-footer', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-footer></bal-footer>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'footer', total: 2 }],
      notYet: [],
    })
  })

  it('suggests heading when the project uses bal-heading', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-heading level="h2"></bal-heading>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'heading', total: 2 }],
      notYet: [],
    })
  })

  it('suggests icon when the project uses bal-icon', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      ["import { BalIcon } from '@baloise/ds-react'", 'export const App = () => <BalIcon name="plus" />'].join('\n'),
    )
    write(root, 'index.html', '<bal-icon name="check"></bal-icon>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'icon', total: 4 }],
      notYet: [],
    })
  })

  it('returns no suggestions when only unsupported components are used', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-fictional></bal-fictional>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [],
      notYet: [{ name: 'fictional', total: 2 }],
    })
  })

  it('skips comments, ordinary strings, and build output', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.ts',
      [
        '// <BalButton />',
        "const example = '<BalButton />'",
        '@Component({ template: `<bal-spinner></bal-spinner>` })',
      ].join('\n'),
    )
    write(root, 'dist/index.html', '<bal-button></bal-button>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'spinner', total: 2 }],
      notYet: [],
    })
  })

  it('prints the detection result as JSON', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-spinner></bal-spinner>\n')
    let text = ''

    expect(
      run(root, {
        write(chunk: string) {
          text += chunk
        },
      }),
    ).toBe(0)
    expect(JSON.parse(text)).toEqual({
      suggested: [{ name: 'spinner', total: 2 }],
      notYet: [],
    })
  })
})

describe('componentNameToSlug', () => {
  it('converts PascalCase component names to kebab-case slugs', () => {
    expect(componentNameToSlug('DatePicker')).toBe('date-picker')
    expect(componentNameToSlug('XMLViewer')).toBe('xml-viewer')
  })
})
