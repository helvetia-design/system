const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')
const { resolveComponentPath } = require('../_shared/component-categories')
const { playwrightComponentsDir } = require('../_shared/ds-context')

const REPO_ROOT = path.resolve(__dirname, '../../..')

async function testComponent(componentName) {
  const componentPath = resolveComponentPath(REPO_ROOT, componentName)

  if (!componentPath || !fs.existsSync(componentPath)) {
    throw new Error(`Component not found: ${componentName}`)
  }

  const tsxFiles = globSync(`${componentPath}/**/*.tsx`).filter(
    f => !f.includes('.spec.') && !f.includes('.visual.') && !f.includes('.a11y.'),
  )

  if (tsxFiles.length === 0) {
    throw new Error(`No .tsx files found in ${componentName}`)
  }

  console.log(`\n📋 Preparing to generate tests for: ${componentName}\n`)

  // Parse component
  const componentInfo = parseComponent(tsxFiles[0])

  console.log(`Detected:
  • Props: ${componentInfo.props.length} (${componentInfo.enumProps.length} enums, ${componentInfo.stateProps.length} states)
  • Events: ${componentInfo.events.length}
  • Slots: ${componentInfo.slots.length}
  • Parts: ${componentInfo.parts.length}
  • Utils: ${componentInfo.hasUtils ? 'Yes' : 'No'}\n`)

  // Show checklists
  const visualProps = await promptVisualProps(componentInfo.enumProps, componentInfo.stateProps)
  const slotsToDemo = await promptSlots(componentInfo.slots)

  // Generate files
  const files = generateTestFiles(componentName, componentInfo, visualProps, slotsToDemo)

  // Report
  reportGeneration(componentName, files)
}

function parseComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')

  return {
    path: filePath,
    props: extractProps(content),
    enumProps: extractEnumProps(content),
    stateProps: extractStateProps(content),
    events: extractEvents(content),
    slots: extractSlots(content),
    parts: extractParts(content),
    hasUtils: checkHasUtils(filePath),
  }
}

function extractProps(content) {
  const propPattern = /@Prop\s*\({[^}]*}\)?\s*readonly\s+(\w+)\s*:\s*([^\s=]+)/g
  const props = []
  let match

  while ((match = propPattern.exec(content)) !== null) {
    props.push({ name: match[1], type: match[2] })
  }

  return props
}

function extractEnumProps(content) {
  // Simplified: look for props with pipe-separated values (enums)
  const props = extractProps(content)
  return props.filter(p => p.type.includes('|') || (p.type !== 'string' && p.type !== 'boolean' && p.type !== 'number'))
}

function extractStateProps(content) {
  const stateNames = ['disabled', 'loading', 'invalid', 'checked', 'selected', 'open', 'readonly', 'required']
  const props = extractProps(content)
  return props.filter(p => stateNames.includes(p.name))
}

function extractEvents(content) {
  const eventPattern = /@Event\s*\(\)\s*(\w+)/g
  const events = []
  let match

  while ((match = eventPattern.exec(content)) !== null) {
    events.push(match[1])
  }

  return events
}

function extractSlots(content) {
  const slotPattern = /<slot\s+(?:name="([^"]+)")?\s*\/>/g
  const slots = []
  let match
  const seen = new Set()

  // Add default slot
  if (/<slot\s*\/>/.test(content)) {
    slots.push({ name: 'default', type: 'default' })
    seen.add('default')
  }

  while ((match = slotPattern.exec(content)) !== null) {
    const name = match[1] || 'default'
    if (!seen.has(name)) {
      slots.push({ name, type: 'named' })
      seen.add(name)
    }
  }

  return slots
}

function extractParts(content) {
  const partPattern = /@part\s+(\w+)/g
  const parts = []
  let match

  while ((match = partPattern.exec(content)) !== null) {
    parts.push(match[1])
  }

  return parts
}

function checkHasUtils(filePath) {
  const dir = path.dirname(filePath)
  const utilFile = path.join(dir, path.basename(filePath, '.tsx') + '.util.ts')
  return fs.existsSync(utilFile)
}

async function promptVisualProps(enumProps, stateProps) {
  // For now, return all (interactive prompts would be implemented in actual CLI)
  return {
    enums: enumProps,
    states: stateProps,
  }
}

async function promptSlots(slots) {
  // For now, return all (interactive prompts would be implemented)
  return slots
}

