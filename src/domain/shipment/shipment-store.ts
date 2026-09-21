import { makeAutoObservable } from 'mobx'

import { createDemoData } from './demo-data'
import type {
  Product,
  RemainingLine,
  ShipmentData,
  ShipmentTotals,
  SourceLine,
  TransportPlace,
} from './types'

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
