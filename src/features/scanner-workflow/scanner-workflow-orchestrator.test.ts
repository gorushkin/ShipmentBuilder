import { autorun } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import { createDemoData, createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { ScanMachine } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

describe('ScannerWorkflowOrchestrator', () => {
  it('loads one snapshot and logs machine changes without mutating data context', async () => {
    const loader = vi.fn(() => Promise.resolve(createDemoData()))
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const dataStore = new ShipmentDataStore()
    const machine = new ScanMachine()
    const orchestrator = new ScannerWorkflowOrchestrator(machine, dataStore, loader)

    orchestrator.start()
    orchestrator.start()
    await Promise.resolve()
    machine.send({ containerId: 'C1', type: 'container-scanned' })

    expect(loader).toHaveBeenCalledTimes(1)
    expect(dataStore.hasSnapshot).toBe(true)
    expect(dataStore.sourceFilter).toBeNull()
    expect(log).toHaveBeenCalledTimes(1)
    orchestrator.dispose()
    log.mockRestore()
  })

  it('ignores a snapshot resolved after disposal', async () => {
    let resolve!: (value: ReturnType<typeof createDemoData>) => void
    const loader = () =>
      new Promise<ReturnType<typeof createDemoData>>((done) => {
        resolve = done
      })
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, loader)

    orchestrator.start()
    orchestrator.dispose()
    resolve(createDemoData())
    await Promise.resolve()

    expect(dataStore.hasSnapshot).toBe(false)
  })

  it('projects source container and product rows from remaining data', async () => {
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, () =>
      Promise.resolve(createDemoData()),
    )
    orchestrator.start()
    await Promise.resolve()

    expect(orchestrator.getSourceRows('containers')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ boxes: 2, id: 'C1', sku: 2, units: 15, volume: 0.0125 }),
        expect.objectContaining({ boxes: 3.5, id: 'C2', sku: 2, units: 23, volume: 0.031 }),
        expect.objectContaining({ boxes: 2.4, id: 'C3', sku: 2, units: 6, volume: 0.005 }),
      ]),
    )
    expect(orchestrator.getSourceRows('products')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ boxes: 2.5, containers: 2, id: 'P1', units: 25 }),
      ]),
    )
    dataStore.setContainerFilter('C1')
    expect(orchestrator.getSourceRows('products')).toHaveLength(4)
    orchestrator.dispose()
  })

  it('projects transport place and active transport place product rows', async () => {
    const snapshot = createDemoData()
    snapshot.allocationLines = [
      { id: 'A1', quantity: 4, sourceLineId: 'L1', transportPlaceId: 'ORD-001-TP-001' },
      { id: 'A2', quantity: 5, sourceLineId: 'L3', transportPlaceId: 'ORD-001-TP-001' },
      { id: 'A3', quantity: 5, sourceLineId: 'L2', transportPlaceId: 'ORD-001-TP-001' },
    ]
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, () =>
      Promise.resolve(snapshot),
    )
    orchestrator.start()
    await Promise.resolve()

    expect(orchestrator.getDestinationRows('transport-places')).toEqual([
      expect.objectContaining({
        boxes: 1.9,
        id: 'ORD-001-TP-001',
        isActive: false,
        sku: 2,
        units: 14,
      }),
    ])
    expect(orchestrator.getDestinationRows('transport-place-products')).toEqual([])

    dataStore.selectTransportPlace('ORD-001-TP-001')
    expect(orchestrator.getDestinationRows('transport-places')[0].isActive).toBe(true)
    expect(orchestrator.getDestinationRows('transport-place-products')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ boxes: 0.9, id: 'P1', units: 9 }),
        expect.objectContaining({ boxes: 1, id: 'P2', units: 5 }),
      ]),
    )
    expect(orchestrator.getSourceRows('containers')[0]).toMatchObject({ units: 6 })
    orchestrator.dispose()
  })

  it('returns empty projections before snapshot load and can restart after disposal', async () => {
    const dataStore = new ShipmentDataStore()
    const loader = vi.fn(() => Promise.resolve(createDemoData()))
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, loader)

    expect(orchestrator.getSourceRows('containers')).toEqual([])
    expect(orchestrator.getSourceRows('products')).toEqual([])
    expect(orchestrator.getDestinationRows('transport-places')).toEqual([])
    expect(orchestrator.getDestinationRows('transport-place-products')).toEqual([])

    orchestrator.start()
    orchestrator.dispose()
    orchestrator.start()
    await Promise.resolve()
    expect(loader).toHaveBeenCalledTimes(2)
    expect(dataStore.hasSnapshot).toBe(true)
    orchestrator.dispose()
  })

  it('projects the large demo scenario from its snapshot without relying on the legacy store', async () => {
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, () =>
      Promise.resolve(createLargeDemoData()),
    )
    orchestrator.start()
    await Promise.resolve()

    expect(orchestrator.getSourceRows('containers')).toHaveLength(250)
    expect(orchestrator.getSourceRows('products')).toHaveLength(500)
    expect(orchestrator.getDestinationRows('transport-places')).toHaveLength(500)
    dataStore.selectTransportPlace('ORD-LARGE-001-TP-001')
    expect(orchestrator.getDestinationRows('transport-place-products')).toHaveLength(1)
    orchestrator.dispose()
  })

  it('keeps table projections reactive to data-store changes', () => {
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, () =>
      Promise.resolve(createDemoData()),
    )
    const observedUnits: number[] = []
    const dispose = autorun(() => {
      observedUnits.push(
        orchestrator.getSourceRows('containers').reduce((total, row) => total + row.units, 0),
      )
    })

    dataStore.setSnapshot(createDemoData())
    dataStore.data!.sourceLines[0].quantity += 2

    expect(observedUnits).toEqual([0, 44, 46])
    dispose()
  })
})
