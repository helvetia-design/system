export type PausableTimer = {
  resume(): void
  pause(): void
  clear(): void
}

export function createPausableTimer(callback: () => void, delay: number): PausableTimer {
  let timerId: number | undefined
  let start = 0
  let remaining = delay

  function resume() {
    if (timerId !== undefined) return
    start = Date.now()
    timerId = window.setTimeout(() => {
      timerId = undefined
      callback()
    }, remaining)
  }

  function pause() {
    if (timerId === undefined) return
    clearTimeout(timerId)
    timerId = undefined
    remaining -= Date.now() - start
  }

  function clear() {
    clearTimeout(timerId)
    timerId = undefined
  }

  resume()

  return { pause, resume, clear }
}
