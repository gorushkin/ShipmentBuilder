import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectKeyboard } from './keyboard-dom'
import { KeyboardManager } from './keyboard-manager'

// EventTarget verifies the DOM adapter without a browser dependency.
class TestElement extends EventTarget {
  id = ''
  isContentEditable = false
  closest() {
    return null
  }
}
class TestWindow extends EventTarget {
  document = { activeElement: null }
}
function keyEvent(type: string, key: string, extra = {}) {
  const event = new Event(type, { cancelable: true })
  Object.assign(event, { code: key, key, ...extra })
  return event
}
beforeEach(() => {
  vi.stubGlobal('Element', TestElement)
  vi.stubGlobal('HTMLElement', TestElement)
})
afterEach(() => vi.unstubAllGlobals())

describe('connectKeyboard', () => {
  it('перехватывает принятое нажатие и повторы, выполняет на отпускании, очищает подключение', () => {
    const target = new TestWindow()
    const window = target as unknown as Window
    const manager = new KeyboardManager()
    const handler = vi.fn()
    manager.register({ handler, shortcut: 'F2' })
    const disconnect = connectKeyboard(manager, window)
    expect(() => connectKeyboard(manager, window)).toThrow()
    const down = keyEvent('keydown', 'F2')
    target.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    const repeated = keyEvent('keydown', 'F2', { repeat: true })
    target.dispatchEvent(repeated)
    expect(repeated.defaultPrevented).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    target.dispatchEvent(keyEvent('keyup', 'F2'))
    expect(handler).toHaveBeenCalledTimes(1)
    const unknown = keyEvent('keydown', 'F3')
    target.dispatchEvent(unknown)
    expect(unknown.defaultPrevented).toBe(false)
    disconnect()
    disconnect()
    target.dispatchEvent(keyEvent('keydown', 'F2'))
    target.dispatchEvent(keyEvent('keyup', 'F2'))
    expect(handler).toHaveBeenCalledTimes(1)
    const again = connectKeyboard(manager, window)
    target.dispatchEvent(keyEvent('keydown', 'F2'))
    target.dispatchEvent(keyEvent('keyup', 'F2'))
    expect(handler).toHaveBeenCalledTimes(2)
    again()
  })

  it('отменяет ожидающее отпускание при blur и compositionstart', () => {
    const target = new TestWindow()
    const manager = new KeyboardManager()
    const handler = vi.fn()
    manager.register({ handler, shortcut: 'F2' })
    const disconnect = connectKeyboard(manager, target as unknown as Window)
    for (const reset of ['blur', 'compositionstart']) {
      target.dispatchEvent(keyEvent('keydown', 'F2'))
      target.dispatchEvent(new Event(reset))
      target.dispatchEvent(keyEvent('keyup', 'F2'))
    }
    expect(handler).not.toHaveBeenCalled()
    disconnect()
  })
})
