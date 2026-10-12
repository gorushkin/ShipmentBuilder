export interface KeyboardStroke {
  altKey?: boolean
  code: string
  ctrlKey?: boolean
  isComposing?: boolean
  key: string
  metaKey?: boolean
  repeat?: boolean
  shiftKey?: boolean
}

export interface KeyboardContext {
  editing: boolean
  targetId?: string
}

export interface ShortcutRegistration {
  accepts?: (context: KeyboardContext) => boolean
  handler: () => void | Promise<void>
  shortcut: string
  whenEditing?: 'ignore' | 'allow'
}

interface Candidate {
  remaining: Set<string>
  run: () => void
  valid: (context: KeyboardContext) => boolean
}

interface BufferState {
  candidate: Candidate | null
  lastAt: number
  text: string
}

interface KeyboardManagerOptions {
  now?: () => number
  onError?: (error: unknown) => void | Promise<void>
  schedule?: (callback: () => void, delay: number) => () => void
  timeoutMs?: number
}

const modifierNames = ['alt', 'control', 'meta', 'shift']

function modifierFor(key: string): string | null {
  const normalized = key.toLowerCase()
  return modifierNames.includes(normalized) ? normalized : null
}

export function normalizeShortcut(shortcut: string): string {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
  const key = parts.pop()
  if (!key || parts.some((part) => !['ctrl', 'alt', 'meta', 'shift'].includes(part))) {
    throw new Error(`Некорректное сочетание: ${shortcut}`)
  }
  if (new Set(parts).size !== parts.length) throw new Error(`Повтор модификатора: ${shortcut}`)
  return [...parts.sort(), key].join('+')
}

function strokeShortcut(stroke: KeyboardStroke): string {
  return normalizeShortcut(
    [
      ...(stroke.altKey ? ['alt'] : []),
      ...(stroke.ctrlKey ? ['ctrl'] : []),
      ...(stroke.metaKey ? ['meta'] : []),
      ...(stroke.shiftKey ? ['shift'] : []),
      stroke.key === ' ' ? 'space' : stroke.key === '+' ? 'plus' : stroke.key,
    ].join('+'),
  )
}

export class KeyboardManager {
  private readonly registrations = new Map<string, ShortcutRegistration>()
  private sequenceHandler: ((value: string) => void | Promise<void>) | null = null
  private readonly pressed = new Map<string, string | null>()
  private readonly captured = new Set<string>()
  private readonly blockers = new Set<symbol>()
  private pending: Candidate[] = []
  private buffer: BufferState | null = null
  private cancelTimer: (() => void) | null = null
  private readonly now: () => number
  private readonly schedule: (callback: () => void, delay: number) => () => void
  private readonly timeoutMs: number
  private readonly onError: (error: unknown) => void | Promise<void>
  private epoch = 0
  private context: KeyboardContext = { editing: false }

