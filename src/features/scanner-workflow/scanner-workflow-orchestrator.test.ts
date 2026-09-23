import { autorun } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import { createDemoData, createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { ScanMachine } from '@/features/scan-machine'
import { BarcodeInputAdapter, BarcodeResolver } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

describe('ScannerWorkflowOrchestrator', () => {
  it('loads one snapshot and applies machine selection to the data store', async () => {
    const loader = vi.fn(() => Promise.resolve(createDemoData()))
    const dataStore = new ShipmentDataStore()
    const machine = new ScanMachine()
    const orchestrator = new ScannerWorkflowOrchestrator(machine, dataStore, loader)

    orchestrator.start()
    orchestrator.start()
    await Promise.resolve()
    machine.send({ containerId: 'C1', type: 'container-scanned' })

    expect(loader).toHaveBeenCalledTimes(1)
    expect(dataStore.hasSnapshot).toBe(true)
    expect(dataStore.sourceFilter).toEqual({ containerId: 'C1', type: 'container' })
    expect(orchestrator.sourceMode).toBe('products')
    orchestrator.dispose()
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
    expect(orchestrator.getSourceRows('products')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ containers: 1, id: 'L1', units: 10 }),
        expect.objectContaining({ containers: 1, id: 'L2', units: 5 }),
      ]),
    )
    expect(orchestrator.getSourceRows('products')).toHaveLength(2)
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
        isActive: true,
        sku: 2,
        units: 14,
      }),
    ])
    expect(orchestrator.getDestinationRows('transport-place-products')).toHaveLength(2)

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

  it('rejects a product absent from the selected container and an unknown place without losing context', async () => {
    const dataStore = new ShipmentDataStore()
    const machine = new ScanMachine()
    const orchestrator = new ScannerWorkflowOrchestrator(machine, dataStore, () =>
      Promise.resolve(createDemoData()),
    )
    orchestrator.start()
    await Promise.resolve()
    orchestrator.selectContainer('C1')
    orchestrator.send({ productId: 'P3', type: 'product-scanned' })
    expect(machine.feedback.message).toBe('Товар отсутствует в выбранном контейнере')
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(dataStore.sourceFilter).toEqual({ containerId: 'C1', type: 'container' })
    expect(machine.pendingEffect).toBeNull()

    orchestrator.selectTransportPlace('missing')
    expect(machine.feedback.message).toBe('Транспортное место не найдено')
    expect(dataStore.activeTransportPlaceId).toBe('ORD-001-TP-001')
    expect(dataStore.data?.allocationLines).toEqual([])
    orchestrator.dispose()
  })

  it('publishes one alert for an unknown barcode and ignores it while transferring', () => {
    const alerts = { publish: vi.fn() }
    const machine = new ScanMachine()
    const orchestrator = new ScannerWorkflowOrchestrator(
      machine,
      new ShipmentDataStore(),
      () => Promise.resolve(createDemoData()),
      alerts,
    )

    orchestrator.barcodeUnknown()
    expect(alerts.publish).toHaveBeenCalledOnce()
    expect(alerts.publish).toHaveBeenCalledWith({
      code: 'barcode-unrecognized',
      message: 'ШК не распознан',
      type: 'error',
    })
    expect(machine.feedback).toEqual({ kind: 'error', message: 'ШК не распознан' })

    machine.mouseContainerSelected('C1')
    machine.send({ containerId: 'C1', type: 'container-scanned' })
    orchestrator.barcodeUnknown()
    expect(alerts.publish).toHaveBeenCalledOnce()
    expect(machine.feedback).toEqual({ kind: 'processing', message: 'Обработка…' })
  })

  it('replaces a product filter and returns empty projections after its remainder reaches zero', async () => {
    const dataStore = new ShipmentDataStore()
    const machine = new ScanMachine()
    const orchestrator = new ScannerWorkflowOrchestrator(machine, dataStore, () =>
      Promise.resolve(createDemoData()),
    )
    orchestrator.start()
    await Promise.resolve()

    orchestrator.selectProduct('P1')
    expect(orchestrator.getSourceRows('products').map((row) => row.id)).toEqual(['L1', 'L3'])
    orchestrator.selectProduct('P2')
    expect(machine.source).toEqual({ kind: 'product', productId: 'P2' })
    expect(dataStore.sourceFilter).toEqual({ productId: 'P2', type: 'product' })
    expect(orchestrator.getSourceRows('products').map((row) => row.id)).toEqual(['L2', 'L5'])

    dataStore.data!.allocationLines.push(
      { id: 'A2-L2', quantity: 5, sourceLineId: 'L2', transportPlaceId: 'ORD-001-TP-001' },
      { id: 'A2-L5', quantity: 2, sourceLineId: 'L5', transportPlaceId: 'ORD-001-TP-001' },
    )
    expect(orchestrator.getSourceRows('products')).toEqual([])
    expect(orchestrator.getSourceRows('containers')).toEqual([])
    orchestrator.dispose()
  })

  it('produces matching source context from a clicked row and a resolved scan', async () => {
    const mouseStore = new ShipmentDataStore()
    const scanStore = new ShipmentDataStore()
    const mouseMachine = new ScanMachine()
    const scanMachine = new ScanMachine()
    const mouseWorkflow = new ScannerWorkflowOrchestrator(mouseMachine, mouseStore, () =>
      Promise.resolve(createDemoData()),
    )
    const scanWorkflow = new ScannerWorkflowOrchestrator(scanMachine, scanStore, () =>
      Promise.resolve(createDemoData()),
    )
    mouseWorkflow.start()
    scanWorkflow.start()
    await Promise.resolve()

    mouseWorkflow.selectContainer('C2')
    const adapter = new BarcodeInputAdapter(new BarcodeResolver(createDemoData()), scanWorkflow)
    adapter.submit('c2')
    expect(scanMachine.source).toEqual(mouseMachine.source)
    expect(scanStore.sourceFilter).toEqual(mouseStore.sourceFilter)
    expect(scanWorkflow.sourceMode).toBe(mouseWorkflow.sourceMode)
    expect(scanWorkflow.getSourceRows('products')).toEqual(mouseWorkflow.getSourceRows('products'))
    mouseWorkflow.dispose()
    scanWorkflow.dispose()
  })
})
