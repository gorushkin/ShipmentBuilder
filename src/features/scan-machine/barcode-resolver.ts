import type { ShipmentData } from '@/domain/shipment/types'

import { barcodeCommands } from './commands'
import type { ResolvedScanEvent } from './scan-machine'

export type BarcodeResolution = { event: ResolvedScanEvent; kind: 'resolved' } | { kind: 'unknown' }

export class BarcodeResolver {
  private readonly getData: () => null | ShipmentData

  constructor(data: ShipmentData | (() => null | ShipmentData)) {
    this.getData = typeof data === 'function' ? data : () => data
  }

  resolve(rawValue: string): BarcodeResolution {
    const barcode = rawValue.trim().toUpperCase()
    const command = Object.entries(barcodeCommands).find(([code]) => code === barcode)?.[1]
    if (command) return { event: { command, type: 'command-scanned' }, kind: 'resolved' }

    const data = this.getData()
    if (!data) return { kind: 'unknown' }

    const container = data.containers.find((item) => item.scanBarcode.toUpperCase() === barcode)
    if (container) {
      return { event: { containerId: container.id, type: 'container-scanned' }, kind: 'resolved' }
    }

    const product = data.products.find((item) => item.scanBarcode.toUpperCase() === barcode)
    if (product) {
      return { event: { productId: product.id, type: 'product-scanned' }, kind: 'resolved' }
    }

    const transportPlace = data.transportPlaces.find(
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
