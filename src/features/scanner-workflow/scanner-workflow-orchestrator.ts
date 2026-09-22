import { action, makeObservable, observable, reaction, type IReactionDisposer } from 'mobx'

import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import type { ShipmentData } from '@/domain/shipment/types'
import { ScanMachine, type ResolvedScanEvent, type ScanEvent } from '@/features/scan-machine'

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
  sourceMode: SourceTableMode = 'containers'

  constructor(machine: ScanMachine, dataStore: ShipmentDataStore, loader: ShipmentSnapshotLoader) {
    this.machine = machine
    this.dataStore = dataStore
    this.loader = loader
    makeObservable(this, {
      setSourceMode: action,
      sourceMode: observable,
    })
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
        intent: this.machine.lastIntent,
        selectedSource: this.machine.selectedSource,
        source: this.machine.source,
        step: this.machine.step,
      }),
      (snapshot, previous) => {
        if (snapshot.source !== previous.source) this.syncSourceFilter()
        if (snapshot.activeTransportPlaceId !== previous.activeTransportPlaceId) {
          this.syncActiveTransportPlace()
        }
        if (snapshot.selectedSource !== previous.selectedSource && snapshot.selectedSource) {
          this.setSourceMode('products')
        }
        if (snapshot.intent && snapshot.intent.id !== previous.intent?.id) {
          console.info('scanner workflow intent', { ...snapshot.intent })
        }
      },
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

  setSourceMode(mode: SourceTableMode): void {
    this.sourceMode = mode
  }

  get sourceFilter() {
    return this.dataStore.sourceFilter
  }

  get selectedSource() {
    return this.machine.selectedSource
  }

  get sourceFilterLabel(): null | string {
    const filter = this.dataStore.sourceFilter
    const data = this.dataStore.data
    if (!filter || !data) return null
    return filter.type === 'container'
      ? (data.containers.find((item) => item.id === filter.containerId)?.barcode ??
          filter.containerId)
      : (data.products.find((item) => item.id === filter.productId)?.code ?? filter.productId)
  }

  get hasSnapshot(): boolean {
    return this.dataStore.hasSnapshot
  }

  createTransportPlace(): null | string {
    const result = this.dataStore.createTransportPlace()
    if (!result.ok) return null
    this.machine.mouseTransportPlaceSelected(result.value.id)
    return result.value.id
  }

  selectContainer(containerId: string): void {
    this.dispatchSelection({ containerId, type: 'mouse-container-selected' })
  }

  selectProduct(productId: string): void {
    this.dispatchSelection({ productId, type: 'mouse-product-selected' })
  }

  selectTransportPlace(transportPlaceId: string): void {
    this.dispatchSelection({ transportPlaceId, type: 'mouse-transport-place-selected' })
  }

  clearSourceFilter(): void {
    this.machine.send({ type: 'mouse-filter-cleared' })
  }

  barcodeUnknown(): void {
    this.machine.barcodeUnknown()
  }

  send(event: ResolvedScanEvent): void {
    this.dispatchSelection(event)
  }

  private dispatchSelection(event: ScanEvent): void {
    const data = this.dataStore.data
    if (
      data &&
      'containerId' in event &&
      !data.containers.some((item) => item.id === event.containerId)
    ) {
      this.machine.send({ code: 'container-not-found', type: 'selection-rejected' })
      return
    }
    if (data && 'productId' in event) {
      if (!data.products.some((item) => item.id === event.productId)) {
        this.machine.send({ code: 'product-not-found', type: 'selection-rejected' })
        return
      }
      const source = this.machine.source
      if (
        source.kind === 'container' &&
        !this.dataStore.remainingLines.some(
          (line) =>
            line.containerId === source.containerId &&
            line.productId === event.productId &&
            line.remainingQuantity > 0,
        )
      ) {
        this.machine.send({ code: 'product-not-in-container', type: 'selection-rejected' })
        return
      }
    }
    if (
      data &&
      'transportPlaceId' in event &&
      !data.transportPlaces.some((item) => item.id === event.transportPlaceId)
    ) {
      this.machine.send({ code: 'transport-place-not-found', type: 'selection-rejected' })
      return
    }
    this.machine.send(event)
  }

  private syncSourceFilter(): void {
    const source = this.machine.source
    if (source.kind === 'container') this.dataStore.setContainerFilter(source.containerId)
    else if (source.kind === 'product') this.dataStore.setProductFilter(source.productId)
    else this.dataStore.clearSourceFilter()
  }

  private syncActiveTransportPlace(): void {
    const id = this.machine.activeTransportPlaceId
    if (id) this.dataStore.selectTransportPlace(id)
  }

  getSourceRows(mode: 'containers'): SourceContainerTableRow[]
  getSourceRows(mode: 'products'): SourceProductTableRow[]
  getSourceRows(mode: SourceTableMode): SourceContainerTableRow[] | SourceProductTableRow[] {
    const data = this.dataStore.data
    if (!data) return []

    const productsById = new Map(data.products.map((product) => [product.id, product]))
    const filter = this.dataStore.sourceFilter
    const remainingLines = this.dataStore.remainingLines.filter(
      (line) =>
        line.remainingQuantity > 0 &&
        (!filter ||
          (filter.type === 'container'
            ? line.containerId === filter.containerId
            : line.productId === filter.productId)),
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
    if (!this.disposed && lifecycleId === this.lifecycleId) {
      this.dataStore.setSnapshot(snapshot)
      this.syncSourceFilter()
      this.syncActiveTransportPlace()
    }
  }
}
