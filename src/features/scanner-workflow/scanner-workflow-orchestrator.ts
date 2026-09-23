import { action, makeObservable, observable, reaction, type IReactionDisposer } from 'mobx'

import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import type { ShipmentData } from '@/domain/shipment/types'
import { noopAlertService, type AlertService } from '@/features/application-alerts'
import { ScanMachine, type ResolvedScanEvent, type ScanEvent } from '@/features/scan-machine'
import type {
  Operation,
  PendingOperation,
  WorkflowCommand,
  SourceScope,
} from '@/features/scan-machine/commands'

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
  private readonly alerts: AlertService
  private started = false
  private lifecycleId = 0
  private lastExecutedId: string | null = null
  sourceMode: SourceTableMode = 'containers'

  constructor(
    machine: ScanMachine,
    dataStore: ShipmentDataStore,
    loader: ShipmentSnapshotLoader,
    alerts: AlertService = noopAlertService,
  ) {
    this.machine = machine
    this.dataStore = dataStore
    this.loader = loader
    this.alerts = alerts
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
          this.sourceMode = 'products'
        }
        const operation = this.machine.pendingEffect
        if (operation) this.execute(operation)
      },
    )
    if (!this.dataStore.hasSnapshot) void this.load(lifecycleId)
    if (this.machine.pendingEffect) this.execute(this.machine.pendingEffect)
  }

  dispose(): void {
    this.disposed = true
    this.started = false
    this.lifecycleId += 1
    this.disposer?.()
    this.disposer = null
  }

  setSourceMode(mode: SourceTableMode): void {
    if (this.isBusy) return
    this.sourceMode = mode
  }

  get isBusy() {
    return this.machine.isTransferring
  }
  get isWaiting() {
    return this.machine.isWaiting
  }
  get step() {
    return this.machine.step
  }
  get feedback() {
    return this.machine.feedback
  }
  get selectedSourceLineId() {
    return this.machine.selectedSourceLineId
  }
  get selectedDestinationProductId() {
    return this.machine.selectedDestinationProductId
  }
  get order() {
    return this.dataStore.data?.order
  }
  get orderTotals() {
    return this.dataStore.orderTotals
  }
  get remainingTotals() {
    return this.dataStore.remainingTotals
  }
  get distributedUnits() {
    return this.dataStore.distributedUnits
  }
  get distributionProgress() {
    return this.dataStore.distributionProgress
  }
  get selectedTransferCommand(): WorkflowCommand {
    if (this.machine.selectedSourceLineId) return 'transfer-source-line'
    if (this.machine.source.kind === 'container')
      return this.machine.selectedSource?.kind === 'product'
        ? 'transfer-product-from-container'
        : 'transfer-container'
    return 'transfer-product'
  }
  command(command: WorkflowCommand): void {
    this.send({ command, type: 'command-scanned' })
  }
  selectSourceLine(sourceLineId: string): void {
    const line = this.dataStore.remainingLines.find((line) => line.id === sourceLineId)
    if (!line || line.remainingQuantity <= 0) {
      this.reject('Нет остатка в выбранной строке')
      return
    }
    this.dispatchSelection({
      productId: line.productId,
      sourceLineId,
      type: 'mouse-source-line-selected',
    })
  }
  selectDestinationProduct(productId: string): void {
    this.dispatchSelection({ productId, type: 'mouse-destination-product-selected' })
  }
  get quantityContext() {
    const step = this.machine.step
    if (step.kind !== 'awaiting-quantity') return null
    const op = step.operation
    const productId = op.kind === 'return' ? op.productId : op.scope.productId
    const product = this.dataStore.data?.products.find((p) => p.id === productId)
    if (!product) return null
    const maximum =
      op.kind === 'return'
        ? this.dataStore.returnAvailable(step.transportPlaceId, productId)
        : this.dataStore
            .sourceLinesFor(op.scope)
            .reduce((sum, line) => sum + line.remainingQuantity, 0)
    return { maximum, product }
  }
  submitQuantity(quantity: number): void {
    const step = this.machine.step
    if (step.kind !== 'awaiting-quantity') return
    const error = this.validateOperation({ ...step.operation, quantity }, step.transportPlaceId)
    if (error) {
      this.reject(error)
      return
    }
    this.machine.send({ quantity, type: 'quantity-submitted' })
  }
  canCommand(command: WorkflowCommand): boolean {
    if (!this.started || !this.hasSnapshot || this.isBusy) return false
    if (command === 'cancel') return this.isWaiting
    if (this.isWaiting) return false
    const source = this.machine.source
    const scope = this.machine.sourceScope
    if (command === 'return-transport-place')
      return this.dataStore.returnAvailable(this.machine.activeTransportPlaceId) > 0
    if (command === 'return-product' || command === 'request-return-quantity')
      return Boolean(
        this.machine.selectedDestinationProductId &&
        this.dataStore.returnAvailable(
          this.machine.activeTransportPlaceId,
          this.machine.selectedDestinationProductId,
        ) > 0,
      )
    let target: SourceScope | null = scope
    if (command === 'transfer-container')
      target = source.kind === 'container' ? { ...source } : null
    if (command === 'transfer-filtered') target = source.kind !== 'none' ? { ...source } : null
    if (command === 'transfer-source-line' && scope?.kind !== 'line') return false
    if (command === 'request-transfer-quantity' && this.machine.selectedSource?.kind !== 'product')
      return false
    if (
      command === 'transfer-product-from-container' &&
      (source.kind !== 'container' || this.machine.selectedSource?.kind !== 'product')
    )
      return false
    if (command === 'transfer-product' || command === 'transfer-next-product-line')
      target =
        source.kind === 'product'
          ? { ...source, next: command === 'transfer-next-product-line' }
          : null
    return Boolean(target && this.dataStore.validateSource(target).ok)
  }
  private reject(message: string): void {
    this.machine.send({ message, type: 'workflow-rejected' })
  }
  private validateOperation(operation: Operation, transportPlaceId: string | null): string | null {
    if (
      transportPlaceId &&
      !this.dataStore.data?.transportPlaces.some((p) => p.id === transportPlaceId)
    )
      return 'Транспортное место не найдено'
    if (operation.kind === 'transfer') {
      const result = this.dataStore.validateSource(operation.scope, operation.quantity)
      return result.ok
        ? null
        : result.code === 'quantity-invalid'
          ? 'Некорректное количество или недостаточный остаток'
          : 'Нет доступного остатка для переноса'
    }
    if (!transportPlaceId) return 'Транспортное место не выбрано'
    const available = this.dataStore.returnAvailable(transportPlaceId, operation.productId)
    if (!available) return 'В транспортном месте нет выбранного товара или оно пусто'
    if (
      operation.quantity !== undefined &&
      (!Number.isInteger(operation.quantity) ||
        operation.quantity < 1 ||
        operation.quantity > available)
    )
      return 'Некорректное количество или недостаточный остаток'
    return null
  }
  private execute(operation: PendingOperation): void {
    if (!this.started || this.disposed || this.lastExecutedId === operation.id) return
    this.lastExecutedId = operation.id
    let transportPlaceId = operation.transportPlaceId
    try {
      const error = this.validateOperation(operation, transportPlaceId)
      if (error) throw new Error(error)
      if (!transportPlaceId) {
        const created = this.dataStore.createTransportPlace()
        if (!created.ok) throw new Error('Не удалось создать транспортное место')
        transportPlaceId = created.value.id
      }
      const result =
        operation.kind === 'transfer'
          ? this.dataStore.transferScoped(operation.scope, transportPlaceId, operation.quantity)
          : !operation.productId
            ? this.dataStore.returnTransportPlaceContents(transportPlaceId)
            : operation.quantity === undefined
              ? this.dataStore.returnProduct({ productId: operation.productId, transportPlaceId })
              : this.dataStore.returnProductQuantity({
                  productId: operation.productId,
                  quantity: operation.quantity,
                  transportPlaceId,
                })
      if (!result.ok) throw new Error('Операция не выполнена: ' + result.code)
      this.machine.send({ id: operation.id, transportPlaceId, type: 'operation-succeeded' })
    } catch (error) {
      this.machine.send({
        id: operation.id,
        message: error instanceof Error ? error.message : 'Не удалось выполнить операцию',
        transportPlaceId: transportPlaceId ?? undefined,
        type: 'operation-failed',
      })
    }
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
    if (this.isBusy || this.isWaiting || !this.started) return null
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
    const issue = this.machine.barcodeUnknown()
    if (issue) this.alerts.publish(issue)
  }

  send(event: ResolvedScanEvent): void {
    this.dispatchSelection(event)
  }

  private dispatchSelection(event: ScanEvent): void {
    if (this.isBusy) return
    if (!this.started || !this.hasSnapshot) {
      this.reject('Данные заказа ещё не загружены')
      return
    }
    if (this.machine.step.kind === 'awaiting-quantity') {
      this.machine.send(event)
      return
    }
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
        event.type === 'mouse-destination-product-selected' ||
        this.machine.step.kind === 'awaiting-return-product'
      ) {
        if (!this.dataStore.returnAvailable(this.machine.activeTransportPlaceId, event.productId)) {
          this.reject('Товар отсутствует в активном транспортном месте')
          return
        }
        this.machine.send(event)
        return
      }
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
      event.type === 'command-scanned' &&
      event.command === 'request-transfer-quantity' &&
      !this.canCommand(event.command)
    ) {
      this.reject('Нет выбранного товара с доступным остатком')
      return
    }
    if (
      event.type === 'command-scanned' &&
      (event.command === 'return-product' || event.command === 'request-return-quantity') &&
      !this.machine.isWaiting
    ) {
      const error = this.validateOperation(
        { kind: 'return', productId: this.machine.selectedDestinationProductId ?? undefined },
        this.machine.activeTransportPlaceId,
      )
      if (error) {
        this.reject(error)
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

    if (filter) {
      return remainingLines.flatMap((line) => {
        const product = productsById.get(line.productId)
        if (!product) return []
        return [
          {
            boxes: line.remainingQuantity / product.unitsPerBox,
            code: product.code,
            containerName:
              data.containers.find((c) => c.id === line.containerId)?.barcode ?? line.containerId,
            containers: 1,
            id: line.id,
            name: product.name,
            productId: product.id,
            sourceLineId: line.id,
            units: line.remainingQuantity,
          },
        ]
      })
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
    try {
      const snapshot = await this.loader()
      if (!this.disposed && lifecycleId === this.lifecycleId) {
        this.dataStore.setSnapshot(snapshot)
        this.syncSourceFilter()
        if (!this.machine.activeTransportPlaceId && snapshot.transportPlaces.length > 0) {
          this.machine.mouseTransportPlaceSelected(snapshot.transportPlaces[0].id)
        }
        this.syncActiveTransportPlace()
      }
    } catch {
      if (!this.disposed && lifecycleId === this.lifecycleId)
        this.reject('Не удалось загрузить заказ')
    }
  }
}
