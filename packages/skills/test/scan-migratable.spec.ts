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
      types: [],
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
      suggested: [{ name: 'app', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('does not count the BaloiseDesignSystemModule config call as a component', () => {
    const root = createScratchDir()
    write(
      root,
      'app.module.ts',
      [
        "import { BaloiseDesignSystemModule } from '@baloise/ds-angular-legacy'",
        '@NgModule({ imports: [BaloiseDesignSystemModule.forRoot({ defaults: { region: "BE" } })] })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({ suggested: [], notYet: [], types: [] })
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
      suggested: [{ name: 'app', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'accordion', total: 5 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests steps when the project uses bal-steps and folds its child tag and option type in', () => {
    const root = createScratchDir()
    write(root, 'steps.ts', "import { BalStepOption } from '@baloise/ds-core'\nconst options: BalStepOption[] = []\n")
    write(
      root,
      'index.html',
      [
        '<bal-steps value="a">',
        '  <bal-step-item value="a" label="One"></bal-step-item>',
        '</bal-steps>',
        '<bal-input-stepper></bal-input-stepper>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'input-stepper', total: 1 },
        { name: 'steps', total: 4 },
      ],
      notYet: [],
      types: [],
    })
  })

  it('suggests steps for a bare bal-step-item without a bal-steps parent', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-step-item value="a" label="One"></bal-step-item>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'steps', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests tag when the project uses bal-tag and folds its group tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-tag-group>', '  <bal-tag closable>Hi</bal-tag>', '</bal-tag-group>', '<bal-tab></bal-tab>', ''].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'tag', total: 2 }],
      notYet: [{ name: 'tab', total: 1 }],
      types: [],
    })
  })

  it('suggests tabs when the project uses bal-tabs and folds its child tag and option type in', () => {
    const root = createScratchDir()
    write(root, 'tabs.ts', "import { BalTabOption } from '@baloise/ds-core'\nconst options: BalTabOption[] = []\n")
    write(
      root,
      'index.html',
      ['<bal-tabs value="a">', '  <bal-tab-item value="a" label="One"></bal-tab-item>', '</bal-tabs>', ''].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'tabs', total: 4 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests tabs for a bare bal-tab-item without a bal-tabs parent', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-tab-item value="a" label="One"></bal-tab-item>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'tabs', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests textarea when the project uses bal-textarea', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-textarea name="a"></bal-textarea>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'textarea', total: 1 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'card', total: 5 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'carousel', total: 4 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'button', total: 4 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'checkbox', total: 4 }],
      notYet: [],
      types: [],
    })
  })

  it('folds bal-check and bal-switch into checkbox instead of listing them as notYet', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-check checked></bal-check>', '<bal-switch></bal-switch>', ''].join('\n'))
    write(
      root,
      'App.tsx',
      ["import { BalCheck, BalSwitch } from '@baloise/ds-react'", 'export const App = () => <BalSwitch />'].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'checkbox', total: 5 }],
      notYet: [],
      types: [],
    })
  })

  it('folds bal-ng-error and BalNgErrorComponent into field instead of listing them as notYet', () => {
    const root = createScratchDir()
    write(root, 'app.component.html', '<bal-ng-error controlName="email">Required</bal-ng-error>\n')
    write(
      root,
      'app.component.ts',
      [
        "import { BalNgErrorComponent } from '@baloise/ds-angular'",
        '@Component({ imports: [BalNgErrorComponent] })',
        'export class AppComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'field', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('counts bal-notices for toast instead of listing it as notYet', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-notices interface="toast"></bal-notices>\n')
    write(
      root,
      'App.tsx',
      [
        "import { BalNotices } from '@baloise/ds-react'",
        'defineBalNotices()',
        'export const App = () => <BalNotices />',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'toast', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('does not fold a bal-check-list lookalike into checkbox', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-check-list></bal-check-list>\n')

    expect(scanMigratable(root).suggested).toEqual([])
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
      suggested: [{ name: 'hint', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests input, folding bal-input-date and bal-input-group into it', () => {
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
      suggested: [{ name: 'input', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('counts an HTMLBal*Element type for its component', () => {
    const root = createScratchDir()
    write(root, 'src/field.directive.ts', 'constructor(private el: ElementRef<HTMLBalInputElement>) {}\n')

    expect(scanMigratable(root)).toEqual({ suggested: [{ name: 'input', total: 1 }], notYet: [], types: [] })
  })

  it('counts the React BalInputGroup import and tag for input', () => {
    const root = createScratchDir()
    write(
      root,
      'Search.tsx',
      [
        "import { BalInputGroup } from '@baloise/ds-react'",
        'export const Search = () => <BalInputGroup></BalInputGroup>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'input', total: 2 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests dropdown, form, table and time-input and folds bal-option and bal-option-list into dropdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-form novalidate>',
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
    write(
      root,
      'src/options.ts',
      "import { BalOption } from '@baloise/ds-core'\nexport const options: BalOption[] = []\n",
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'dropdown', total: 5 },
        { name: 'form', total: 1 },
        { name: 'table', total: 1 },
        { name: 'time-input', total: 1 },
      ],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'file-upload', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'toast', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'text', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'tooltip', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'badge', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'close', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'content', total: 3 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'data', total: 6 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests date when the project uses bal-date and folds its internal calendar tags in', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-date></bal-date>', '<bal-date-calendar></bal-date-calendar>', ''].join('\n'))

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'date', total: 2 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'divider', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests footer when the project uses bal-footer', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-footer></bal-footer>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'footer', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests heading when the project uses bal-heading', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-heading level="h2"></bal-heading>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'heading', total: 1 }],
      notYet: [],
      types: [],
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
      suggested: [{ name: 'icon', total: 3 }],
      notYet: [],
      types: [],
    })
  })

  it('suggests button for a React app whose JSX lives only in .js files', () => {
    const root = createScratchDir()
    write(root, 'src/App.js', 'export const App = () => <bal-button>Hi</bal-button>\n')

    expect(scanMigratable(root)).toEqual({ suggested: [{ name: 'button', total: 1 }], notYet: [], types: [] })
  })

  it('suggests button for a Vue template and finds .js and .vue paths', () => {
    const root = createScratchDir()
    write(root, 'src/App.js', 'export const App = () => <bal-button>Hi</bal-button>\n')
    write(root, 'src/g.vue', '<template>\n  <bal-button>Go</bal-button>\n</template>\n')

    expect(scanMigratable(root, ['src/App.js', 'src/g.vue'])).toEqual({
      suggested: [{ name: 'button', total: 2 }],
      notYet: [],
      types: [],
      files: [
        { file: 'src/App.js', components: [{ name: 'button', total: 1 }] },
        { file: 'src/g.vue', components: [{ name: 'button', total: 1 }] },
      ],
    })
  })

  it('returns no suggestions when only unsupported components are used', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-fictional></bal-fictional>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [],
      notYet: [{ name: 'fictional', total: 1 }],
      types: [],
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
      suggested: [{ name: 'spinner', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('finds tags after an apostrophe, a URL or a regex literal on the same line', () => {
    const root = createScratchDir()
    write(root, 'a.html', "<p>Don't panic <bal-button>x</bal-button></p>\n")
    write(root, 'b.ts', "@Component({ template: `<p>Don't forget</p> <bal-button>Save</bal-button>` })\n")
    write(root, 'c.tsx', 'const A = () => <p>see http://x <BalButton/></p>\n')
    write(root, 'd.tsx', 'const r = /"/; const B = () => <BalButton/>\n')
    write(root, 'e.html', "<p>l'assurance <bal-tag>a</bal-tag> dell'anno <bal-card></bal-card></p>\n")

    expect(scanMigratable(root, ['.']).files).toEqual([
      { file: 'a.html', components: [{ name: 'button', total: 1 }] },
      { file: 'b.ts', components: [{ name: 'button', total: 1 }] },
      { file: 'c.tsx', components: [{ name: 'button', total: 1 }] },
      { file: 'd.tsx', components: [{ name: 'button', total: 1 }] },
      {
        file: 'e.html',
        components: [
          { name: 'card', total: 1 },
          { name: 'tag', total: 1 },
        ],
      },
    ])
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
      suggested: [{ name: 'spinner', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('limits the scan to the given paths and breaks the counts down per file', () => {
    const root = createScratchDir()
    write(
      root,
      'src/page/page.component.html',
      '<bal-card><bal-card-title>T</bal-card-title><bal-fictional></bal-fictional><bal-button>Go</bal-button></bal-card>\n',
    )
    write(root, 'src/page/page.component.ts', "import { BalCard } from '@baloise/ds-angular'\n")
    write(root, 'src/page/empty.ts', 'export const nothing = 1\n')
    write(root, 'src/other/other.html', '<bal-tag></bal-tag>\n')

    expect(scanMigratable(root, ['src/page', 'src/missing.html'])).toEqual({
      suggested: [
        { name: 'button', total: 1 },
        { name: 'card', total: 3 },
      ],
      notYet: [{ name: 'fictional', total: 1 }],
      types: [],
      files: [
        {
          file: 'src/page/page.component.html',
          components: [
            { name: 'button', total: 1 },
            { name: 'card', total: 2 },
            { name: 'fictional', total: 1 },
          ],
        },
        { file: 'src/page/page.component.ts', components: [{ name: 'card', total: 1 }] },
      ],
      unmatched: ['src/missing.html'],
    })
  })

  it('prints the per-file breakdown without unmatched when every path matches', () => {
    const root = createScratchDir()
    write(root, 'src/a.html', '<bal-tag></bal-tag>\n')
    let text = ''

    expect(
      run(
        root,
        {
          write(chunk: string) {
            text += chunk
          },
        },
        ['src/a.html'],
      ),
    ).toBe(0)
    expect(JSON.parse(text)).toEqual({
      suggested: [{ name: 'tag', total: 1 }],
      notYet: [],
      types: [],
      files: [{ file: 'src/a.html', components: [{ name: 'tag', total: 1 }] }],
    })
  })

  it('maps services, controllers, modules and events to their component and lists type namespaces as types', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.ts',
      [
        "import { BalToastService, BalModalService, BalButtonModule, BalInputCustomEvent, BalBreakpointsService, BalConfigState } from '@baloise/ds-angular'",
        "import { balToastController, BalModalController } from '@baloise/ds-core'",
        '',
      ].join('\n'),
    )
    write(root, 'src/a.html', ['<button bal-popup="p1">x</button>', '<bal-select></bal-select>', ''].join('\n'))

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'button', total: 1 },
        { name: 'input', total: 1 },
        { name: 'modal', total: 2 },
        { name: 'popup', total: 1 },
        { name: 'select', total: 1 },
        { name: 'toast', total: 2 },
      ],
      notYet: [],
      types: [
        { name: 'breakpoints', total: 1 },
        { name: 'config', total: 1 },
      ],
    })
  })

  it('counts a BalEvents or BalProps member only when it maps to an available migration', () => {
    const root = createScratchDir()
    write(
      root,
      'src/segment.component.ts',
      [
        "import { BalEvents, BalProps, BalLanguage } from '@baloise/ds-angular'",
        'export class SegmentComponent {',
        "  language: BalLanguage = 'de'",
        '  onChange(event: BalEvents.BalSegmentCustomEvent<BalProps.BalSegmentValue>) {}',
        '  onOpen(event: BalEvents . BalPopoverCustomEvent<boolean>) {}',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'segment', total: 1 }],
      notYet: [],
      types: [
        { name: 'events', total: 3 },
        { name: 'language', total: 2 },
        { name: 'props', total: 2 },
      ],
    })
  })

  it('suggests snackbar for a lowercase controller alone', () => {
    const root = createScratchDir()
    write(
      root,
      'src/notify.ts',
      [
        "balSnackbarController.create({ message: 'Saved' })",
        'const a = globalToastController',
        'const b = balController',
        'const c = balToastControllerFactory',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'snackbar', total: 1 }],
      notYet: [],
      types: [],
    })
  })

  it('counts the bal-popup trigger attribute in every binding form and the bal-popup tag once', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.html',
      [
        '<button bal-popup="p1">x</button>',
        '<button bal-popup>x</button>',
        '<button [bal-popup]="id">x</button>',
        '<button [attr.bal-popup]="id">x</button>',
        '<button\n  [attr.bal-popup]="id">x</button>',
        '<bal-popup id="p1" bal-popup-placement="bottom"></bal-popup>',
        '<button [class.bal-popup]="open">x</button>',
        '<p>Open the bal-popup to continue</p>',
        '<style>',
        '.bal-popup { color: red }',
        'bal-popup { display: block }',
        '[bal-popup] { outline: 0 }',
        '</style>',
        '',
      ].join('\n'),
    )
    write(root, 'src/a.scss', '.bal-popup { color: red; }\nbal-popup { display: block; }\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'popup', total: 6 }],
      notYet: [],
      types: [],
    })
  })

  it('strips every service, type and event suffix and keeps a bare suffix name as its own slug', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.ts',
      [
        "import { BalToastOptions, BalSnackbarProps, BalFooterEvents, BalTabsDetail } from '@baloise/ds-core'",
        "import { BalModalServiceOptions, BalOptions } from '@baloise/ds-angular'",
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'footer', total: 1 },
        { name: 'modal', total: 1 },
        { name: 'snackbar', total: 1 },
        { name: 'tabs', total: 1 },
        { name: 'toast', total: 1 },
      ],
      notYet: [{ name: 'options', total: 1 }],
      types: [],
    })
  })

  it('lists language, region, breakpoint, platform and config types, also behind a suffix', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.ts',
      [
        "import { BalSwissLanguage, BalLanguageService, BalRegion, BalBreakpoint } from '@baloise/ds-core'",
        "import { BalBreakpointsService, BalPlatformConfig, BalConfigState } from '@baloise/ds-angular'",
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [],
      notYet: [],
      types: [
        { name: 'breakpoints', total: 2 },
        { name: 'config', total: 1 },
        { name: 'language', total: 2 },
        { name: 'platform', total: 1 },
        { name: 'region', total: 1 },
      ],
    })
  })

  it('keeps types out of the per-file breakdown when paths are given', () => {
    const root = createScratchDir()
    write(root, 'src/a.ts', "import { BalLanguage } from '@baloise/ds-core'\nbalToastController.create({})\n")

    expect(scanMigratable(root, ['src'])).toEqual({
      suggested: [{ name: 'toast', total: 1 }],
      notYet: [],
      types: [{ name: 'language', total: 1 }],
      files: [{ file: 'src/a.ts', components: [{ name: 'toast', total: 1 }] }],
    })
  })

  it('counts a JSX element once and not its closing tag', () => {
    const root = createScratchDir()
    write(root, 'App.tsx', 'export const App = () => <BalText>Hi</BalText>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'text', total: 1 }],
      notYet: [],
      types: [],
    })
  })
})

describe('componentNameToSlug', () => {
  it('converts PascalCase component names to kebab-case slugs', () => {
    expect(componentNameToSlug('DatePicker')).toBe('date-picker')
    expect(componentNameToSlug('XMLViewer')).toBe('xml-viewer')
  })
})
