import { describe, expect, it } from 'vitest'
import { visualBaseline } from './screenshot'

describe('visualBaseline', () => {
  it('points into the snapshots folder of the default visual test file', () => {
    expect(visualBaseline('tag')('basic')).toEqual(['tag.visual.play.ts-snapshots', 'tag-basic.png'])
  })

  it('uses a custom visual test file', () => {
    expect(visualBaseline('tag', 'tag.ssr.play.ts')('basic-ssr-static')).toEqual([
      'tag.ssr.play.ts-snapshots',
      'tag-basic-ssr-static.png',
    ])
  })

  it('sanitizes the double underscore separator and special characters', () => {
    expect(visualBaseline('tag')('a.b/c')[1]).toBe('tag-a-b-c.png')
    expect(visualBaseline('ds-tag')('x y')[1]).toBe('ds-tag-x-y.png')
  })
})
