import { expect, Locator } from '@playwright/test'
import { PageObject } from './page-object'
import { E2ELocator } from '../page/utils'

export class DsAccordion extends PageObject {
  public readonly header: Locator
  public readonly summary: Locator
  public readonly marker: Locator
  public readonly content: Locator

  constructor(el: E2ELocator) {
    super(el)
    // `.first()`: a nested ds-accordion in the content slot also matches; the host's own shadow part comes first.
    this.header = el.locator('[part="header"]').first()
    this.summary = el.locator('[part="summary"]').first()
    this.marker = el.locator('[part="marker"]').first()
    this.content = el.locator('[part="content"]').first()
  }

  async clickSummary() {
    await this.summary.click()
  }

  async assertToBeOpen() {
    await expect(this.summary).toHaveAttribute('aria-expanded', 'true')
  }

  async assertToBeClosed() {
    await expect(this.summary).toHaveAttribute('aria-expanded', 'false')
  }
}
