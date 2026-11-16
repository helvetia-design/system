import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { scanSourceFiles } from '../skills/ds-migrate-from-baloise/scripts/source-scan.mjs'

const SCRIPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/scripts')
const SCANNERS = readdirSync(SCRIPTS_DIR)
  .filter(name => /^scan-bal-.+\.mjs$/.test(name))
  .map(name => name.replace(/^scan-bal-/, '').replace(/\.mjs$/, ''))
  .sort()

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-paths-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

function scanFiles(root: string, paths: string[]) {
  const files: string[] = []
  const unmatched = scanSourceFiles(root, ({ file }: { file: string }) => files.push(file), { paths })
  return { files: files.sort(), unmatched }
}

describe('scanSourceFiles with paths', () => {
  it('walks the whole root without paths and returns no unmatched paths', () => {
    const root = createScratchDir()
    write(root, 'src/a.ts', '')
    write(root, 'b.html', '')

    expect(scanFiles(root, [])).toEqual({ files: ['b.html', 'src/a.ts'], unmatched: [] })
  })

  it('limits the walk to directories and files and visits each file once', () => {
    const root = createScratchDir()
    write(root, 'src/page/a.html', '')
    write(root, 'src/page/nested/b.ts', '')
    write(root, 'src/page/node_modules/c.ts', '')
    write(root, 'src/other/d.ts', '')
    write(root, 'src/other/e.ts', '')

    expect(scanFiles(root, ['src/page', './src/page/a.html', join(root, 'src/other/d.ts')])).toEqual({
      files: ['src/other/d.ts', 'src/page/a.html', 'src/page/nested/b.ts'],
      unmatched: [],
    })
  })

  it('lists missing paths, non-source files, skipped folders, and paths outside the root as unmatched', () => {
    const root = createScratchDir()
    write(root, 'src/a.ts', '')
    write(root, 'src/styles.scss', '')
    write(root, 'dist/b.ts', '')

    expect(
      scanFiles(root, ['src/missing.ts', 'src/styles.scss', 'dist/b.ts', 'dist', '../elsewhere', 'src/a.ts']),
    ).toEqual({
      files: ['src/a.ts'],
      unmatched: ['../elsewhere', 'dist', 'dist/b.ts', 'src/missing.ts', 'src/styles.scss'],
    })
  })

  it('walks the whole root when a path names the root', () => {
    const root = createScratchDir()
    write(root, 'src/a.ts', '')

    expect(scanFiles(root, ['.'])).toEqual({ files: ['src/a.ts'], unmatched: [] })
  })

  it('skips a build-output-named folder at the scan root even with no package.json there', () => {
    const root = createScratchDir()
    write(root, 'dist/bundle.html', '')
    write(root, 'src/a.html', '')

    expect(scanFiles(root, ['dist', 'src'])).toEqual({ files: ['src/a.html'], unmatched: ['dist'] })
  })

  it('reads a nested folder named like build output that sits beside no package.json', () => {
    const root = createScratchDir()
    write(root, 'package.json', '{}')
    write(root, 'src/app/coverage/coverage.component.html', '')
    write(root, 'dist/bundle.html', '')

    expect(scanFiles(root, ['src/app/coverage', 'dist'])).toEqual({
      files: ['src/app/coverage/coverage.component.html'],
      unmatched: ['dist'],
    })
  })

  it('skips a build-output-named folder nested beside its own package.json', () => {
    const root = createScratchDir()
    write(root, 'packages/widget/package.json', '{}')
    write(root, 'packages/widget/dist/bundle.html', '')
    write(root, 'packages/widget/src/a.html', '')

    expect(scanFiles(root, ['packages/widget'])).toEqual({
      files: ['packages/widget/src/a.html'],
      unmatched: [],
    })
  })
})

describe.each(SCANNERS)('scan-bal-%s with paths', slug => {
  it('scans only the given paths and reports unmatched ones', async () => {
    const { run } = await import(join(SCRIPTS_DIR, `scan-bal-${slug}.mjs`))
    const root = createScratchDir()
    const markup = `<bal-${slug}></bal-${slug}>\n`
    write(root, 'src/page/page.html', markup)
    write(root, 'src/page/nested/child.html', markup)
    write(root, 'src/other/other.html', markup)
    write(root, 'src/outside.html', markup)

    let output = ''
    const code = run(root, { write: (chunk: string) => (output += chunk) }, [
      'src/page',
      'src/other/other.html',
      'src/nope.ts',
    ])
    const result = JSON.parse(output)

    expect(code).toBe(0)
    expect(result.files.map(({ file }: { file: string }) => file).sort()).toEqual([
      'src/other/other.html',
      'src/page/nested/child.html',
      'src/page/page.html',
    ])
    expect(result.unmatched).toEqual(['src/nope.ts'])
  })

  it('forwards path arguments from the command line', () => {
    const root = createScratchDir()
    write(root, 'src/page/page.html', `<bal-${slug}></bal-${slug}>\n`)
    write(root, 'src/outside.html', `<bal-${slug}></bal-${slug}>\n`)

    const output = execFileSync(process.execPath, [join(SCRIPTS_DIR, `scan-bal-${slug}.mjs`), root, 'src/page'], {
      encoding: 'utf8',
    })

    expect(JSON.parse(output).files.map(({ file }: { file: string }) => file)).toEqual(['src/page/page.html'])
  })

  it('keeps the output shape without unmatched paths', async () => {
    const { run } = await import(join(SCRIPTS_DIR, `scan-bal-${slug}.mjs`))
    const root = createScratchDir()
    write(root, 'src/page.html', `<bal-${slug}></bal-${slug}>\n`)

    let output = ''
    run(root, { write: (chunk: string) => (output += chunk) }, ['src'])

    expect(Object.keys(JSON.parse(output)).sort()).toEqual(['files', 'total'])
  })
})
