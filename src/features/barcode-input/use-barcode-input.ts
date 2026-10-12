import { useEffect, useEffectEvent, useState } from 'react'

import { barcodeShortcuts, keyboard, useShortcut } from '@/features/keyboard-input'
import type { KeyboardContext } from '@/features/keyboard-input'

import { BarcodeInputController } from './barcode-input-controller'

export function useBarcodeInput(onCompleted: (value: string) => void, onCancel?: () => void) {
  const [controller] = useState(() => new BarcodeInputController())
  const submit = useEffectEvent(onCompleted)
  const manualInputOrPage = (context: KeyboardContext) =>
    !context.editing || context.targetId === 'barcode-input'

  useShortcut(barcodeShortcuts.toggle, () => controller.toggle(), {
    accepts: manualInputOrPage,
    whenEditing: 'allow',
  })

  useShortcut(
    barcodeShortcuts.cancel,
    () => {
      if (controller.isExpanded && document.activeElement?.id === 'barcode-input') {
        controller.collapse()
        return
      }

      onCancel?.()
    },
    {
      accepts: manualInputOrPage,
      whenEditing: 'allow',
    },
  )

  useEffect(() => {
    const removeSequence = keyboard.onSequence((value) => submit(value))

    return () => {
      removeSequence()
    }
  }, [])

  return controller
}
