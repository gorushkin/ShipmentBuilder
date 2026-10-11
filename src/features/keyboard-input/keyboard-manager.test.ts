import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { KeyboardManager, normalizeShortcut } from './keyboard-manager'
import type { KeyboardStroke } from './keyboard-manager'

const page = { editing: false }
const editing = { editing: true, targetId: 'quantity' }
function stroke(key: string, options: Partial<KeyboardStroke> = {}): KeyboardStroke {
  const code =
    key.length === 1 ? `Key${key.toUpperCase()}` : key === 'Control' ? 'ControlLeft' : key
  return { code, key, ...options }
}

function setup() {
  const error = vi.fn()
  const keyboard = new KeyboardManager({ now: () => Date.now(), onError: error })
  const sequence = vi.fn()
  const removeSequence = keyboard.onSequence(sequence)
  const down = (key: string, options: Partial<KeyboardStroke> = {}) =>
    keyboard.keyDown(stroke(key, options), page)
  const up = (key: string, options: Partial<KeyboardStroke> = {}) =>
    keyboard.keyUp(stroke(key, options), page)
  const tap = (key: string, options: Partial<KeyboardStroke> = {}) => {
    down(key, options)
    up(key, options)
  }
  return { down, error, keyboard, removeSequence, sequence, tap, up }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})
afterEach(() => vi.useRealTimers())

