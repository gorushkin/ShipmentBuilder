import { reaction } from 'mobx'
import { describe, expect, it } from 'vitest'

import { ActionHistoryStore } from './action-history-store'

describe('ActionHistoryStore', () => {
  it('reactively exposes the latest event without dropping older entries', () => {
    const store = new ActionHistoryStore()
    const titles: string[] = []
    const dispose = reaction(
      () => store.latestEvent?.title,
      (title) => {
        if (title) titles.push(title)
      },
    )

    for (let index = 0; index < 8; index++)
      store.append({ level: 'info', title: String(index), type: 'test' })

    expect(store.entries).toHaveLength(8)
    expect(new Set(store.entries.map((entry) => entry.id)).size).toBe(8)
    expect(store.newestFirst.map((entry) => entry.title)).toEqual(titles.toReversed())
    expect(store.latestEvent?.title).toBe('7')
    expect(store.latestEvent?.timestamp).toBeGreaterThan(0)
    dispose()
  })

  it('resets entries and closes the panel without affecting another instance', () => {
    const store = new ActionHistoryStore()
    const other = new ActionHistoryStore()
    other.append({ level: 'success', title: 'Other order', type: 'order-loaded' })
    store.append({ level: 'info', title: 'Order', type: 'order-loaded' })
    store.toggle()
    expect(store.isExpanded).toBe(true)

    store.reset()
    expect(store.isExpanded).toBe(false)
    expect(store.latestEvent).toBeNull()
    expect(other.entries).toHaveLength(1)
  })
})
