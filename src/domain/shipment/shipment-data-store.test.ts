import { describe, expect, it } from 'vitest'

import { createDemoData } from './demo-data'
import { ShipmentDataStore } from './shipment-data-store'

describe('ShipmentDataStore', () => {
  it('returns deleted place contents without changing other allocations or source identities', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    const first = 'ORD-001-TP-001'
    const created = store.createTransportPlace()
    if (!created.ok) throw new Error('Creation failed')
    const second = created.value.id
    store.transferSourceLines(['L1'], first)
    store.transferSourceLines(['L2'], second)
    const source = JSON.stringify(store.data?.sourceLines)
    const markings = JSON.stringify(store.data?.markingCodes)
    expect(store.deleteTransportPlace(second).ok).toBe(true)
    expect(store.distributedUnits).toBe(10)
    expect(store.activeTransportPlaceId).toBe(first)
    expect(store.data?.allocationLines.every((line) => line.transportPlaceId === first)).toBe(true)
    expect(store.remainingLines.find((line) => line.id === 'L2')?.remainingQuantity).toBe(5)
    expect(JSON.stringify(store.data?.sourceLines)).toBe(source)
    expect(JSON.stringify(store.data?.markingCodes)).toBe(markings)
    const before = JSON.stringify(store.data)
    expect(store.deleteTransportPlace(second).ok).toBe(false)
    expect(JSON.stringify(store.data)).toBe(before)
  })

  it('selects the next place when deleting the first and never reuses deleted numbers', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    const first = 'ORD-001-TP-001'
    const second = store.createTransportPlace()
    if (!second.ok) throw new Error('Creation failed')
    store.selectTransportPlace(first)
    store.deleteTransportPlace(first)
    expect(store.activeTransportPlaceId).toBe(second.value.id)
    store.deleteTransportPlace(second.value.id)
    expect(store.activeTransportPlaceId).toBeNull()
    expect(store.data?.transportPlaces).toEqual([])
    expect(store.createTransportPlace()).toMatchObject({ ok: true, value: { sequence: 3 } })
    store.setSnapshot(createDemoData())
    expect(store.createTransportPlace()).toMatchObject({ ok: true, value: { sequence: 2 } })
  })

  it('rejects an invalid batch atomically and keeps source identity on a valid batch', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    const source = JSON.stringify(store.data?.sourceLines)
    expect(store.transferSourceLines(['L1', 'missing'], 'ORD-001-TP-001').ok).toBe(false)
    expect(store.distributedUnits).toBe(0)
    expect(store.transferSourceLines(['L1', 'L2'], 'ORD-001-TP-001')).toMatchObject({
      ok: true,
      value: { quantity: 15, sourceLineIds: ['L1', 'L2'] },
    })
    expect(JSON.stringify(store.data?.sourceLines)).toBe(source)
  })
  it('rejects invalid scoped quantities without spilling into other containers', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    for (const quantity of [0, -1, 1.5, NaN, Infinity, 11]) {
      expect(
        store.transferScoped(
          { containerId: 'C1', kind: 'container', productId: 'P1' },
          'ORD-001-TP-001',
          quantity,
        ).ok,
      ).toBe(false)
    }
    expect(store.distributedUnits).toBe(0)
  })
  it('isolates a snapshot and resets context when it is replaced', () => {
    const store = new ShipmentDataStore()
    const first = createDemoData()
    store.setSnapshot(first)
    store.setContainerFilter('C1')
    store.selectTransportPlace('ORD-001-TP-001')
    first.sourceLines[0].quantity = 1
    store.setSnapshot(createDemoData())
    expect(store.sourceFilter).toBeNull()
    expect(store.activeTransportPlaceId).toBeNull()
    expect(store.remainingLines[0].quantity).toBe(10)
  })
  it('transfers the first remaining source line for a product in snapshot order', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    expect(
      store.transferNextProductLine({ productId: 'P1', transportPlaceId: 'ORD-001-TP-001' }),
    ).toMatchObject({ ok: true, value: { sourceLineIds: ['L1'] } })
    expect(store.remainingLines.find((x) => x.id === 'L1')?.remainingQuantity).toBe(0)
    expect(store.remainingLines.find((x) => x.id === 'L3')?.remainingQuantity).toBe(15)
  })
  it('returns a typed failure without changing allocations', () => {
    const store = new ShipmentDataStore()
    store.setSnapshot(createDemoData())
    expect(
      store.transferProductFromContainer({
        containerId: 'C1',
        productId: 'P4',
        transportPlaceId: 'ORD-001-TP-001',
      }),
    ).toEqual({ code: 'product-not-in-container', ok: false })
    expect(store.distributedUnits).toBe(0)
  })
})
