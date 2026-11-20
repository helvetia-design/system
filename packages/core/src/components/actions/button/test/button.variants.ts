export const TAG = 'button'

export const VARIANTS = [
  'basic',
  'shadow',
  'badge',
  'link',
  'colors',
  'inverted',
  'sizes',
  'wide',
  'long-content',
  'flat',
  'disabled',
  'html-tags',
  'square',
  'icon',
  'loading',
  'group',
  'two-row-button-group',
  'group-column',
]

export const HOST_VARIANTS = VARIANTS.filter(variant => variant !== 'html-tags')
