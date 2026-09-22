import { describe, expect, it } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'

import { BarcodeResolver } from './barcode-resolver'

describe('BarcodeResolver', () => {
  it('resolves each short mock barcode case-insensitively', () => {
    const resolver = new BarcodeResolver(createDemoData())

    expect(resolver.resolve(' c1 ')).toEqual({
      event: { containerId: 'C1', type: 'container-scanned' },
      kind: 'resolved',
    })
    expect(resolver.resolve('p1')).toEqual({
      event: { productId: 'P1', type: 'product-scanned' },
      kind: 'resolved',
    })
    expect(resolver.resolve('Tm1')).toEqual({
      event: { transportPlaceId: 'ORD-001-TP-001', type: 'transport-place-scanned' },
      kind: 'resolved',
    })
    expect(resolver.resolve('cmd:qty')).toEqual({
      event: { command: 'transfer-quantity', type: 'command-scanned' },
      kind: 'resolved',
    })
  })

  it('returns a typed unknown result for an unrecognized barcode', () => {
    const resolver = new BarcodeResolver(createDemoData())

    expect(resolver.resolve('unknown')).toEqual({ kind: 'unknown' })
  })
})
