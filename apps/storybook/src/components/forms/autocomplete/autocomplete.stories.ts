import type { JSX } from '@helvetia-design/core'
import type { Meta } from '@storybook/html-vite'
import { props, StoryFactory, withComponentControls, withRender } from '../../../utils'

type Args = JSX.DsAutocomplete

// The same canton list the App Pattern Library autocomplete demo filters over.
const CANTONS = [
  'Aargau',
  'Appenzell Ausserrhoden',
  'Appenzell Innerrhoden',
  'Basel-Landschaft',
  'Basel-Stadt',
  'Bern',
  'Fribourg',
  'Genève',
  'Glarus',
  'Graubünden',
  'Jura',
  'Luzern',
  'Neuchâtel',
  'Nidwalden',
  'Obwalden',
  'Schaffhausen',
  'Schwyz',
  'Solothurn',
  'St. Gallen',
  'Thurgau',
  'Ticino',
  'Uri',
  'Valais',
  'Vaud',
  'Zug',
  'Zürich',
]

// The option's text content is both the label and the submitted value, so there is no
// `value` attribute in the MVP.
const cantonOptions = () =>
  CANTONS.map(canton => `<ds-autocomplete-option>${canton}</ds-autocomplete-option>`).join('\n        ')

const meta: Meta<Args> = {
  title: 'Components/Forms/Autocomplete/Variants',
  args: {
    label: 'Kanton',
    description: 'Type to filter, or enter any text',
    placeholder: 'Pick one',
  },
  argTypes: {
    ...withComponentControls({ tag: 'ds-autocomplete' }),
  },
  ...withRender(
    ({ ...args }) => `
      <ds-autocomplete id="autocomplete-basic" ${props(args, 'ds-autocomplete')}>
        ${cantonOptions()}
      </ds-autocomplete>
    `,
  ),
}

export default meta

/**
 * STORIES
 * ------------------------------------------------------
 */

const Story = StoryFactory<Args>(meta)

export const Basic = Story()
Basic.storyName = '🧩 Basic'

export const Clearable = Story({
  args: {
    clearable: true,
    value: 'Zürich',
  },
  ...withRender(
    ({ ...args }) => `
      <ds-autocomplete id="autocomplete-clearable" ${props(args, 'ds-autocomplete')}>
        ${cantonOptions()}
      </ds-autocomplete>
    `,
  ),
})
Clearable.storyName = '🧩 Clearable'

export const FreeText = Story({
  args: {
    label: 'Kanton',
    description: 'Submits whatever you type — "Liechtenstein" is accepted even though it is not an option',
    value: 'Liechtenstein',
  },
  ...withRender(
    ({ ...args }) => `
      <ds-autocomplete id="autocomplete-free-text" ${props(args, 'ds-autocomplete')}>
        ${cantonOptions()}
      </ds-autocomplete>
    `,
  ),
})
FreeText.storyName = '🧩 Free text'

export const Invalid = Story({
  args: {
    label: 'Kanton',
    invalid: true,
    invalidText: 'Please pick a canton from the list',
    value: 'Liechtenstein',
  },
  ...withRender(
    ({ ...args }) => `
      <ds-autocomplete id="autocomplete-invalid" ${props(args, 'ds-autocomplete')}>
        ${cantonOptions()}
      </ds-autocomplete>
    `,
  ),
})
Invalid.storyName = '🧩 Invalid'

export const Disabled = Story({
  args: {
    disabled: true,
    value: 'Bern',
  },
  ...withRender(
    ({ ...args }) => `
      <ds-autocomplete id="autocomplete-disabled" ${props(args, 'ds-autocomplete')}>
        ${cantonOptions()}
      </ds-autocomplete>
    `,
  ),
})
Disabled.storyName = '🧩 Disabled'
