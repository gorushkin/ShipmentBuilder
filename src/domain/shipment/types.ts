export interface Product {
  barcode: string
  code: string
  id: string
  isMarked: boolean
  name: string
  unitsPerBox: number
  unitVolumeM3: number
  unitWeightKg: number
}

export interface Order {
  clientName: string
  controlStatus: 'checked'
  id: string
  number: string
}

export interface PickingContainer {
  barcode: string
  id: string
  orderId: string
}

export interface SourceLine {
  containerId: string
  id: string
  productId: string
  /** Исходное количество в штуках, до распределения. */
  quantity: number
}

export interface TransportPlace {
  id: string
  number: string
  orderId: string
  sequence: number
}

export interface AllocationLine {
  id: string
  quantity: number
  sourceLineId: string
  transportPlaceId: string
}

export interface MarkingCode {
  id: string
  /** Происхождение единицы товара, не её текущее расположение. */
  sourceLineId: string
  value: string
}

export interface AggregationCode {
  id: string
  markingCodeIds: string[]
  value: string
}

export interface ShipmentData {
  aggregationCodes: AggregationCode[]
  allocationLines: AllocationLine[]
  containers: PickingContainer[]
  markingCodes: MarkingCode[]
  order: Order
  products: Product[]
  sourceLines: SourceLine[]
  transportPlaces: TransportPlace[]
}

export interface ShipmentTotals {
  boxes: number
  containers: number
  sku: number
  units: number
  volumeM3: number
  weightKg: number
}

export interface RemainingLine extends SourceLine {
  remainingQuantity: number
}
