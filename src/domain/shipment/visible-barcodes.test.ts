import { describe, expect, it } from 'vitest'

import { BarcodeResolver } from '@/features/scan-machine'
import { barcodeCommands } from '@/features/scan-machine/commands'

import { createDemoData, createLargeDemoData } from './demo-data'
import { ShipmentDataStore } from './shipment-data-store'

describe('Visible barcode contract', () => {
  it.each([createDemoData, createLargeDemoData])(
    'resolves every displayed code and new place',
    (create) => {
      const snapshot = create()
      const store = new ShipmentDataStore()
      store.setSnapshot(snapshot)
      const created = store.createTransportPlace()
      expect(created.ok).toBe(true)
      const resolver = new BarcodeResolver(() => store.data)
      const codes = []

      for (const container of snapshot.containers) {
        expect(container.scanBarcode).toBe(container.barcode)
        expect(resolver.resolve(container.barcode)).toMatchObject({
          event: { containerId: container.id, type: 'container-scanned' },
          kind: 'resolved',
        })
        codes.push(container.scanBarcode)
      }
      for (const product of snapshot.products) {
        expect(product.scanBarcode).toBe(product.code)
        expect(product.barcode).toBe(product.code)
        expect(resolver.resolve(product.code)).toMatchObject({
          event: { productId: product.id, type: 'product-scanned' },
          kind: 'resolved',
        })
        codes.push(product.scanBarcode)
      }
      for (const place of store.data!.transportPlaces) {
        expect(place.scanBarcode).toBe(place.number)
        expect(place.barcode).toBe(place.number)
        expect(resolver.resolve(place.number)).toMatchObject({
          event: { transportPlaceId: place.id, type: 'transport-place-scanned' },
          kind: 'resolved',
        })
        codes.push(place.scanBarcode)
      }
      const normalized = codes.map((code) => code.trim().toUpperCase())
      expect(new Set(normalized).size).toBe(normalized.length)
      expect(normalized.some((code) => code in barcodeCommands)).toBe(false)
      expect(snapshot.containers[0].id).toMatch(/^C/)
      expect(snapshot.products[0].id).toMatch(/^P/)
    },
  )
})
