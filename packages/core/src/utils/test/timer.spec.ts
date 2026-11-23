import { createPausableTimer } from '../timer'

describe('timer', () => {
  describe('createPausableTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('should call the callback after the delay', () => {
      const callback = vi.fn()
      createPausableTimer(callback, 1000)

      vi.advanceTimersByTime(999)
      expect(callback).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should keep the remaining time when paused twice', () => {
      const callback = vi.fn()
      const timer = createPausableTimer(callback, 1000)

      vi.advanceTimersByTime(400)
      timer.pause()
      vi.advanceTimersByTime(5000)
      timer.pause()
      timer.resume()

      vi.advanceTimersByTime(599)
      expect(callback).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should call the callback only once when resumed twice', () => {
      const callback = vi.fn()
      const timer = createPausableTimer(callback, 1000)

      timer.resume()
      vi.advanceTimersByTime(2000)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('should not call the callback after clear', () => {
      const callback = vi.fn()
      const timer = createPausableTimer(callback, 1000)

      timer.clear()
      vi.advanceTimersByTime(2000)
      expect(callback).not.toHaveBeenCalled()
    })
  })
})
