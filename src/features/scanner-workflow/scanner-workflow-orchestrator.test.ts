import { describe, expect, it, vi } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'
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
    const loader = () => new Promise<ReturnType<typeof createDemoData>>((done) => { resolve = done })
    const dataStore = new ShipmentDataStore()
    const orchestrator = new ScannerWorkflowOrchestrator(new ScanMachine(), dataStore, loader)

    orchestrator.start()
    orchestrator.dispose()
    resolve(createDemoData())
    await Promise.resolve()

    expect(dataStore.hasSnapshot).toBe(false)
  })
})
