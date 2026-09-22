import type { ShipmentData } from '@/domain/shipment/types'

import type { ResolvedScanEvent } from './scan-machine'

export type BarcodeResolution = { event: ResolvedScanEvent; kind: 'resolved' } | { kind: 'unknown' }

export class BarcodeResolver {
  private readonly data: ShipmentData

  constructor(data: ShipmentData) {
    this.data = data
  }

  resolve(rawValue: string): BarcodeResolution {
    const barcode = rawValue.trim().toUpperCase()
    if (barcode === 'CMD:QTY') {
      return { event: { command: 'transfer-quantity', type: 'command-scanned' }, kind: 'resolved' }
    }

    const container = this.data.containers.find(
      (item) => item.scanBarcode.toUpperCase() === barcode,
    )
    if (container) {
      return { event: { containerId: container.id, type: 'container-scanned' }, kind: 'resolved' }
    }

    const product = this.data.products.find((item) => item.scanBarcode.toUpperCase() === barcode)
    if (product) {
      return { event: { productId: product.id, type: 'product-scanned' }, kind: 'resolved' }
    }

    const transportPlace = this.data.transportPlaces.find(
      (item) => item.scanBarcode.toUpperCase() === barcode,
    )
    if (transportPlace) {
      return {
        event: { transportPlaceId: transportPlace.id, type: 'transport-place-scanned' },
        kind: 'resolved',
      }
    }

    return { kind: 'unknown' }
  }
}
