export type SourceTableMode = 'containers' | 'products'
export type DestinationTableMode = 'transport-places' | 'transport-place-products'

export interface SourceContainerTableRow {
  boxes: number
  id: string
  name: string
  sku: number
  units: number
  volume: number
}

export interface SourceProductTableRow {
  boxes: number
  code: string
  containerName?: string
  containers: number
  id: string
  name: string
  productId?: string
  sourceLineId?: string
  units: number
}

export interface DestinationTransportPlaceTableRow {
  boxes: number
  id: string
  isActive: boolean
  name: string
  sku: number
  units: number
  volume: number
}

export interface DestinationProductTableRow {
  boxes: number
  code: string
  id: string
  name: string
  units: number
}
