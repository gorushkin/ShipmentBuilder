export interface Product {
  id: string
  code: string
  name: string
  barcode: string
  unitsPerBox: number
  unitWeightKg: number
  unitVolumeM3: number
  isMarked: boolean
}

export interface Order {
  id: string
  number: string
  clientName: string
  controlStatus: 'checked'
}

export interface PickingContainer {
  id: string
  orderId: string
  barcode: string
}

export interface SourceLine {
  id: string
  containerId: string
  productId: string
  /** Исходное количество в штуках, до распределения. */
  quantity: number
}

export interface TransportPlace {
  id: string
  orderId: string
  number: string
  sequence: number
}

export interface AllocationLine {
  id: string
  transportPlaceId: string
  sourceLineId: string
  quantity: number
}

export interface MarkingCode {
  id: string
  value: string
  /** Происхождение единицы товара, не её текущее расположение. */
  sourceLineId: string
}

export interface AggregationCode {
  id: string
  value: string
  markingCodeIds: string[]
}

export interface ShipmentData {
  order: Order
  products: Product[]
  containers: PickingContainer[]
  sourceLines: SourceLine[]
  transportPlaces: TransportPlace[]
  allocationLines: AllocationLine[]
  markingCodes: MarkingCode[]
  aggregationCodes: AggregationCode[]
}

export interface ShipmentTotals {
  containers: number
  sku: number
  units: number
  boxes: number
  weightKg: number
  volumeM3: number
}

export interface RemainingLine extends SourceLine {
  remainingQuantity: number
}
