import type { Meta } from '@storybook/html-vite'
import { StoryFactory, withRender } from '../../../utils'

type Args = Record<string, unknown>

const meta: Meta<Args> = {
  title: 'Components/Structure/Container/Variants',
  args: {},
  argTypes: {},
  ...withRender(
    () => `
<div class="ds-container bg-purple-2 p-base">
  <p>Default container — constrained to <code>--ds-alias-container-width-default</code> on desktop.</p>
</div>
    `,
  ),
}

export default meta

const Story = StoryFactory<Args>(meta)

/**
 * STORIES — Container Variants
 * ——————————————————————————————
 * Each story demonstrates a different max-width constraint for layout needs.
 */

export const Basic = Story({})
Basic.storyName = '🌍 Default'

export const Fluid = Story({
  ...withRender(
    () => `
<div class="ds-container is-fluid bg-purple-2 p-base">
  <p>Fluid container — expands to <code>--ds-alias-container-width-fluid</code>.</p>
</div>
    `,
  ),
})
Fluid.storyName = '🌍 Fluid'

export const Compact = Story({
  ...withRender(
    () => `
<div class="ds-container is-compact bg-purple-2 p-base">
  <p>Compact container — constrained to <code>--ds-alias-container-width-compact</code>.</p>
</div>
    `,
  ),
})
Compact.storyName = '🌍 Compact'

export const SectionPattern = Story({
  ...withRender(
    () => `
<section aria-labelledby="section-pattern-title" class="bg-grey-light">
  <div class="ds-container py-md">
    <ds-heading id="section-pattern-title" level="h2">Our products</ds-heading>
    <p>
      A full-width background band, built as a wrapper with the background color and a
      <code>.ds-container</code> inside it — not a negative-margin trick, which causes sideways
      scrolling. The <code>&lt;section&gt;</code> is a named landmark via <code>aria-labelledby</code>.
    </p>
  </div>
</section>
    `,
  ),
})
SectionPattern.storyName = '🌍 Section (page pattern)'
