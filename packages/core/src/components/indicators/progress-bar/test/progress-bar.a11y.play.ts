import { expect, test } from '@helvetia-design/playwright'
import { PROGRESS_BAR_BACKGROUNDS as BACKGROUNDS, PROGRESS_BAR_COLORS as COLORS } from '../progress-bar.interfaces'
import { i18nDsProgressBar } from '../progress-bar.i18n'

// Generated name is the purpose word only (value lives in aria-valuenow); the language depends on config (default 'de').
const PURPOSE_WORDS = Object.values(i18nDsProgressBar).map(i18n => i18n.progress)
const generatedName = new RegExp(`^(${PURPOSE_WORDS.join('|')})$`)

test('basic', async ({ page, a11y }) => {
  await page.mount(`<ds-progress-bar value="50"></ds-progress-bar>`)
  await a11y('ds-progress-bar')
})

test.describe('variants', () => {
  BACKGROUNDS.forEach(background => {
    COLORS.forEach(color => {
      test(`${color} on ${background}`, async ({ page, a11y }) => {
        await page.mount(`<ds-progress-bar value="50" color="${color}" background="${background}"></ds-progress-bar>`)
        await a11y('ds-progress-bar')
      })
    })
  })
})

test.describe('aria', () => {
  test('exposes progressbar role with value range', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="40"></ds-progress-bar>`)
    const bar = page.getByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-valuemin', '0')
    await expect(bar).toHaveAttribute('aria-valuemax', '100')
    await expect(bar).toHaveAttribute('aria-valuenow', '40')
  })

  test('clamps value above 100', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="150"></ds-progress-bar>`)
    const bar = page.getByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-valuenow', '100')
    await expect(bar).toHaveAccessibleName(generatedName)
  })

  test('clamps value below 0', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="-5"></ds-progress-bar>`)
    const bar = page.getByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-valuenow', '0')
    await expect(bar).toHaveAccessibleName(generatedName)
  })

  test('value change updates aria-valuenow', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="10"></ds-progress-bar>`)
    const bar = page.locator('ds-progress-bar')
    await bar.evaluate((el: HTMLDsProgressBarElement) => (el.value = 70))
    await expect(bar).toHaveAttribute('aria-valuenow', '70')
  })
})

test.describe('accessible name', () => {
  test('generated name without consumer label', async ({ page, a11y }) => {
    await page.mount(`<ds-progress-bar value="50"></ds-progress-bar>`)
    await expect(page.getByRole('progressbar')).toHaveAccessibleName(generatedName)
    await a11y('ds-progress-bar')
  })

  test('consumer aria-label wins', async ({ page, a11y }) => {
    await page.mount(`<ds-progress-bar value="50" aria-label="Upload"></ds-progress-bar>`)
    const bar = page.getByRole('progressbar')
    await expect(bar).toHaveAccessibleName('Upload')
    await expect(bar).toHaveAttribute('aria-valuenow', '50')
    await a11y('ds-progress-bar')
  })

  test('consumer aria-labelledby wins', async ({ page, a11y }) => {
    await page.mount(`
      <div>
        <span id="pb-label">Profile completion</span>
        <ds-progress-bar value="50" aria-labelledby="pb-label"></ds-progress-bar>
      </div>`)
    await expect(page.getByRole('progressbar')).toHaveAccessibleName('Profile completion')
    await a11y('ds-progress-bar')
  })

  test('changing aria-label after load updates the name', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="50" aria-label="Upload"></ds-progress-bar>`)
    const bar = page.locator('ds-progress-bar')
    await bar.evaluate(el => el.setAttribute('aria-label', 'Download'))
    await expect(bar).toHaveAccessibleName('Download')
  })

  test('removing consumer aria-label restores the generated name', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="50" aria-label="Upload"></ds-progress-bar>`)
    const bar = page.locator('ds-progress-bar')
    await expect(bar).toHaveAccessibleName('Upload')
    await bar.evaluate(el => el.removeAttribute('aria-label'))
    await expect(bar).toHaveAccessibleName(generatedName)
  })

  test('adding aria-label after load overrides the generated name', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="50"></ds-progress-bar>`)
    const bar = page.locator('ds-progress-bar')
    await bar.evaluate(el => el.setAttribute('aria-label', 'Upload'))
    await expect(bar).toHaveAccessibleName('Upload')
  })

  test("another language's purpose word counts as generated", async ({ page }) => {
    await page.mount(`<ds-progress-bar id="plain" value="50"></ds-progress-bar>`)
    const ownWord = await page.locator('#plain').getAttribute('aria-label')
    const foreignWord = PURPOSE_WORDS.find(word => word !== ownWord)!
    await page.mount(`<ds-progress-bar value="50" aria-label="${foreignWord}"></ds-progress-bar>`)
    const bar = page.getByRole('progressbar')
    // treated as generated, so it is replaced by the configured language's word rather than kept
    await expect(bar).toHaveAccessibleName(ownWord!)
    await bar.evaluate((el: HTMLDsProgressBarElement) => (el.value = 80))
    await expect(bar).toHaveAccessibleName(ownWord!)
  })

  test('value change keeps the consumer label', async ({ page }) => {
    await page.mount(`<ds-progress-bar value="50" aria-label="Upload"></ds-progress-bar>`)
    const bar = page.locator('ds-progress-bar')
    await bar.evaluate((el: HTMLDsProgressBarElement) => (el.value = 80))
    await expect(bar).toHaveAttribute('aria-valuenow', '80')
    await expect(bar).toHaveAccessibleName('Upload')
  })
})

test.describe('motion', () => {
  const MOTION_CASES = [
    { reducedMotion: 'reduce', duration: '0s' },
    { reducedMotion: 'no-preference', duration: '0.3s' },
  ] as const

  MOTION_CASES.forEach(({ reducedMotion, duration }) => {
    test(`line transition is ${duration} with reducedMotion ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion })
      await page.mount(`<div id="host"></div>`)
      await page.waitForFunction(() => (window as any).dsAppReady)
      // the test harness disables config.animated; the transition only exists with .is-animated
      await page.evaluate(() => {
        ;(window as any).DesignSystem.config.animated = true
        document.querySelector('#host')!.innerHTML = '<ds-progress-bar value="50"></ds-progress-bar>'
      })
      const line = page.locator('ds-progress-bar #line')
      await expect(line).toHaveClass(/is-animated/)
      await expect(line).toHaveCSS('transition-duration', duration)
    })
  })
})
