import { describe, expect, it } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { ScanMachine } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

async function setup() {
  const data = new ShipmentDataStore()
  const machine = new ScanMachine()
  const workflow = new ScannerWorkflowOrchestrator(machine, data, () =>
    Promise.resolve(createDemoData()),
  )

  workflow.start()
  await Promise.resolve()

  return { data, machine, workflow }
}

describe('Destination navigation selection', () => {
  it('accepts repeated selection without changing allocations or the source filter', async () => {
    const { data, machine, workflow } = await setup()
    const id = machine.activeTransportPlaceId!

    workflow.selectContainer('C1')
    const filter = data.sourceFilter
    const allocations = structuredClone(data.data?.allocationLines.map((line) => ({ ...line })))

    expect(workflow.selectTransportPlace(id)).toBe(true)
    expect(workflow.selectTransportPlace(id)).toBe(true)
    expect(machine.activeTransportPlaceId).toBe(id)
    expect(data.sourceFilter).toEqual(filter)
    expect(data.data?.allocationLines).toEqual(allocations)
    workflow.dispose()
  })

  it('rejects navigation even to the active place while awaiting quantity', async () => {
    const { machine, workflow } = await setup()

    workflow.selectContainer('C1')
    workflow.selectProduct('P1')
    workflow.command('request-transfer-quantity')
    expect(machine.step.kind).toBe('awaiting-quantity')
    expect(workflow.selectTransportPlace(machine.activeTransportPlaceId!)).toBe(false)
    expect(machine.step.kind).toBe('awaiting-quantity')
    workflow.dispose()
  })

  it('rejects missing places and selection before initialization', async () => {
    const { machine, workflow } = await setup()
    const id = machine.activeTransportPlaceId

    expect(workflow.selectTransportPlace('missing')).toBe(false)
    expect(machine.activeTransportPlaceId).toBe(id)
    workflow.dispose()
    expect(workflow.selectTransportPlace(id!)).toBe(false)
  })

  it('rejects selection while a transfer is in progress', async () => {
    const { machine, workflow } = await setup()
    const id = machine.activeTransportPlaceId!

    workflow.dispose()
    machine.mouseContainerSelected('C1')
    machine.send({ command: 'transfer-filtered', type: 'command-scanned' })
    expect(machine.isTransferring).toBe(true)
    expect(workflow.selectTransportPlace(id)).toBe(false)
    expect(machine.activeTransportPlaceId).toBe(id)
  })
})
