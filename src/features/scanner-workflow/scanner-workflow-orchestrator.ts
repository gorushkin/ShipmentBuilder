import { reaction, type IReactionDisposer } from 'mobx'

import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import type { ShipmentData } from '@/domain/shipment/types'
import { ScanMachine } from '@/features/scan-machine'

export type ShipmentSnapshotLoader = () => Promise<ShipmentData>

export class ScannerWorkflowOrchestrator {
  private disposed = false
  private disposer: IReactionDisposer | null = null
  private readonly dataStore: ShipmentDataStore
  private readonly loader: ShipmentSnapshotLoader
  private readonly machine: ScanMachine
  private started = false

  constructor(
    machine: ScanMachine,
    dataStore: ShipmentDataStore,
    loader: ShipmentSnapshotLoader,
  ) { this.machine = machine; this.dataStore = dataStore; this.loader = loader }

  start(): void {
    if (this.started) return
    this.started = true
    this.disposer = reaction(
      () => ({ activeTransportPlaceId: this.machine.activeTransportPlaceId, effectId: this.machine.pendingEffect?.id ?? null, source: this.machine.source, step: this.machine.step }),
      (snapshot) => console.info('scanner workflow changed', snapshot),
    )
    void this.load()
  }

  dispose(): void {
    this.disposed = true
    this.disposer?.()
    this.disposer = null
  }

  private async load(): Promise<void> {
    const snapshot = await this.loader()
    if (!this.disposed) this.dataStore.setSnapshot(snapshot)
  }
}
