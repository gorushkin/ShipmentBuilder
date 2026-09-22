import { reaction, type IReactionDisposer } from 'mobx'

import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import type { ShipmentData } from '@/domain/shipment/types'
import { ScanMachine } from '@/features/scan-machine'

import type {
  DestinationProductTableRow,
  DestinationTableMode,
  DestinationTransportPlaceTableRow,
  SourceContainerTableRow,
  SourceProductTableRow,
  SourceTableMode,
} from './table-projections'

export type ShipmentSnapshotLoader = () => Promise<ShipmentData>

export class ScannerWorkflowOrchestrator {
  private disposed = false
  private disposer: IReactionDisposer | null = null
  private readonly dataStore: ShipmentDataStore
  private readonly loader: ShipmentSnapshotLoader
  private readonly machine: ScanMachine
  private started = false
  private lifecycleId = 0

  constructor(machine: ScanMachine, dataStore: ShipmentDataStore, loader: ShipmentSnapshotLoader) {
    this.machine = machine
    this.dataStore = dataStore
    this.loader = loader
  }

  start(): void {
    if (this.started) return
    this.disposed = false
    this.started = true
    const lifecycleId = ++this.lifecycleId
    this.disposer = reaction(
      () => ({
        activeTransportPlaceId: this.machine.activeTransportPlaceId,
        effectId: this.machine.pendingEffect?.id ?? null,
        source: this.machine.source,
        step: this.machine.step,
      }),
      (snapshot) => console.info('scanner workflow changed', snapshot),
    )
    void this.load(lifecycleId)
  }

  dispose(): void {
    this.disposed = true
    this.started = false
    this.lifecycleId += 1
    this.disposer?.()
    this.disposer = null
  }

  getSourceRows(mode: 'containers'): SourceContainerTableRow[]
  getSourceRows(mode: 'products'): SourceProductTableRow[]
  getSourceRows(mode: SourceTableMode): SourceContainerTableRow[] | SourceProductTableRow[] {
    const data = this.dataStore.data
    if (!data) return []

    const productsById = new Map(data.products.map((product) => [product.id, product]))
    const remainingLines = this.dataStore.remainingLines.filter(
      (line) => line.remainingQuantity > 0,
    )

    if (mode === 'containers') {
      const rows = new Map<
        string,
        {
          boxes: number
          id: string
          name: string
          products: Set<string>
          units: number
          volume: number
        }
      >()
      const containersById = new Map(data.containers.map((item) => [item.id, item]))

      for (const line of remainingLines) {
        const container = containersById.get(line.containerId)
        const product = productsById.get(line.productId)
        if (!container || !product) continue

        const row = rows.get(container.id) ?? {
          boxes: 0,
          id: container.id,
          name: container.barcode,
          products: new Set<string>(),
          units: 0,
          volume: 0,
        }
        row.products.add(product.id)
        row.units += line.remainingQuantity
        row.boxes += line.remainingQuantity / product.unitsPerBox
        row.volume += line.remainingQuantity * product.unitVolumeM3
        rows.set(container.id, row)
      }

      return [...rows.values()]
        .map(({ products, ...row }) => ({ ...row, sku: products.size }))
        .sort((left, right) => left.name.localeCompare(right.name))
    }

    const rows = new Map<
      string,
      {
        boxes: number
        code: string
        containers: Set<string>
        id: string
        name: string
        units: number
      }
    >()
    for (const line of remainingLines) {
      const product = productsById.get(line.productId)
      if (!product) continue
      const row = rows.get(product.id) ?? {
        boxes: 0,
        code: product.code,
        containers: new Set<string>(),
        id: product.id,
        name: product.name,
        units: 0,
      }
      row.units += line.remainingQuantity
      row.boxes += line.remainingQuantity / product.unitsPerBox
      row.containers.add(line.containerId)
      rows.set(product.id, row)
    }

    return [...rows.values()]
      .map(({ containers, ...row }) => ({ ...row, containers: containers.size }))
      .sort((left, right) => left.code.localeCompare(right.code))
  }

  getDestinationRows(mode: 'transport-places'): DestinationTransportPlaceTableRow[]
  getDestinationRows(mode: 'transport-place-products'): DestinationProductTableRow[]
  getDestinationRows(
    mode: DestinationTableMode,
  ): DestinationTransportPlaceTableRow[] | DestinationProductTableRow[] {
    const data = this.dataStore.data
    if (!data) return []

    const productsById = new Map(data.products.map((product) => [product.id, product]))
    const sourceLinesById = new Map(data.sourceLines.map((line) => [line.id, line]))

    if (mode === 'transport-places') {
      const rows = new Map<
        string,
        {
          boxes: number
          id: string
          isActive: boolean
          name: string
          products: Set<string>
          sequence: number
          units: number
          volume: number
        }
      >(
        data.transportPlaces.map((place) => [
          place.id,
          {
            boxes: 0,
            id: place.id,
            isActive: place.id === this.dataStore.activeTransportPlaceId,
            name: place.number,
            products: new Set<string>(),
            sequence: place.sequence,
            units: 0,
            volume: 0,
          },
        ]),
      )

      for (const allocation of data.allocationLines) {
        if (allocation.quantity <= 0) continue
        const row = rows.get(allocation.transportPlaceId)
        const sourceLine = sourceLinesById.get(allocation.sourceLineId)
        const product = sourceLine ? productsById.get(sourceLine.productId) : undefined
        if (!row || !product) continue
        row.products.add(product.id)
        row.units += allocation.quantity
        row.boxes += allocation.quantity / product.unitsPerBox
        row.volume += allocation.quantity * product.unitVolumeM3
      }

      return [...rows.values()]
        .sort((left, right) => left.sequence - right.sequence)
        .map(({ products, sequence, ...row }) => ({ ...row, sku: products.size }))
    }

    const activeTransportPlaceId = this.dataStore.activeTransportPlaceId
    if (!activeTransportPlaceId) return []

    const rows = new Map<string, DestinationProductTableRow>()
    for (const allocation of data.allocationLines) {
      if (allocation.transportPlaceId !== activeTransportPlaceId || allocation.quantity <= 0) {
        continue
      }
      const sourceLine = sourceLinesById.get(allocation.sourceLineId)
      const product = sourceLine ? productsById.get(sourceLine.productId) : undefined
      if (!product) continue
      const row = rows.get(product.id) ?? {
        boxes: 0,
        code: product.code,
        id: product.id,
        name: product.name,
        units: 0,
      }
      row.units += allocation.quantity
      row.boxes += allocation.quantity / product.unitsPerBox
      rows.set(product.id, row)
    }

    return [...rows.values()].sort((left, right) => left.code.localeCompare(right.code))
  }

  private async load(lifecycleId: number): Promise<void> {
    const snapshot = await this.loader()
    if (!this.disposed && lifecycleId === this.lifecycleId) this.dataStore.setSnapshot(snapshot)
  }
}