function generateTestFiles(componentName, componentInfo, visualProps, slotsToDemo) {
  const testDir = path.join(resolveComponentPath(REPO_ROOT, componentName), 'test')

  const poDir = playwrightComponentsDir(REPO_ROOT)

  const files = []

  // The fixture is the engineer's; its data-testid sections tell us what to screenshot.
  const variants = readVariantsFromFixture(path.join(testDir, `${componentName}.visual.html`))
  const urlDir = componentUrlDir(REPO_ROOT, componentName)

  const stylePath = path.join(testDir, `${componentName}.style.html`)
  const styleVariants = fs.existsSync(stylePath) ? readVariantsFromFixture(stylePath) : null

  // variants.ts — one list, shared by the visual and SSR suites.
  const variantsTs = generateVariantsTs(componentName, variants)
  files.push({ path: path.join(testDir, `${componentName}.variants.ts`), content: variantsTs, type: 'variants' })

  // Generate visual.play.ts
  const visualPlayTs = generateVisualPlayTs(componentName, styleVariants, urlDir)
  const visualPlayTsPath = path.join(testDir, `${componentName}.visual.play.ts`)
  files.push({ path: visualPlayTsPath, content: visualPlayTs, type: 'visual' })

  // SSR only where there is a shadow root to hydrate: CSS-only components have no .host.scss.
  if (hasShadowRoot(REPO_ROOT, componentName)) {
    const ssrPlayTs = generateSsrPlayTs(componentName, componentInfo, urlDir)
    files.push({ path: path.join(testDir, `${componentName}.ssr.play.ts`), content: ssrPlayTs, type: 'ssr' })
  }

  // Generate component.play.ts
  const componentPlayTs = generateComponentPlayTs(componentName, componentInfo)
  const componentPlayTsPath = path.join(testDir, `${componentName}.component.play.ts`)
  files.push({ path: componentPlayTsPath, content: componentPlayTs, type: 'component' })

  // Generate page object
  const poTs = generatePageObject(componentName, componentInfo)
  const poTsPath = path.join(poDir, `${componentName}.po.ts`)
  files.push({ path: poTsPath, content: poTs, type: 'page-object' })

  // Generate util tests if applicable
  if (componentInfo.hasUtils) {
    const utilSpecTs = generateUtilSpecTs(componentName)
    const utilSpecTsPath = path.join(testDir, `${componentName}.util.spec.ts`)
    files.push({ path: utilSpecTsPath, content: utilSpecTs, type: 'util' })
  }

  return files
}

/**
 * SSR/hydration only means something where there is a shadow root. A CSS-only component
 * (`.style.scss`, no `.host.scss`) renders as plain classed HTML, so it gets no SSR test —
 * see the component-type taxonomy in packages/core/CONTEXT.md.
 */
function hasShadowRoot(repoRoot, componentName) {
  const dir = resolveComponentPath(repoRoot, componentName)
  return globSync(`${dir}/*.host.scss`).length > 0
}

/** One variant list, imported by both the visual and the SSR suite. */
function generateVariantsTs(componentName, variants) {
  return `export const TAG = '${componentName}'

export const HOST_VARIANTS = [${variants.map(v => `\n  '${v}',`).join('')}
]
`
}

function generateSsrPlayTs(componentName, componentInfo, urlDir) {
  const className = 'Ds' + componentName.charAt(0).toUpperCase() + componentName.slice(1)

  return `import {
  ${className},
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './${componentName}.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = \`${urlDir}/test/\${TAG}.visual.html\`

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})

test.describe('mountSsr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, \`<ds-${componentName}>Content</ds-${componentName}>\`, renderToString, testInfo)

    const ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)} = new ${className}(page.locator('ds-${componentName}'))
    await ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)}.assertToBeVisible()
  })
})
`
}

/** The dev server mirrors the source tree, so the URL carries the category folder. */
function componentUrlDir(repoRoot, componentName) {
  const abs = resolveComponentPath(repoRoot, componentName)
  const idx = abs.indexOf(`${path.sep}components${path.sep}`)
  return abs.slice(idx).split(path.sep).join('/')
}

/**
 * The visual fixture is the component-engineer's artifact, not ours — it is how a human
 * reviews the component before any test exists. We read its `data-testid` sections to learn
 * which variants to screenshot; a variant with no section gets no test.
 */
function readVariantsFromFixture(fixturePath) {
  if (!fs.existsSync(fixturePath)) {
    throw new Error(
      `Missing visual fixture: ${fixturePath}\n` +
        'The component-engineer builds test/<name>.visual.html (ds-implement-component, Phase 5).\n' +
        'Ask for it before generating visual tests — do not author it here.\n' +
        'A CSS-only component has test/<name>.style.html instead and no .tsx, so it never reaches here.',
    )
  }
  const html = fs.readFileSync(fixturePath, 'utf-8')
  const ids = [...html.matchAll(/data-testid="([^"]+)"/g)].map(m => m[1])
  const unique = [...new Set(ids)]
  if (unique.length === 0) {
    throw new Error(`No <section data-testid="..."> found in ${fixturePath} — nothing to screenshot.`)
  }
  return unique
}

