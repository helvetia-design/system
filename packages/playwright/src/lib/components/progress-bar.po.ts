import { expect, Locator } from '@playwright/test'
import { PageObject } from './page-object'
import { E2ELocator } from '../page/utils'

export class DsProgressBar extends PageObject {
  public readonly line: Locator

  constructor(el: E2ELocator) {
    super(el)
    this.line = el.locator('[part="line"]')
  }

  async setValue(value: number) {
    await this.el.evaluate((el, v) => ((el as any).value = v), value)
  }

  /** Rendered line and track (host) widths in px */
  async getWidths() {
    return this.el.evaluate(el => ({
      line: el.shadowRoot!.querySelector('[part="line"]')!.getBoundingClientRect().width,
      track: el.getBoundingClientRect().width,
    }))
  }

  async assertLineWidth(percent: number) {
    await expect(this.line).toHaveAttribute('style', new RegExp(`width:\\s*${percent}%`))
  }

  async assertValueNow(value: number) {
    await expect(this.el).toHaveAttribute('aria-valuenow', String(value))
  }
}
