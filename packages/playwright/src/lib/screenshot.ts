export const screenshot = (tag: string) => (name: string) => `${tag}__${name}.png`

// Same replacement as Playwright's own snapshot-name sanitizing, which array names skip.
const sanitize = (name: string) => name.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, '-')

/**
 * Names the baseline that `screenshot(tag)(name)` produced in the visual test `visualTestFile`, so another
 * test file in the same folder can compare against it. Pair it with a `snapshotPathTemplate` of
 * `{testDir}/{testFileDir}/{arg}-<visual project name>{-snapshotSuffix}{ext}`.
 */
export const visualBaseline =
  (tag: string, visualTestFile = `${tag}.visual.play.ts`) =>
  (name: string): string[] => [`${visualTestFile}-snapshots`, `${sanitize(`${tag}__${name}`)}.png`]

export const wait = (ms = 0): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}