function generateVisualPlayTs(componentName, styleVariants, urlDir) {
  const styleBlock = styleVariants
    ? `const STYLE_VARIANTS = [${styleVariants.map(v => `\n  '${v}',`).join('')}
] as const

`
    : ''

  return `import { expectScreenshot, screenshot, test } from '@helvetia-design/playwright'
import { HOST_VARIANTS, TAG } from './${componentName}.variants'

${styleBlock}const image = screenshot(TAG)

${
  styleVariants
    ? `test.describe('style', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(\`${urlDir}/test/\${TAG}.style.html\`)
  })

  STYLE_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(\`style-\${variant}\`))
    })
  })
})

`
    : ''
}test.describe('host', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(\`${urlDir}/test/\${TAG}.visual.html\`)
  })

  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })
})
`
}

function generateComponentPlayTs(componentName, componentInfo) {
  let content = `import { Ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)}, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
`

  // Event tests
  if (componentInfo.events.length > 0) {
    content += `\n  test.describe('events', () => {`
    componentInfo.events.forEach(event => {
      content += `
    test('should fire ${event} event', async ({ page }) => {
      await page.mount(\`<ds-${componentName}>Content</ds-${componentName}>\`)
      const ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)} = new Ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)}(page.locator('ds-${componentName}'))
      const spy = await ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)}.el.spyOnEvent('${event}')

      // TODO: trigger action that fires ${event}

      expect(spy).toHaveReceivedEventTimes(1)
    })`
    })
    content += `\n  })\n`
  }

  // State tests
  if (componentInfo.stateProps.length > 0) {
    content += `\n  test.describe('states', () => {`
    componentInfo.stateProps.forEach(state => {
      content += `
    test('should handle ${state} state', async ({ page }) => {
      await page.mount(\`<ds-${componentName} ${state}>Content</ds-${componentName}>\`)
      const ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)} = new Ds${componentName.charAt(0).toUpperCase() + componentName.slice(1)}(page.locator('ds-${componentName}'))

      // TODO: add assertions for ${state} state
    })`
    })
    content += `\n  })\n`
  }

  content += `})
`

  return content
}

function generatePageObject(componentName, componentInfo) {
  const className = componentName.charAt(0).toUpperCase() + componentName.slice(1)

  let content = `import { expect } from '@playwright/test'
import { PageObject } from './page-object'
import { E2ELocator } from '../page/utils'

export class Ds${className} extends PageObject {
  constructor(el: E2ELocator) {
    super(el)
  }

`

  // Part locators
  if (componentInfo.parts.length > 0) {
    componentInfo.parts.forEach(part => {
      content += `  readonly ${part} = this.el.locator('[part="${part}"]')\n`
    })
    content += '\n'
  }

  // Action methods
  content += `  async click() {
    await this.el.click()
  }

`

  // State assertions
  if (componentInfo.stateProps.length > 0) {
    componentInfo.stateProps.forEach(state => {
      const methodName = state.charAt(0).toUpperCase() + state.slice(1)
      content += `  async assertToBe${methodName}() {
    await expect(this.el).toHaveAttribute('${state}')
  }

`
    })
  }

  content += `  async assertToContainText(text: string) {
    await expect(this.el).toContainText(text)
  }
}
`

  return content
}

function generateUtilSpecTs(componentName) {
  return `import { describe, it, expect } from 'vitest'
// import { someUtil } from './${componentName}.util'

describe('${componentName} utils', () => {
  // Add comprehensive unit tests here
  // Include happy paths, edge cases, and type variations
})
`
}

function reportGeneration(componentName, files) {
  console.log(`📝 Test files to be generated:\n`)

  files.forEach(file => {
    const lines = file.content.split('\n').length
    console.log(`  ✓ ${path.basename(file.path)} (${lines} lines, ${file.type})`)
  })

  console.log(`\n✅ Ready to generate ${files.length} test files`)
  console.log(`\nNext steps:\n`)
  console.log(`  1. Review the generated files`)
  console.log(`  2. Fill in event handlers and state assertions`)
  console.log(`  3. Run visual tests: pnpm play -- --grep "${componentName}"`)
  console.log(`  4. Run unit tests: pnpm test -- ${componentName}.util.spec.ts`)
  console.log(`  5. a11y coverage (.a11y.play.ts) is the a11y-expert's — hand it off\n`)
}

module.exports = {
  testComponent,
}
