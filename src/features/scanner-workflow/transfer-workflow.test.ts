import { describe, expect, it, vi } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { BarcodeInputAdapter, BarcodeResolver, ScanMachine } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

async function setup(emptyPlaces = false) {
  const data = new ShipmentDataStore()
  const machine = new ScanMachine()
  const snapshot = createDemoData()
  if (emptyPlaces) snapshot.transportPlaces = []
  const workflow = new ScannerWorkflowOrchestrator(machine, data, () => Promise.resolve(snapshot))
  const adapter = new BarcodeInputAdapter(new BarcodeResolver(() => data.data), workflow)
  workflow.start()
  await Promise.resolve()
  return { data, machine, scan: (value: string) => adapter.submit(value), workflow }
}

describe('Transfers and returns through scanner workflow', () => {
  it('activates a newly created place and transfers into it without creating another', async () => {
    const { data, machine, scan, workflow } = await setup()
    const createdId = workflow.createTransportPlace()
    expect(machine.activeTransportPlaceId).toBe(createdId)
    expect(data.activeTransportPlaceId).toBe(createdId)
    scan('C1')
    scan('C1')
    expect(data.data?.transportPlaces).toHaveLength(2)
    expect(data.data?.allocationLines.every((line) => line.transportPlaceId === createdId)).toBe(
      true,
    )
    workflow.dispose()
  })
  it('uses the initially loaded place for the first transfer without creating another', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('C1')
    scan('C1')
    expect(data.data?.transportPlaces).toHaveLength(1)
    expect(machine.activeTransportPlaceId).toBe('ORD-001-TP-001')
    expect(data.activeTransportPlaceId).toBe(machine.activeTransportPlaceId)
    expect(data.distributedUnits).toBe(15)
    workflow.dispose()
  })
  it('auto-creates one destination, preserves an empty filter and rejects another transfer', async () => {
    const { data, machine, scan, workflow } = await setup(true)
    scan('C1')
    scan('C1')
    expect(data.distributedUnits).toBe(15)
    expect(data.data?.transportPlaces).toHaveLength(1)
    expect(machine.activeTransportPlaceId).toBe(data.activeTransportPlaceId)
    expect(workflow.getSourceRows('products')).toEqual([])
    scan('C1')
    expect(machine.feedback.kind).toBe('error')
    expect(data.data?.transportPlaces).toHaveLength(1)
    expect(data.distributedUnits).toBe(15)
    expect(machine.isTransferring).toBe(false)
    workflow.dispose()
  })

  it('clicks a container then scans only its product, preserving filter and other containers', async () => {
    const { data, machine, scan, workflow } = await setup()
    workflow.selectContainer('C1')
    scan('P1')
    expect(data.distributedUnits).toBe(10)
    expect(data.remainingLines.find((l) => l.id === 'L3')?.remainingQuantity).toBe(15)
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(data.sourceFilter).toEqual({ containerId: 'C1', type: 'container' })
    scan('P2')
    expect(data.distributedUnits).toBe(15)
    workflow.dispose()
  })

  it('uses the clicked row before the first remaining row and preserves domain records', async () => {
    const { data, scan, workflow } = await setup()
    const source = JSON.stringify(data.data?.sourceLines)
    const markings = JSON.stringify(data.data?.markingCodes)
    scan('P1')
    expect(workflow.getSourceRows('products').map((r) => r.id)).toEqual(['L1', 'L3'])
    workflow.selectSourceLine('L3')
    scan('P1')
    expect(data.data?.allocationLines.map((a) => a.sourceLineId)).toEqual(['L3'])
    scan('P1')
    expect(data.data?.allocationLines.map((a) => a.sourceLineId)).toEqual(['L3', 'L1'])
    expect(JSON.stringify(data.data?.sourceLines)).toBe(source)
    expect(JSON.stringify(data.data?.markingCodes)).toBe(markings)
    workflow.dispose()
  })

  it('buttons and command barcodes execute equivalent full operations', async () => {
    const mouse = await setup()
    const scanner = await setup()
    mouse.workflow.selectProduct('P1')
    mouse.workflow.command('transfer-product')
    scanner.scan('P1')
    scanner.scan('CMD:PRODUCT')
    expect(mouse.data.data?.allocationLines).toEqual(scanner.data.data?.allocationLines)
    expect(mouse.data.distributedUnits).toBe(25)
    mouse.workflow.dispose()
    scanner.workflow.dispose()
  })

  it('transfers all filtered lines and returns the whole place without losing source context', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('P1')
    scan('CMD:ALL')
    expect(data.distributedUnits).toBe(25)
    scan('CMD:RETURN-ALL')
    expect(data.distributedUnits).toBe(0)
    expect(machine.source).toEqual({ kind: 'product', productId: 'P1' })
    expect(workflow.getSourceRows('products')).toHaveLength(2)
    workflow.dispose()
  })

  it('acquires a return target independently of the source filter and keeps other places', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('C1')
    scan('C1')
    const first = machine.activeTransportPlaceId!
    workflow.createTransportPlace()
    scan('C2')
    scan('C2')
    workflow.selectTransportPlace(first)
    scan('CMD:RETURN')
    scan('P4')
    expect(machine.step.kind).toBe('awaiting-return-product')
    scan('P1')
    expect(data.returnAvailable(first, 'P1')).toBe(0)
    expect(data.returnAvailable(first, 'P2')).toBe(5)
    expect(data.distributedUnits).toBe(28)
    expect(machine.source).toEqual({ containerId: 'C2', kind: 'container' })
    workflow.dispose()
  })

  it('limits partial quantities to a pinned line and supports cancellation without creating a place', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('P1')
    workflow.selectSourceLine('L1')
    scan('CMD:QTY')
    expect(workflow.quantityContext?.maximum).toBe(10)
    workflow.submitQuantity(11)
    expect(machine.step.kind).toBe('awaiting-quantity')
    expect(data.distributedUnits).toBe(0)
    expect(data.data?.transportPlaces).toHaveLength(1)
    scan('CMD:CANCEL')
    expect(machine.selectedSourceLineId).toBe('L1')
    expect(machine.step.kind).toBe('product-selected')
    workflow.dispose()
  })

  it('moves a quantity across lines in stable order, then returns part of it', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('P1')
    scan('CMD:QTY')
    workflow.submitQuantity(12)
    expect(data.data?.allocationLines.map((l) => [l.sourceLineId, l.quantity])).toEqual([
      ['L1', 10],
      ['L3', 2],
    ])
    scan('CMD:RETURN-QTY')
    scan('P1')
    expect(workflow.quantityContext?.maximum).toBe(12)
    workflow.submitQuantity(4)
    expect(data.distributedUnits).toBe(8)
    expect(data.remainingLines.find((l) => l.id === 'L1')?.remainingQuantity).toBe(4)
    expect(machine.selectedDestinationProductId).toBeNull()
    expect(machine.source).toEqual({ kind: 'product', productId: 'P1' })
    workflow.dispose()
  })

  it('does not spill a container quantity into another container', async () => {
    const { data, machine, scan, workflow } = await setup()
    workflow.selectContainer('C1')
    workflow.selectProduct('P1')
    scan('CMD:QTY')
    workflow.submitQuantity(12)
    expect(machine.step.kind).toBe('awaiting-quantity')
    workflow.submitQuantity(4)
    expect(data.distributedUnits).toBe(4)
    expect(data.remainingLines.find((l) => l.id === 'L3')?.remainingQuantity).toBe(15)
    expect(machine.step.kind).toBe('container-selected')
    workflow.dispose()
  })

  it('revalidates quantity against current data and keeps the dialog open', async () => {
    const { data, machine, scan, workflow } = await setup()
    scan('P1')
    scan('CMD:QTY')
    data.transferProductQuantity({
      productId: 'P1',
      quantity: 20,
      transportPlaceId: 'ORD-001-TP-001',
    })
    workflow.submitQuantity(10)
    expect(machine.step.kind).toBe('awaiting-quantity')
    expect(workflow.quantityContext?.maximum).toBe(5)
    expect(data.distributedUnits).toBe(20)
    workflow.dispose()
  })

  it('recovers from an execution exception without replaying on restart', async () => {
    const transfer = vi
      .spyOn(ShipmentDataStore.prototype, 'transferScoped')
      .mockImplementationOnce(() => {
        throw new Error('Failure')
      })
    const { data, machine, scan, workflow } = await setup()
    scan('C1')
    scan('C1')
    expect(machine.isTransferring).toBe(false)
    expect(machine.feedback.message).toBe('Failure')
    expect(data.distributedUnits).toBe(0)
    workflow.dispose()
    workflow.start()
    await Promise.resolve()
    expect(transfer).toHaveBeenCalledTimes(1)
    scan('C1')
    expect(data.distributedUnits).toBe(15)
    transfer.mockRestore()
    workflow.dispose()
  })

  it('resolves newly created destination barcodes without transferring', async () => {
    const { data, machine, scan, workflow } = await setup()
    const id = workflow.createTransportPlace()
    scan('TM1')
    scan('tm2')
    expect(machine.activeTransportPlaceId).toBe(id)
    expect(data.distributedUnits).toBe(0)
    workflow.dispose()
  })
})
