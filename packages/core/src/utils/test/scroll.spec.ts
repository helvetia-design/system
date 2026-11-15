import { ScrollHandler } from '../scroll'

describe('ScrollHandler', () => {
  beforeEach(() => {
    document.documentElement.style.overflow = ''
    document.body.className = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    Object.defineProperty(window, 'pageYOffset', { value: 800, configurable: true })
    window.scrollTo = vi.fn()
  })

  test('only the first lock freezes the page and only the last unlock restores it', () => {
    const drawer = new ScrollHandler()
    const modal = new ScrollHandler()

    drawer.connect()
    drawer.disable()
    expect(document.body.classList.contains('noscroll')).toBe(true)
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-800px')

    modal.connect()
    modal.disable()
    expect(document.body.classList.contains('noscroll')).toBe(true)
    expect(document.body.style.position).toBe('fixed')

    modal.enable()
    expect(document.body.classList.contains('noscroll')).toBe(true)
    expect(document.body.style.position).toBe('fixed')
    expect(window.scrollTo).not.toHaveBeenCalled()

    drawer.enable()
    expect(document.body.classList.contains('noscroll')).toBe(false)
    expect(document.body.style.position).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 800)
  })

  test('does not touch window.onscroll or window.onkeydown', () => {
    window.onscroll = () => undefined
    window.onkeydown = () => undefined
    const original = { onscroll: window.onscroll, onkeydown: window.onkeydown }

    const handler = new ScrollHandler()
    handler.connect()
    handler.disable()
    handler.enable()
    handler.disconnect()

    expect(window.onscroll).toBe(original.onscroll)
    expect(window.onkeydown).toBe(original.onkeydown)
  })
})
