import { expect } from '@playwright/test'
import { E2ELocator } from '../page/utils'

export abstract class PageObject {
  readonly el: E2ELocator

  constructor(el: E2ELocator) {
    this.el = el
  }

  /** Touch tap — needs a context with `hasTouch` (the `@touch` Playwright project). */
  async tap() {
    await this.el.tap()
  }

  async assertToBeVisible() {
    await expect(this.el).toBeVisible()
  }

  async assertToBeHidden() {
    await expect(this.el).toBeHidden()
  }
}
