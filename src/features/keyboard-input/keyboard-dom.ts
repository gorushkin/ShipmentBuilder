import { KeyboardManager } from './keyboard-manager'
import type { KeyboardContext } from './keyboard-manager'

export function keyboardContext(target: EventTarget | null): KeyboardContext {
  const element = target instanceof Element ? target : null
  const editing =
    Boolean(element?.closest('input, textarea, select')) ||
    (element instanceof HTMLElement && element.isContentEditable)
  return { editing, targetId: element?.id }
}

const connections = new WeakMap<Window, () => void>()

export function connectKeyboard(manager: KeyboardManager, window: Window): () => void {
  if (connections.has(window)) throw new Error('Глобальная клавиатура уже подключена')
  const context = (event: Event) => {
    const target = keyboardContext(event.target)
    const active = keyboardContext(window.document.activeElement)
    return target.editing ? target : active.editing ? active : target
  }
  const consume = (event: KeyboardEvent, accepted: boolean) => {
    if (!accepted) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  const down = (event: KeyboardEvent) => {
    const target = event.target
    if (
      event.key === ' ' &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      target instanceof Element &&
      target.matches('tr[tabindex="0"]')
    ) {
      return
    }

    consume(event, manager.keyDown(event, context(event)))
  }
  const up = (event: KeyboardEvent) => consume(event, manager.keyUp(event, context(event)))
  const focus = (event: FocusEvent) => manager.setContext(context(event))
  const reset = () => manager.reset()
  window.addEventListener('keydown', down, { capture: true })
  window.addEventListener('keyup', up, { capture: true })
  window.addEventListener('focusin', focus, { capture: true })
  window.addEventListener('compositionstart', reset, { capture: true })
  window.addEventListener('blur', reset)
  let connected = true
  const disconnect = () => {
    if (!connected) return
    connected = false
    window.removeEventListener('keydown', down, { capture: true })
    window.removeEventListener('keyup', up, { capture: true })
    window.removeEventListener('focusin', focus, { capture: true })
    window.removeEventListener('compositionstart', reset, { capture: true })
    window.removeEventListener('blur', reset)
    manager.reset()
    connections.delete(window)
  }
  connections.set(window, disconnect)
  return disconnect
}
