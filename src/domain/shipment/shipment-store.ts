import { makeAutoObservable } from 'mobx'

import { createDemoData } from './demo-data'
import type {
  AllocationLine,
  Product,
  RemainingLine,
  ShipmentData,
  ShipmentTotals,
  SourceLine,
  TransportPlace,
} from './types'

export type SourceDisplayMode = 'containers' | 'products'
export type DestinationDisplayMode = 'transport-places' | 'transport-place-products'
export type SourceFilter =
  { containerId: string; type: 'container' } | { productId: string; type: 'product' }

export interface PartialQuantityContext {
  maximum: number
  product: Product
}

function calculateTotals(lines: SourceLine[], products: Product[]): ShipmentTotals {
  const productsById = new Map(products.map((product) => [product.id, product]))
  const containerIds = new Set<string>()
  const productIds = new Set<string>()
  const totals: ShipmentTotals = {
    boxes: 0,
    containers: 0,
    sku: 0,
    units: 0,
    volumeM3: 0,
    weightKg: 0,
  }

  for (const line of lines) {
    if (line.quantity <= 0) continue

    const product = productsById.get(line.productId)
    if (!product) {
      throw new Error(`Товар ${line.productId} строки ${line.id} отсутствует`)
    }

    containerIds.add(line.containerId)
    productIds.add(line.productId)
    totals.units += line.quantity
    totals.boxes += line.quantity / product.unitsPerBox
    totals.weightKg += line.quantity * product.unitWeightKg
    totals.volumeM3 += line.quantity * product.unitVolumeM3
  }

  totals.containers = containerIds.size
  totals.sku = productIds.size
  return totals
}

export class ShipmentStore {
  activeTransportPlaceId: null | string = null
  data: ShipmentData
  destinationDisplayMode: DestinationDisplayMode = 'transport-places'
  selectedContainerId: null | string = null
  selectedProductId: null | string = null
  selectedSourceLineId: null | string = null
  sourceFilter: null | SourceFilter = null
  selectedTransportPlaceProductId: null | string = null
  sourceDisplayMode: SourceDisplayMode = 'containers'

  constructor(data: ShipmentData = createDemoData()) {
    // Копируем и вложенные массивы, чтобы экземпляры не делили данные.
    this.data = {
      aggregationCodes: data.aggregationCodes.map((code) => ({
        ...code,
        markingCodeIds: [...code.markingCodeIds],
      })),
      allocationLines: data.allocationLines.map((line) => ({ ...line })),
      containers: data.containers.map((container) => ({ ...container })),
      markingCodes: data.markingCodes.map((code) => ({ ...code })),
      order: { ...data.order },
      products: data.products.map((product) => ({ ...product })),
      sourceLines: data.sourceLines.map((line) => ({ ...line })),
      transportPlaces: data.transportPlaces.map((place) => ({ ...place })),
    }
    makeAutoObservable(this)

    if (this.data.transportPlaces.length === 0) {
      this.createTransportPlace()
    }
  }

  createTransportPlace(): TransportPlace {
    const sequence =
      this.data.transportPlaces.reduce(
        (highestSequence, place) => Math.max(highestSequence, place.sequence),
        0,
      ) + 1
    const suffix = String(sequence).padStart(3, '0')
    const transportPlace: TransportPlace = {
      id: `${this.data.order.id}-TP-${suffix}`,
      number: `ТМ-${suffix}`,
      orderId: this.data.order.id,
      sequence,
    }

    this.data.transportPlaces.push(transportPlace)
    this.activeTransportPlaceId = transportPlace.id
    this.selectedTransportPlaceProductId = null
    return transportPlace
  }

  selectTransportPlace(transportPlaceId: string): void {
    if (!this.data.transportPlaces.some((place) => place.id === transportPlaceId)) {
      throw new Error(`Транспортное место ${transportPlaceId} отсутствует`)
    }

    this.activeTransportPlaceId = transportPlaceId
    this.selectedTransportPlaceProductId = null
  }

  selectContainer(containerId: string): void {
    if (!this.data.containers.some((container) => container.id === containerId)) {
      throw new Error(`Контейнер ${containerId} отсутствует`)
    }

    if (
      !this.remainingLines.some(
        (line) => line.containerId === containerId && line.remainingQuantity > 0,
      )
    ) {
      throw new Error(`В контейнере ${containerId} нет остатка к распределению`)
    }

    this.selectedContainerId = containerId
    this.selectedProductId = null
    this.selectedSourceLineId = null
  }

