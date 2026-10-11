import { commands } from '@/features/command-config'

// These actions retain their existing registration owner.
export const barcodeShortcuts = {
  get cancel() {
    return commands.cancel.shortcut
  },
  get toggle() {
    return commands.barcodeToggle.shortcut
  },
}
