import { useEffect, useEffectEvent } from 'react'

import { normalizeShortcut } from './keyboard-manager'
import type { ShortcutRegistration } from './keyboard-manager'
import { keyboard } from './runtime'

type ShortcutOptions = Pick<ShortcutRegistration, 'accepts' | 'whenEditing'>

export function useShortcut(
  shortcut: string,
  handler: ShortcutRegistration['handler'],
  options: ShortcutOptions = {},
): void {
  const normalized = shortcut ? normalizeShortcut(shortcut) : null
  const whenEditing = options.whenEditing ?? 'ignore'
  const run = useEffectEvent(handler)
  const accepts = useEffectEvent<NonNullable<ShortcutOptions['accepts']>>(
    (context) => options.accepts?.(context) ?? true,
  )

  useEffect(
    () =>
      normalized
        ? keyboard.register({
            accepts: (context) => accepts(context),
            handler: () => run(),
            shortcut: normalized,
            whenEditing,
          })
        : undefined,
    [normalized, whenEditing],
  )
}
