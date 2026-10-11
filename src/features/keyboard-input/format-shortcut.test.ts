import { describe, expect, it } from 'vitest'

import { formatShortcut } from './format-shortcut'

describe('formatShortcut', () => {
  it.each([
    ['p', 'P', 'p'],
    ['P', 'P', 'p'],
    ['shift+d', 'Shift+D', 'Shift+d'],
    ['ctrl+p', 'Ctrl+P', 'Control+p'],
    ['meta+p', 'Meta+P', 'Meta+p'],
    ['F2', 'F2', 'F2'],
    ['Escape', 'Escape', 'Escape'],
    ['Shift+CTRL+a', 'Ctrl+Shift+A', 'Control+Shift+a'],
    ['ctrl+space', 'Ctrl+Space', 'Control+Space'],
    ['ctrl+plus', 'Ctrl++', 'Control+plus'],
  ])('formats %s without changing its modifiers', (value, label, aria) => {
    expect(formatShortcut(value)).toEqual({ aria, label })
  })
})
