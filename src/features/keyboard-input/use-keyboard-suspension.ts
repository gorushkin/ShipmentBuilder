import { useCallback, useLayoutEffect, useRef } from 'react'

import { keyboard } from './runtime'

export function useKeyboardSuspension(open?: boolean) {
  const release = useRef<(() => void) | null>(null)
  const setSuspended = useCallback((suspended: boolean) => {
    if (suspended && !release.current) release.current = keyboard.suspend()
    if (!suspended) {
      release.current?.()
      release.current = null
    }
  }, [])
  useLayoutEffect(() => {
    if (open !== undefined) setSuspended(open)
  }, [open, setSuspended])
  useLayoutEffect(() => () => setSuspended(false), [setSuspended])
  return setSuspended
}