  constructor(options: KeyboardManagerOptions = {}) {
    this.now = options.now ?? (() => performance.now())
    this.timeoutMs = options.timeoutMs ?? 200
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error('Задержка клавиатурного ввода должна быть положительной')
    }
    this.schedule =
      options.schedule ??
      ((callback, delay) => {
        const timer = setTimeout(callback, delay)
        return () => clearTimeout(timer)
      })
    this.onError = options.onError ?? ((error) => console.error(error))
  }

  get isSuspended(): boolean {
    return this.blockers.size > 0
  }

  register(registration: ShortcutRegistration): () => void {
    const shortcut = normalizeShortcut(registration.shortcut)
    if (this.registrations.has(shortcut))
      throw new Error(`Сочетание уже зарегистрировано: ${shortcut}`)
    this.registrations.set(shortcut, registration)
    return () => {
      if (this.registrations.get(shortcut) === registration) this.registrations.delete(shortcut)
    }
  }

  onSequence(handler: (value: string) => void | Promise<void>): () => void {
    if (this.sequenceHandler) throw new Error('Получатель последовательностей уже зарегистрирован')
    this.sequenceHandler = handler
    return () => {
      if (this.sequenceHandler !== handler) return
      this.sequenceHandler = null
      this.reset()
    }
  }

  suspend(): () => void {
    const blocker = Symbol()
    this.blockers.add(blocker)
    this.reset()
    return () => {
      this.blockers.delete(blocker)
    }
  }

  reset(): void {
    this.clearBuffer()
    this.pending = []
    this.pressed.clear()
    this.captured.clear()
    this.epoch++
  }

  setContext(context: KeyboardContext): void {
    this.context = context
    if (!context.editing) return
    this.clearBuffer()
    this.pending = this.pending.filter((candidate) => candidate.valid(context))
  }

  keyDown(stroke: KeyboardStroke, context: KeyboardContext): boolean {
    if (this.isSuspended) return false
    if (typeof stroke.key !== 'string' || typeof stroke.code !== 'string') {
      this.reset()
      return false
    }
    if (stroke.isComposing) {
      this.reset()
      return false
    }
    if (stroke.repeat || this.pressed.has(stroke.code)) return this.captured.has(stroke.code)
    this.reconcileModifiers(stroke)
    this.setContext(context)
    this.pressed.set(stroke.code, modifierFor(stroke.key))
    if (modifierFor(stroke.key)) return false

    const shortcut = strokeShortcut(stroke)
    const registration = this.registrations.get(shortcut)
    const candidate =
      registration && this.allowed(registration, context)
        ? this.shortcutCandidate(shortcut, registration, stroke)
        : null
    const printable =
      stroke.key.length === 1 && !stroke.ctrlKey && !stroke.altKey && !stroke.metaKey

    if (context.editing) {
      if (!candidate) return false
      this.pending.push(candidate)
    } else {
      if (this.buffer && this.now() - this.buffer.lastAt >= this.timeoutMs) {
        const epoch = this.epoch
        this.expireBuffer()
        if (epoch !== this.epoch || this.context.editing !== context.editing) return false
      }
      if (this.buffer && (stroke.key === 'Enter' || stroke.key === 'Tab')) {
        const text = this.buffer.text
        const handler = this.sequenceHandler
        this.clearBuffer()
        this.pending.push({
          remaining: this.participants(stroke),
          run: () => {
            if (handler) this.invoke(() => handler(text))
          },
          valid: (current) => !current.editing && this.sequenceHandler === handler,
        })
      } else if (this.buffer && stroke.key === 'Escape') {
        this.clearBuffer()
      } else if (printable && this.sequenceHandler) {
        const text = (this.buffer?.text ?? '') + stroke.key
        this.clearBuffer()
        this.buffer = { candidate: text.length === 1 ? candidate : null, lastAt: this.now(), text }
        this.cancelTimer = this.schedule(() => this.expireBuffer(), this.timeoutMs)
      } else {
        this.clearBuffer()
        if (!candidate) return false
        this.pending.push(candidate)
      }
    }
    this.captured.add(stroke.code)
    return true
  }

  keyUp(stroke: KeyboardStroke, context: KeyboardContext): boolean {
    if (this.isSuspended) return false
    if (typeof stroke.key !== 'string' || typeof stroke.code !== 'string') {
      this.reset()
      return false
    }
    this.reconcileModifiers(stroke)
    this.setContext(context)
    const captured = this.captured.delete(stroke.code)
    this.pressed.delete(stroke.code)
    const modifier = modifierFor(stroke.key)
    const release = (candidate: Candidate) => {
      candidate.remaining.delete(stroke.code)
      if (modifier) candidate.remaining.delete(`modifier:${modifier}`)
    }
    this.pending.forEach(release)
    if (this.buffer?.candidate) release(this.buffer.candidate)
    this.flush(context)
    return captured
  }

  private reconcileModifiers(stroke: KeyboardStroke): void {
    const flags = {
      alt: stroke.altKey,
      control: stroke.ctrlKey,
      meta: stroke.metaKey,
      shift: stroke.shiftKey,
    }
    const missing = new Set<string>()
    for (const [code, modifier] of this.pressed) {
      if (modifier && code !== stroke.code && !flags[modifier as keyof typeof flags]) {
        missing.add(code)
      }
    }
    for (const [modifier, held] of Object.entries(flags)) {
      if (!held && modifierFor(stroke.key) !== modifier) missing.add(`modifier:${modifier}`)
    }
    if (!missing.size) return
    const consistent = (candidate: Candidate) =>
      ![...candidate.remaining].some((code) => missing.has(code))
    this.pending = this.pending.filter(consistent)
    if (this.buffer?.candidate && !consistent(this.buffer.candidate)) this.buffer.candidate = null
    for (const code of missing) {
      this.pressed.delete(code)
      this.captured.delete(code)
    }
  }

  private allowed(registration: ShortcutRegistration, context: KeyboardContext): boolean {
    return (
      (!context.editing || registration.whenEditing === 'allow') &&
      (registration.accepts?.(context) ?? true)
    )
  }

  private participants(stroke: KeyboardStroke): Set<string> {
    const result = new Set([stroke.code])
    const flags = {
      alt: stroke.altKey,
      control: stroke.ctrlKey,
      meta: stroke.metaKey,
      shift: stroke.shiftKey,
    }
    for (const [modifier, held] of Object.entries(flags)) {
      if (!held) continue
      const codes = [...this.pressed].filter(([, name]) => name === modifier).map(([code]) => code)
      if (codes.length) codes.forEach((code) => result.add(code))
      else result.add(`modifier:${modifier}`)
    }
    return result
  }

  private shortcutCandidate(
    shortcut: string,
    registration: ShortcutRegistration,
    stroke: KeyboardStroke,
  ): Candidate {
    return {
      remaining: this.participants(stroke),
      run: () => this.invoke(registration.handler),
      valid: (current) =>
        this.registrations.get(shortcut) === registration && this.allowed(registration, current),
    }
  }

  private expireBuffer(): void {
    const candidate = this.buffer?.candidate
    this.clearBuffer()
    if (candidate) {
      this.pending.push(candidate)
      this.flush(this.context)
    }
  }

  private clearBuffer(): void {
    this.cancelTimer?.()
    this.cancelTimer = null
    this.buffer = null
  }

  private flush(context: KeyboardContext): void {
    const epoch = this.epoch
    const ready = this.pending.filter((candidate) => candidate.remaining.size === 0)
    this.pending = this.pending.filter((candidate) => candidate.remaining.size > 0)
    for (const candidate of ready) {
      if (epoch !== this.epoch || this.isSuspended) break
      if (!candidate.valid(context)) continue
      candidate.run()
    }
  }

  private invoke(handler: () => void | Promise<void>): void {
    try {
      const result = handler()
      if (result) void Promise.resolve(result).catch((error: unknown) => this.reportError(error))
    } catch (error) {
      this.reportError(error)
    }
  }

  private reportError(error: unknown): void {
    try {
      const result = this.onError(error)
      if (result) void Promise.resolve(result).catch((failure: unknown) => console.error(failure))
    } catch (failure) {
      console.error(failure)
    }
  }
}
