import type { ShipmentData } from '@/domain/shipment/types'

import { barcodeCommands } from './commands'
import type { ResolvedScanEvent } from './scan-machine'

export type BarcodeResolution =
  { event: ResolvedScanEvent; kind: 'resolved' } | { kind: 'ambiguous' | 'unknown' }

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

    const matches: ResolvedScanEvent[] = []
    for (const container of data.containers) {
      if (container.scanBarcode.trim().toUpperCase() === barcode)
        matches.push({ containerId: container.id, type: 'container-scanned' })
    }
    for (const product of data.products) {
      if (product.scanBarcode.trim().toUpperCase() === barcode)
        matches.push({ productId: product.id, type: 'product-scanned' })
    }
    for (const transportPlace of data.transportPlaces) {
      if (transportPlace.scanBarcode.trim().toUpperCase() === barcode)
        matches.push({ transportPlaceId: transportPlace.id, type: 'transport-place-scanned' })
    }

    if (matches.length > 1) return { kind: 'ambiguous' }
    if (matches.length === 1) return { event: matches[0], kind: 'resolved' }

    return { kind: 'unknown' }
  }
}
