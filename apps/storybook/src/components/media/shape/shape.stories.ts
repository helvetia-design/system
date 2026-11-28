import type { JSX } from '@helvetia-design/core'
import type { Meta } from '@storybook/html-vite'
import { props, StoryFactory, withComponentControls, withRender } from '../../../utils'

type Args = JSX.DsShape

const meta: Meta<Args> = {
  title: 'Components/Media/Shape/Variants',
  argTypes: {
    ...withComponentControls({ tag: 'ds-shape' }),
  },
  ...withRender(args => `<ds-shape ${props(args, 'ds-shape')}></ds-shape>`),
}

export default meta

/**
 * STORIES
 * ------------------------------------------------------
 */

const Story = StoryFactory<Args>(meta)

export const Basic = Story({
  args: {
    color: 'purple',
    rotation: '0',
    variation: '1',
  },
})
Basic.storyName = '🧩 Basic'
