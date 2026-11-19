import type { JSX } from '@helvetia-design/core'
import type { Meta } from '@storybook/html-vite'
import { StoryFactory, createCssMappings, cssClasses, props, withComponentControls, withRender } from '../../../utils'

type Args = JSX.DsNotification & { slot: string }

const tag = 'ds-notification'
const css = createCssMappings(tag)

const meta: Meta<Args> = {
  title: 'Components/Overlays/Notification/Variants',
  args: {
    heading: 'Strong Title',
    slot: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  argTypes: {
    ...withComponentControls({ tag }),
  },
  ...withRender(
    ({ slot, heading, ...args }) => `
<section role="status" aria-live="polite" aria-atomic="true" ${cssClasses(
      {
        ...css('color', (color: string) => `is-${color}`),
        ...css('size', (size: string) => `is-${size}`),
        noIcon: 'has-no-icon',
      },
      args,
      'ds-notification',
    )}>
  <h2>${heading}</h2>
  ${slot}
</section>`,
  ),
}

export default meta

/**
 * STORIES
 * ------------------------------------------------------
 */

const Story = StoryFactory<Args>(meta)

export const Basic = Story({
  args: {},
  ...withRender(
    ({ slot, ...args }) => `<ds-notification ${props(args, tag)}>
  ${slot}
</ds-notification>`,
  ),
})
Basic.storyName = '🧩 Basic'

export const BasicHtml = Story({})
BasicHtml.storyName = '🌍 Basic'

export const Alerts = Story({
  args: {
    alert: true,
    heading: undefined,
  },
  ...withRender(
    ({ slot, ...args }) => `
<div class="ds-stack">
  <ds-notification ${props(args, tag)} heading="Alert">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="info" heading="Information">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="success" heading="Success">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="warning" heading="Warning">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="danger" heading="Danger">
    ${slot}
  </ds-notification>
</div>`,
  ),
})
Alerts.storyName = '🧩 Alerts'

export const Outlines = Story({
  args: {
    heading: undefined,
  },
  ...withRender(
    ({ slot, ...args }) => `
<div class="ds-stack">
  <ds-notification ${props(args, tag)} color="outline-default" heading="Alert">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="outline-purple" heading="Information">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="outline-green" heading="Success">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="outline-yellow" heading="Warning">
    ${slot}
  </ds-notification>
  <ds-notification ${props(args, tag)} color="outline-red" heading="Danger">
    ${slot}
  </ds-notification>
</div>`,
  ),
})
Outlines.storyName = '🧩 Outlines'
