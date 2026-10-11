import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { barcodeShortcuts, KeyboardManager, normalizeShortcut } from '@/features/keyboard-input'

import { shipmentShortcuts } from './shortcuts'

const page = { editing: false }
const editing = { editing: true }

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('shipment shortcuts integration', () => {
  it('назначения уникальны, включая существующие F2 и Escape', () => {
    const assignments = [...Object.values(shipmentShortcuts), ...Object.values(barcodeShortcuts)]
    expect(new Set(assignments.map(normalizeShortcut)).size).toBe(assignments.length)
  })

  it('выполняет действие только при доступности на приёме и после отпускания', () => {
    const keyboard = new KeyboardManager()
    keyboard.onSequence(vi.fn())
    const action = vi.fn()
    let enabled = false
    keyboard.register({
      accepts: () => enabled,
      handler: action,
      shortcut: shipmentShortcuts.transferRow,
    })
    const stroke = { code: 'KeyD', key: 'd' }
    keyboard.keyDown(stroke, page)
    enabled = true
    keyboard.keyUp(stroke, page)
    vi.advanceTimersByTime(200)
    expect(action).not.toHaveBeenCalled()
    keyboard.keyDown(stroke, page)
    enabled = false
    keyboard.keyUp(stroke, page)
    vi.advanceTimersByTime(200)
    expect(action).not.toHaveBeenCalled()
    enabled = true
    keyboard.keyDown(stroke, page)
    keyboard.keyUp(stroke, page)
    vi.advanceTimersByTime(200)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('разделяет перенос и возврат, защищает ввод и не использует русские алиасы', () => {
    const keyboard = new KeyboardManager()
    const print = vi.fn()
    const transfer = vi.fn()
    const returned = vi.fn()
    keyboard.register({ handler: print, shortcut: shipmentShortcuts.printReports })
    keyboard.register({ handler: transfer, shortcut: shipmentShortcuts.transferRow })
    keyboard.register({ handler: returned, shortcut: shipmentShortcuts.returnRow })
    const tap = (key: string, shiftKey = false, context = page) => {
      const stroke = { code: `Key${key.toUpperCase()}`, key, shiftKey }
      if (shiftKey) keyboard.keyDown({ code: 'ShiftLeft', key: 'Shift', shiftKey: true }, context)
      keyboard.keyDown(stroke, context)
      keyboard.keyUp(stroke, context)
      if (shiftKey) keyboard.keyUp({ code: 'ShiftLeft', key: 'Shift', shiftKey: false }, context)
    }
    tap('з')
    tap('p', false, editing)
    expect(print).not.toHaveBeenCalled()
    tap('p')
    expect(print).toHaveBeenCalledTimes(1)
    tap('d')
    tap('D', true)
    expect(transfer).toHaveBeenCalledTimes(1)
    expect(returned).toHaveBeenCalledTimes(1)
    const release = keyboard.suspend()
    tap('p')
    expect(print).toHaveBeenCalledTimes(1)
    release()
  })

  it('скан с буквами назначений доставляет код без активации кнопок', () => {
    const keyboard = new KeyboardManager()
    const action = vi.fn()
    const scanned = vi.fn()
    keyboard.onSequence(scanned)
    for (const shortcut of Object.values(shipmentShortcuts)) {
      keyboard.register({ handler: action, shortcut })
    }
    for (const key of ['p', 'd', 'n', 'q', 'Enter']) {
      const stroke = { code: key, key }
      keyboard.keyDown(stroke, page)
      keyboard.keyUp(stroke, page)
      vi.advanceTimersByTime(20)
    }
    vi.advanceTimersByTime(200)
    expect(scanned).toHaveBeenCalledWith('pdnq')
    expect(action).not.toHaveBeenCalled()
  })
})
