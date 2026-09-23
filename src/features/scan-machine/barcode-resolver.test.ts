import { describe, expect, it } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'

import { BarcodeResolver } from './barcode-resolver'
import { barcodeCommands } from './commands'

describe('BarcodeResolver', () => {
  it('resolves every command from the shared catalog', () => {
    const resolver = new BarcodeResolver(createDemoData())
    for (const [barcode, command] of Object.entries(barcodeCommands)) {
      expect(resolver.resolve(' ' + barcode.toLowerCase() + ' ')).toEqual({
        event: { command, type: 'command-scanned' },
        kind: 'resolved',
      })
    }
  })
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
      event: { command: 'request-transfer-quantity', type: 'command-scanned' },
      kind: 'resolved',
    })
  })

  it('returns a typed unknown result for an unrecognized barcode', () => {
    const resolver = new BarcodeResolver(createDemoData())

    expect(resolver.resolve('unknown')).toEqual({ kind: 'unknown' })
  })
})
