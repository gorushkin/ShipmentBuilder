import { describe, expect, it } from 'vitest'

import { createDemoData } from './demo-data'
import { ShipmentDataStore } from './shipment-data-store'

describe('ShipmentDataStore', () => {
  it('isolates a snapshot and resets context when it is replaced', () => {
    const store = new ShipmentDataStore(); const first = createDemoData()
    store.setSnapshot(first); store.setContainerFilter('C1'); store.selectTransportPlace('ORD-001-TP-001')
    first.sourceLines[0].quantity = 1; store.setSnapshot(createDemoData())
    expect(store.sourceFilter).toBeNull(); expect(store.activeTransportPlaceId).toBeNull(); expect(store.remainingLines[0].quantity).toBe(10)
  })
  it('transfers the first remaining source line for a product in snapshot order', () => {
    const store = new ShipmentDataStore(); store.setSnapshot(createDemoData())
    expect(store.transferNextProductLine({ productId: 'P1', transportPlaceId: 'ORD-001-TP-001' })).toMatchObject({ ok: true, value: { sourceLineIds: ['L1'] } })
    expect(store.remainingLines.find((x) => x.id === 'L1')?.remainingQuantity).toBe(0)
    expect(store.remainingLines.find((x) => x.id === 'L3')?.remainingQuantity).toBe(15)
  })
  it('returns a typed failure without changing allocations', () => {
    const store = new ShipmentDataStore(); store.setSnapshot(createDemoData())
    expect(store.transferProductFromContainer({ containerId: 'C1', productId: 'P4', transportPlaceId: 'ORD-001-TP-001' })).toEqual({ code: 'product-not-in-container', ok: false })
    expect(store.distributedUnits).toBe(0)
  })
})
