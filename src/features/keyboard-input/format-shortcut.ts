import { normalizeShortcut } from './keyboard-manager'

const modifiers = [
  ['ctrl', 'Ctrl', 'Control'],
  ['alt', 'Alt', 'Alt'],
  ['shift', 'Shift', 'Shift'],
  ['meta', 'Meta', 'Meta'],
] as const

const keyNames: Record<string, string> = {
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  arrowup: 'ArrowUp',
  backspace: 'Backspace',
  delete: 'Delete',
  end: 'End',
  enter: 'Enter',
  escape: 'Escape',
  home: 'Home',
  pagedown: 'PageDown',
  pageup: 'PageUp',
  plus: 'plus',
  space: 'Space',
  tab: 'Tab',
}

export function formatShortcut(shortcut: string): { aria: string; label: string } {
  const parts = normalizeShortcut(shortcut).split('+')
  const key = parts.pop()!
  const name = keyNames[key] ?? (/^f\d+$/.test(key) ? key.toUpperCase() : key)
  const active = modifiers.filter(([value]) => parts.includes(value))
  return {
    aria: [...active.map(([, , aria]) => aria), name].join('+'),
    label: [
      ...active.map(([, label]) => label),
      key === 'plus' ? '+' : name.length === 1 ? name.toUpperCase() : name,
    ].join('+'),
  }
}
