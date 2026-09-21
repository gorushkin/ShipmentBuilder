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
  selectedContainerId: null | string = null
  selectedProductId: null | string = null
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
    return transportPlace
  }

  selectTransportPlace(transportPlaceId: string): void {
    if (!this.data.transportPlaces.some((place) => place.id === transportPlaceId)) {
      throw new Error(`Транспортное место ${transportPlaceId} отсутствует`)
    }

    this.activeTransportPlaceId = transportPlaceId
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
  }

  selectProduct(productId: string): void {
    if (!this.data.products.some((product) => product.id === productId)) {
      throw new Error(`Товар ${productId} отсутствует`)
    }
    if (!this.remainingLines.some((line) => line.productId === productId && line.remainingQuantity > 0)) {
      throw new Error(`У товара ${productId} нет остатка к распределению`)
    }

    this.selectedContainerId = null
    this.selectedProductId = productId
  }

  setSourceDisplayMode(mode: SourceDisplayMode): void {
    if (this.sourceDisplayMode === mode) return

    this.sourceDisplayMode = mode
    this.selectedContainerId = null
    this.selectedProductId = null
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

    const transportPlaceId = this.ensureActiveTransportPlace()

    const occupiedIds = new Set(this.data.allocationLines.map((line) => line.id))
    const newAllocations: AllocationLine[] = []

    for (const sourceLine of linesToDistribute) {
      const existingAllocation = this.data.allocationLines.find(
        (line) => line.sourceLineId === sourceLine.id && line.transportPlaceId === transportPlaceId,
      )
      if (existingAllocation) {
        existingAllocation.quantity += sourceLine.remainingQuantity
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
        quantity: sourceLine.remainingQuantity,
        sourceLineId: sourceLine.id,
        transportPlaceId,
      })
    }

    this.data.allocationLines.push(...newAllocations)
    this.selectedContainerId = null
  }

  get canDistributeSelectedContainer(): boolean {
    if (!this.selectedContainerId) return false
    if (!this.data.containers.some((container) => container.id === this.selectedContainerId)) {
      return false
    }

    return this.remainingLines.some(
      (line) => line.containerId === this.selectedContainerId && line.remainingQuantity > 0,
    )
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
  }

  get canReturnActiveTransportPlaceContents(): boolean {
    if (!this.activeTransportPlaceId) return false
    if (!this.data.transportPlaces.some((place) => place.id === this.activeTransportPlaceId)) {
      return false
    }

    return this.data.allocationLines.some(
      (line) => line.transportPlaceId === this.activeTransportPlaceId && line.quantity > 0,
    )
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
