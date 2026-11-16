import { getAppRoot, getRootElement, waitForDesignSystem } from '../helpers'

const createDoc = (...tags: string[]) => {
  const elements = Object.fromEntries(tags.map(tag => [tag, { tag }]))
  return {
    body: { tag: 'body' },
    querySelector: (selector: string) => elements[selector] ?? null,
  } as unknown as Document
}

describe('getRootElement', () => {
  test('returns ds-root when present', () => {
    const root = { tag: 'ds-root' }
    const doc = {
      body: { tag: 'body' },
      querySelector: (selector: string) => (selector === 'ds-root' ? root : null),
    } as unknown as Document

    expect(getRootElement(doc)).toBe(root)
  })

  test('falls back to ds-app when ds-root is absent', () => {
    const doc = createDoc('ds-app')

    expect(getRootElement(doc)).toEqual({ tag: 'ds-app' })
  })

  test('prefers ds-root over ds-app', () => {
    const doc = createDoc('ds-root', 'ds-app')

    expect(getRootElement(doc)).toEqual({ tag: 'ds-root' })
  })

  test('falls back to document.body when neither root element is present', () => {
    const doc = createDoc()

    expect(getRootElement(doc)).toEqual({ tag: 'body' })
  })
})

describe('getAppRoot', () => {
  test('is a compatibility alias of getRootElement', () => {
    const doc = createDoc('ds-root')

    expect(getAppRoot(doc)).toEqual(getRootElement(doc))
    expect(getAppRoot(doc)).toEqual({ tag: 'ds-root' })
  })

  test('still finds a legacy ds-app element', () => {
    const doc = createDoc('ds-app')

    expect(getAppRoot(doc)).toEqual({ tag: 'ds-app' })
  })
})

describe('waitForDesignSystem', () => {
  test('applies the config to ds-* descendants only', async () => {
    const dsButton = { tagName: 'DS-BUTTON', configChanged: vi.fn() }
    const other = { tagName: 'DIV', configChanged: vi.fn() }
    const el = { children: [], querySelectorAll: () => [dsButton, other] }

    await waitForDesignSystem(el, { animated: true } as any)

    expect(dsButton.configChanged).toHaveBeenCalledWith({ animated: true })
    expect(other.configChanged).not.toHaveBeenCalled()
  })
})
