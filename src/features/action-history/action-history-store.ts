import { makeAutoObservable } from 'mobx'

export type HistoryEventInput = {
  description?: string
  level: 'error' | 'info' | 'success' | 'warning'
  title: string
  type: string
}

export type HistoryEvent = HistoryEventInput & { id: string; timestamp: number }

export class ActionHistoryStore {
  entries: HistoryEvent[] = []
  isExpanded = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get latestEvent(): HistoryEvent | null {
    return this.entries.at(-1) ?? null
  }

  get newestFirst(): HistoryEvent[] {
    return this.entries.toReversed()
  }

  append(event: HistoryEventInput): void {
    this.entries.push({ ...event, id: crypto.randomUUID(), timestamp: Date.now() })
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded
  }

  expand(): void {
    this.isExpanded = true
  }

  collapse(): void {
    this.isExpanded = false
  }

  reset(): void {
    this.entries = []
    this.collapse()
  }
}