  selectProduct(productId: string): void {
    if (!this.data.products.some((product) => product.id === productId)) {
      throw new Error(`Товар ${productId} отсутствует`)
    }
    if (
      !this.remainingLines.some(
        (line) => line.productId === productId && line.remainingQuantity > 0,
      )
    ) {
      throw new Error(`У товара ${productId} нет остатка к распределению`)
    }

    this.selectedContainerId = null
    this.selectedProductId = productId
    this.selectedSourceLineId = null
  }

  setSourceDisplayMode(mode: SourceDisplayMode): void {
    if (this.sourceDisplayMode === mode) return

    this.sourceDisplayMode = mode
    this.selectedContainerId = null
    this.selectedProductId = null
    this.selectedSourceLineId = null
  }

  setContainerFilter(containerId: string): void {
    if (!this.data.containers.some((container) => container.id === containerId)) {
      throw new Error(`Контейнер ${containerId} отсутствует`)
    }
    this.sourceFilter = { containerId, type: 'container' }
    this.selectedContainerId = null
    this.selectedProductId = null
    this.selectedSourceLineId = null
  }

  setProductFilter(productId: string): void {
    if (!this.data.products.some((product) => product.id === productId)) {
      throw new Error(`Товар ${productId} отсутствует`)
    }
    this.sourceFilter = { productId, type: 'product' }
    this.selectedContainerId = null
    this.selectedProductId = null
    this.selectedSourceLineId = null
  }

  clearSourceFilter(): void {
    this.sourceFilter = null
    this.selectedContainerId = null
    this.selectedProductId = null
    this.selectedSourceLineId = null
  }

  selectSourceLine(sourceLineId: string): void {
    if (!this.filteredRemainingLines.some((line) => line.id === sourceLineId)) {
      throw new Error(`Строка источника ${sourceLineId} недоступна в текущем фильтре`)
    }
    this.selectedContainerId = null
    this.selectedProductId = null
    this.selectedSourceLineId = sourceLineId
  }

  setDestinationDisplayMode(mode: DestinationDisplayMode): void {
    if (mode === 'transport-place-products' && !this.activeTransportPlaceId) {
      throw new Error('Для просмотра товаров выберите транспортное место')
    }
    if (this.destinationDisplayMode === mode) return

    this.destinationDisplayMode = mode
    this.selectedTransportPlaceProductId = null
  }

  selectTransportPlaceProduct(productId: string): void {
    const transportPlaceId = this.activeTransportPlaceId
    if (!transportPlaceId) {
      throw new Error('Активное транспортное место не выбрано')
    }
    if (
      !this.data.allocationLines.some((allocation) => {
        if (allocation.transportPlaceId !== transportPlaceId || allocation.quantity <= 0)
          return false
        return (
          this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)?.productId ===
          productId
        )
      })
    ) {
      throw new Error(`В транспортном месте нет товара ${productId}`)
    }

