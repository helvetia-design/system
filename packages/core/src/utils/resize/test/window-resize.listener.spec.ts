import { WindowResizeListener } from '../window-resize.listener'

describe('WindowResizeListener', () => {
  test('removes the resize listener from window on disconnect', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const listener = new WindowResizeListener()
    listener.connect(window)

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })
    const registeredHandler = addSpy.mock.calls.find(call => call[0] === 'resize')?.[1]

    listener.disconnect()

    expect(removeSpy).toHaveBeenCalledWith('resize', registeredHandler, undefined)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