describe('KeyboardManager', () => {
  it('нормализует регистр и порядок, но сохраняет модификаторы', () => {
    expect(normalizeShortcut(' Shift + CTRL + A ')).toBe('ctrl+shift+a')
    expect(() => normalizeShortcut('ctrl+ctrl+a')).toThrow()
    expect(() => normalizeShortcut('invalid+a')).toThrow()
    const { keyboard, tap } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'CTRL+A' })
    tap('a', { ctrlKey: true, shiftKey: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('отклоняет дубликаты и не удаляет новую регистрацию старым освобождением', () => {
    const { keyboard } = setup()
    const remove = keyboard.register({ handler: vi.fn(), shortcut: 'CTRL+a' })
    expect(() => keyboard.register({ handler: vi.fn(), shortcut: 'ctrl+A' })).toThrow()
    remove()
    keyboard.register({ handler: vi.fn(), shortcut: 'ctrl+a' })
    remove()
    expect(() => keyboard.register({ handler: vi.fn(), shortcut: 'ctrl+a' })).toThrow()
    expect(() => keyboard.onSequence(vi.fn())).toThrow()
  })

  it.each(['основная', 'модификатор'])('Ctrl+A ждёт обе клавиши: первой отпущена %s', (first) => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'ctrl+a' })
    down('Control')
    expect(down('a', { ctrlKey: true })).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    if (first === 'основная') up('a', { ctrlKey: true })
    else up('Control')
    expect(handler).not.toHaveBeenCalled()
    if (first === 'основная') up('Control')
    else up('a')
    expect(handler).toHaveBeenCalledTimes(1)
    up('Control')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ждёт все модификаторы, включая левый и правый Ctrl', () => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'ctrl+shift+a' })
    down('Control')
    down('Control', { code: 'ControlRight', ctrlKey: true })
    down('Shift', { code: 'ShiftLeft', ctrlKey: true })
    down('A', { ctrlKey: true, shiftKey: true })
    up('a', { ctrlKey: true, shiftKey: true })
    up('Control', { ctrlKey: true, shiftKey: true })
    up('Shift', { code: 'ShiftLeft', ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
    up('Control', { code: 'ControlRight' })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('поглощает повторы и вызывает одиночный хоткей один раз после долгого удержания', () => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'a' })
    down('a')
    vi.advanceTimersByTime(200)
    for (let i = 0; i < 10; i++) {
      expect(down('a', { repeat: true })).toBe(true)
      vi.advanceTimersByTime(100)
    }
    expect(handler).not.toHaveBeenCalled()
    up('a')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('короткое нажатие ждёт исходный тайм-аут, повторы его не продлевают', () => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'a' })
    down('a')
    vi.advanceTimersByTime(100)
    down('a', { repeat: true })
    up('a')
    vi.advanceTimersByTime(99)
    expect(handler).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it.each(['Enter', 'Tab'])(
    'отправляет строку после отпускания %s, не запускает хоткеи символов',
    (terminator) => {
      const { down, keyboard, sequence, tap, up } = setup()
      const handler = vi.fn()
      keyboard.register({ handler, shortcut: 'a' })
      tap('A', { shiftKey: true })
      // Отпускание Shift для первого символа не требуется для отправки сканирования.
      vi.advanceTimersByTime(50)
      tap('b')
      tap('C', { shiftKey: true })
      expect(down(terminator)).toBe(true)
      vi.advanceTimersByTime(1000)
      expect(sequence).not.toHaveBeenCalled()
      up(terminator)
      expect(sequence).toHaveBeenCalledExactlyOnceWith('AbC')
      expect(handler).not.toHaveBeenCalled()
    },
  )

  it('принимает односимвольный штрихкод и сохраняет символ плюс', () => {
    const { sequence, tap } = setup()
    tap('+', { code: 'Equal', shiftKey: true })
    tap('Enter')
    expect(sequence).toHaveBeenCalledExactlyOnceWith('+')
  })

  it.each([199, 200, 201])('граница тайм-аута %i мс', (delay) => {
    const { sequence, tap } = setup()
    tap('a')
    vi.advanceTimersByTime(delay)
    tap('b')
    tap('Enter')
    expect(sequence).toHaveBeenCalledExactlyOnceWith(delay < 200 ? 'ab' : 'b')
  })

  it('отбрасывает незавершённую строку, пропускает пустые завершители', () => {
    const { down, sequence, tap } = setup()
    tap('a')
    tap('b')
    vi.advanceTimersByTime(200)
    expect(down('Enter')).toBe(false)
    expect(down('Tab')).toBe(false)
    expect(sequence).not.toHaveBeenCalled()
  })

  it('Escape очищает буфер без команды отмены', () => {
    const { keyboard, sequence, tap } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'Escape' })
    tap('a')
    tap('Escape')
    expect(handler).not.toHaveBeenCalled()
    expect(sequence).not.toHaveBeenCalled()
    tap('Escape')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('не выполняет сочетание при пропущенном отпускании модификатора', () => {
    const { down, keyboard, tap, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'ctrl+a' })
    down('Control')
    down('a', { ctrlKey: true })
    up('a', { ctrlKey: true })
    // Следующее событие сообщает, что Ctrl уже не нажат: отпускание было пропущено.
    tap('F3')
    up('Control')
    expect(handler).not.toHaveBeenCalled()
  })

  it('F2 выполняется на отпускании без тайм-аута', () => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'F2' })
    down('F2')
    vi.advanceTimersByTime(1000)
    expect(handler).not.toHaveBeenCalled()
    up('F2')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('редактирование отключает сбор и обычные команды, allow ждёт отпускания', () => {
    const { keyboard, sequence } = setup()
    const normal = vi.fn()
    const allowed = vi.fn()
    keyboard.register({ handler: normal, shortcut: 'a' })
    keyboard.register({ handler: allowed, shortcut: 'F2', whenEditing: 'allow' })
    expect(keyboard.keyDown(stroke('a'), editing)).toBe(false)
    keyboard.keyUp(stroke('a'), editing)
    keyboard.keyDown(stroke('F2'), editing)
    expect(allowed).not.toHaveBeenCalled()
    keyboard.keyUp(stroke('F2'), editing)
    expect(allowed).toHaveBeenCalledTimes(1)
    keyboard.keyDown(stroke('Enter'), editing)
    expect(normal).not.toHaveBeenCalled()
    expect(sequence).not.toHaveBeenCalled()
  })

  it('вход в редактирование отменяет буфер и ожидающее отпускание', () => {
    const { down, keyboard, sequence, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'F2' })
    down('F2')
    down('a')
    keyboard.setContext(editing)
    up('F2')
    up('a')
    vi.advanceTimersByTime(300)
    expect(handler).not.toHaveBeenCalled()
    expect(sequence).not.toHaveBeenCalled()
  })

  it('независимые блокировки отменяют ожидания и требуют освобождения всех владельцев', () => {
    const { down, keyboard, tap, up } = setup()
    const handler = vi.fn()
    keyboard.register({ handler, shortcut: 'F2', whenEditing: 'allow' })
    down('F2')
    const first = keyboard.suspend()
    const second = keyboard.suspend()
    first()
    first()
    up('F2')
    tap('F2')
    expect(handler).not.toHaveBeenCalled()
    expect(keyboard.isSuspended).toBe(true)
    second()
    tap('F2')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('сброс и удаление регистрации отменяют ожидающие действия', () => {
    const { down, keyboard, up } = setup()
    const handler = vi.fn()
    const remove = keyboard.register({ handler, shortcut: 'F2' })
    down('F2')
    remove()
    up('F2')
    keyboard.register({ handler, shortcut: 'F2' })
    down('F2')
    keyboard.reset()
    up('F2')
    expect(handler).not.toHaveBeenCalled()
  })

  it('несколько отдельных Ctrl+A ждут отпускания Ctrl; блокировка из первого отменяет остальные', () => {
    const { down, keyboard, tap, up } = setup()
    const handler = vi.fn(() => {
      keyboard.suspend()
    })
    keyboard.register({ handler, shortcut: 'ctrl+a' })
    down('Control')
    tap('a', { ctrlKey: true })
    tap('a', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
    up('Control')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('единый обработчик ловит исключения и отклонённые обещания', async () => {
    const { error, keyboard, tap } = setup()
    keyboard.register({
      handler: () => {
        throw new Error('sync')
      },
      shortcut: 'F2',
    })
    keyboard.register({ handler: () => Promise.reject(new Error('async')), shortcut: 'F3' })
    tap('F2')
    tap('F3')
    await Promise.resolve()
    await Promise.resolve()
    expect(error).toHaveBeenCalledTimes(2)
    const next = vi.fn()
    keyboard.register({ handler: next, shortcut: 'F4' })
    tap('F4')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('не ждёт завершения асинхронного получателя перед доставкой следующей строки', () => {
    const { keyboard, removeSequence, tap } = setup()
    removeSequence()
    const handler = vi.fn(() => new Promise<void>(() => undefined))
    keyboard.onSequence(handler)
    tap('a')
    tap('Enter')
    tap('b')
    tap('Tab')
    expect(handler.mock.calls).toHaveLength(2)
  })

  it('композиция и неперехваченные повторы пропускаются', () => {
    const { down, sequence, tap } = setup()
    tap('a')
    expect(down('b', { isComposing: true })).toBe(false)
    expect(down('F3', { repeat: true })).toBe(false)
    tap('Enter')
    expect(sequence).not.toHaveBeenCalled()
  })
})