    this.selectedTransportPlaceProductId = productId
  }

  private ensureActiveTransportPlace(): string {
    const transportPlaceId = this.activeTransportPlaceId
    if (!transportPlaceId) return this.createTransportPlace().id

    if (!this.data.transportPlaces.some((place) => place.id === transportPlaceId)) {
      throw new Error(`Транспортное место ${transportPlaceId} отсутствует`)
    }

    return transportPlaceId
  }

  distributeSelectedContainer(): void {
    const containerId = this.selectedContainerId

    if (!containerId) {
      throw new Error('Контейнер для распределения не выбран')
    }
    if (!this.data.containers.some((container) => container.id === containerId)) {
      throw new Error(`Контейнер ${containerId} отсутствует`)
    }

    const linesToDistribute = this.remainingLines.filter(
      (line) => line.containerId === containerId && line.remainingQuantity > 0,
    )
    if (linesToDistribute.length === 0) {
      throw new Error(`В контейнере ${containerId} нет остатка к распределению`)
    }

    this.allocateRemainingLines(linesToDistribute)
    this.selectedContainerId = null
  }

  get canDistributeSelectedContainer(): boolean {
    if (this.sourceDisplayMode !== 'containers') return false
    if (!this.selectedContainerId) return false
    if (!this.data.containers.some((container) => container.id === this.selectedContainerId)) {
      return false
    }

    return this.remainingLines.some(
      (line) => line.containerId === this.selectedContainerId && line.remainingQuantity > 0,
    )
  }

  distributeSelectedProduct(): void {
    const productId = this.selectedProductId
    if (!productId) {
      throw new Error('Товар для распределения не выбран')
    }
    if (!this.data.products.some((product) => product.id === productId)) {
      throw new Error(`Товар ${productId} отсутствует`)
    }

    const linesToDistribute = this.remainingLines.filter(
      (line) => line.productId === productId && line.remainingQuantity > 0,
    )
    if (linesToDistribute.length === 0) {
      throw new Error(`У товара ${productId} нет остатка к распределению`)
    }

    this.allocateRemainingLines(linesToDistribute)
    this.selectedProductId = null
  }

  distributeSelectedSourceLine(): void {
    const sourceLineId = this.selectedSourceLineId
    const line = this.filteredRemainingLines.find((item) => item.id === sourceLineId)
    if (!line) throw new Error('Строка источника для распределения не выбрана')

    this.allocateRemainingLines([line])
    this.selectedSourceLineId = null
  }

  get canDistributeSelectedSourceLine(): boolean {
    return Boolean(
      this.sourceFilter &&
      this.selectedSourceLineId &&
      this.filteredRemainingLines.some((line) => line.id === this.selectedSourceLineId),
    )
  }

  get bulkSourceLines(): RemainingLine[] {
    return this.filteredRemainingLines
  }

  get canDistributeBulkSourceLines(): boolean {
    return Boolean(this.sourceFilter && this.bulkSourceLines.length > 0)
  }

  distributeBulkSourceLines(): void {
    const lines = this.bulkSourceLines
    if (!this.sourceFilter || lines.length === 0) {
      throw new Error('Нет отфильтрованных строк для массового переноса')
    }

    this.allocateRemainingLines(lines)
    this.clearSourceFilter()
  }

  get canDistributeSelectedProduct(): boolean {
    if (this.sourceDisplayMode !== 'products' || !this.selectedProductId) return false

    return this.remainingLines.some(
      (line) => line.productId === this.selectedProductId && line.remainingQuantity > 0,
    )
  }

  get partialDistributionContext(): null | PartialQuantityContext {
    if (this.sourceFilter) {
      const line = this.filteredRemainingLines.find((line) => line.id === this.selectedSourceLineId)
      const product = line
        ? this.data.products.find((product) => product.id === line.productId)
        : undefined
      return line && product && line.remainingQuantity > 0
        ? { maximum: line.remainingQuantity, product }
        : null
    }

    if (this.sourceDisplayMode !== 'products' || !this.selectedProductId) return null
    const product = this.data.products.find((product) => product.id === this.selectedProductId)
    const maximum = this.remainingLines
      .filter((line) => line.productId === this.selectedProductId)
      .reduce((total, line) => total + line.remainingQuantity, 0)
    return product && maximum > 0 ? { maximum, product } : null
  }

  distributeSelectedProductQuantity(quantity: number): void {
    const context = this.partialDistributionContext
    if (!context) throw new Error('Товарная строка для частичного переноса не выбрана')
    this.assertPartialQuantity(quantity, context.maximum)

    const lines = this.sourceFilter
      ? this.filteredRemainingLines.filter((line) => line.id === this.selectedSourceLineId)
      : this.remainingLines.filter(
          (line) => line.productId === context.product.id && line.remainingQuantity > 0,
        )
    this.allocateQuantityFromLines(lines, quantity)

    if (this.sourceFilter) this.selectedSourceLineId = null
    else this.selectedProductId = null
  }

  private allocateRemainingLines(linesToDistribute: RemainingLine[]): void {
    this.allocateQuantityFromLines(
      linesToDistribute,
      linesToDistribute.reduce((total, line) => total + line.remainingQuantity, 0),
    )
  }

  private allocateQuantityFromLines(lines: RemainingLine[], quantity: number): void {
    const transportPlaceId = this.ensureActiveTransportPlace()
    const occupiedIds = new Set(this.data.allocationLines.map((line) => line.id))
    const newAllocations: AllocationLine[] = []
    let remainingQuantity = quantity

    for (const sourceLine of lines) {
      if (remainingQuantity <= 0) break
      const quantityToAllocate = Math.min(sourceLine.remainingQuantity, remainingQuantity)
      if (quantityToAllocate <= 0) continue
      const existingAllocation = this.data.allocationLines.find(
        (line) => line.sourceLineId === sourceLine.id && line.transportPlaceId === transportPlaceId,
      )
      if (existingAllocation) {
        existingAllocation.quantity += quantityToAllocate
        remainingQuantity -= quantityToAllocate
        continue
      }

      const idBase = `${transportPlaceId}-${sourceLine.id}-allocation`
      let id = idBase
      let suffix = 2
      while (occupiedIds.has(id)) {
        id = `${idBase}-${suffix}`
        suffix += 1
      }
      occupiedIds.add(id)
      newAllocations.push({
        id,
        quantity: quantityToAllocate,
        sourceLineId: sourceLine.id,
        transportPlaceId,
      })
      remainingQuantity -= quantityToAllocate
    }

    if (remainingQuantity > 0) throw new Error('Недостаточное количество товара для переноса')
    this.data.allocationLines.push(...newAllocations)
  }

  returnActiveTransportPlaceContents(): void {
    const transportPlaceId = this.activeTransportPlaceId

    if (!transportPlaceId) {
      throw new Error('Активное транспортное место не выбрано')
    }
    if (!this.data.transportPlaces.some((place) => place.id === transportPlaceId)) {
      throw new Error(`Транспортное место ${transportPlaceId} отсутствует`)
    }
    if (
      !this.data.allocationLines.some(
        (line) => line.transportPlaceId === transportPlaceId && line.quantity > 0,
      )
    ) {
      throw new Error(`Транспортное место ${transportPlaceId} пусто`)
    }

    this.data.allocationLines = this.data.allocationLines.filter(
      (line) => line.transportPlaceId !== transportPlaceId,
    )
    this.selectedContainerId = null
    this.selectedTransportPlaceProductId = null
  }

  get canReturnActiveTransportPlaceContents(): boolean {
    if (this.destinationDisplayMode !== 'transport-places') return false
    if (!this.activeTransportPlaceId) return false
    if (!this.data.transportPlaces.some((place) => place.id === this.activeTransportPlaceId)) {
      return false
    }

    return this.data.allocationLines.some(
      (line) => line.transportPlaceId === this.activeTransportPlaceId && line.quantity > 0,
    )
  }

  returnSelectedTransportPlaceProduct(): void {
    const transportPlaceId = this.activeTransportPlaceId
    const productId = this.selectedTransportPlaceProductId
    if (!transportPlaceId) throw new Error('Активное транспортное место не выбрано')
    if (!productId) throw new Error('Товар транспортного места не выбран')

    const hasProduct = this.data.allocationLines.some((allocation) => {
      if (allocation.transportPlaceId !== transportPlaceId || allocation.quantity <= 0) return false
      return (
        this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)?.productId ===
        productId
      )
    })
    if (!hasProduct) throw new Error(`В транспортном месте нет товара ${productId}`)

    this.data.allocationLines = this.data.allocationLines.filter((allocation) => {
      if (allocation.transportPlaceId !== transportPlaceId) return true
      return (
        this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)?.productId !==
        productId
      )
    })
    this.selectedTransportPlaceProductId = null
  }

  get canReturnSelectedTransportPlaceProduct(): boolean {
    if (
      this.destinationDisplayMode !== 'transport-place-products' ||
      !this.activeTransportPlaceId ||
      !this.selectedTransportPlaceProductId
    ) {
      return false
    }

    return this.data.allocationLines.some((allocation) => {
      if (allocation.transportPlaceId !== this.activeTransportPlaceId || allocation.quantity <= 0) {
        return false
      }
      return (
        this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)?.productId ===
        this.selectedTransportPlaceProductId
      )
    })
  }

  get bulkDestinationAllocationLines(): AllocationLine[] {
    if (this.destinationDisplayMode !== 'transport-place-products' || !this.activeTransportPlaceId) {
      return []
    }
    return this.data.allocationLines.filter(
      (allocation) =>
        allocation.transportPlaceId === this.activeTransportPlaceId && allocation.quantity > 0,
    )
  }

  get canReturnBulkDestinationLines(): boolean {
    return this.bulkDestinationAllocationLines.length > 0
  }

  returnBulkDestinationLines(): void {
    const allocations = this.bulkDestinationAllocationLines
    if (allocations.length === 0) {
      throw new Error('Нет отфильтрованных строк для массового возврата')
    }

    const allocationIds = new Set(allocations.map((allocation) => allocation.id))
    this.data.allocationLines = this.data.allocationLines.filter(
      (allocation) => !allocationIds.has(allocation.id),
    )
    this.selectedTransportPlaceProductId = null
  }

  get partialReturnContext(): null | PartialQuantityContext {
    if (
      this.destinationDisplayMode !== 'transport-place-products' ||
      !this.activeTransportPlaceId ||
      !this.selectedTransportPlaceProductId
    ) {
      return null
    }

    const product = this.data.products.find(
      (product) => product.id === this.selectedTransportPlaceProductId,
    )
    const maximum = this.data.allocationLines.reduce((total, allocation) => {
      if (allocation.transportPlaceId !== this.activeTransportPlaceId) return total
      const sourceLine = this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)
      return sourceLine?.productId === this.selectedTransportPlaceProductId
        ? total + allocation.quantity
        : total
    }, 0)
    return product && maximum > 0 ? { maximum, product } : null
  }

  returnSelectedTransportPlaceProductQuantity(quantity: number): void {
    const context = this.partialReturnContext
    const transportPlaceId = this.activeTransportPlaceId
    if (!context || !transportPlaceId) {
      throw new Error('Товар транспортного места для частичного возврата не выбран')
    }
    this.assertPartialQuantity(quantity, context.maximum)

    let remainingQuantity = quantity
    for (const allocation of this.data.allocationLines) {
      if (remainingQuantity <= 0 || allocation.transportPlaceId !== transportPlaceId) continue
      const sourceLine = this.data.sourceLines.find((line) => line.id === allocation.sourceLineId)
      if (sourceLine?.productId !== context.product.id) continue

      const quantityToReturn = Math.min(allocation.quantity, remainingQuantity)
      allocation.quantity -= quantityToReturn
      remainingQuantity -= quantityToReturn
    }
    if (remainingQuantity > 0) throw new Error('Недостаточное количество товара для возврата')

    this.data.allocationLines = this.data.allocationLines.filter((allocation) => allocation.quantity > 0)
    this.selectedTransportPlaceProductId = null
  }

  private assertPartialQuantity(quantity: number, maximum: number): void {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maximum) {
      throw new Error(`Количество должно быть целым числом от 1 до ${maximum}`)
    }
  }

  get orderTotals(): ShipmentTotals {
    return {
      ...calculateTotals(this.data.sourceLines, this.data.products),
      containers: this.data.containers.length,
    }
  }

  get remainingLines(): RemainingLine[] {
    const allocatedBySource = new Map<string, number>()
    for (const line of this.data.allocationLines) {
      allocatedBySource.set(
        line.sourceLineId,
        (allocatedBySource.get(line.sourceLineId) ?? 0) + line.quantity,
      )
    }

    return this.data.sourceLines.map((line) => ({
      ...line,
      remainingQuantity: line.quantity - (allocatedBySource.get(line.id) ?? 0),
    }))
  }

  get filteredRemainingLines(): RemainingLine[] {
    const filter = this.sourceFilter
    if (!filter) return []
    return this.remainingLines.filter((line) => {
      if (filter.type === 'container') {
        return line.containerId === filter.containerId && line.remainingQuantity > 0
      }
      return line.productId === filter.productId && line.remainingQuantity > 0
    })
  }

  get remainingTotals(): ShipmentTotals {
    return calculateTotals(
      this.remainingLines.map((line) => ({
        ...line,
        quantity: line.remainingQuantity,
      })),
      this.data.products,
    )
  }

  get distributedUnits(): number {
    return this.data.allocationLines.reduce((sum, line) => sum + line.quantity, 0)
  }

  get distributionProgress(): number {
    const total = this.orderTotals.units
    return total === 0 ? 0 : (this.distributedUnits / total) * 100
  }
}
