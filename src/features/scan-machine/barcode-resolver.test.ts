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
  it('resolves each displayed mock barcode case-insensitively', () => {
    const resolver = new BarcodeResolver(createDemoData())

    expect(resolver.resolve(' n00001 ')).toEqual({
      event: { containerId: 'C1', type: 'container-scanned' },
      kind: 'resolved',
    })
    expect(resolver.resolve(' 10001 ')).toEqual({
      event: { productId: 'P1', type: 'product-scanned' },
      kind: 'resolved',
    })
    expect(resolver.resolve('ТМ-001')).toEqual({
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

describe('Visible mock codes', () => {
  it('rejects collisions across and within entity types', () => {
    const snapshot = createDemoData()
    snapshot.products[0].scanBarcode = ' n00001 '
    const resolver = new BarcodeResolver(snapshot)

    expect(resolver.resolve('N00001')).toEqual({ kind: 'ambiguous' })
    snapshot.products[0].scanBarcode = snapshot.products[1].scanBarcode
    expect(resolver.resolve('10002')).toEqual({ kind: 'ambiguous' })
  })

  it('keeps empty places and fully allocated products recognizable', () => {
    const snapshot = createDemoData()
    snapshot.allocationLines = snapshot.sourceLines.map((line) => ({
      id: `${line.id}-allocated`,
      quantity: line.quantity,
      sourceLineId: line.id,
      transportPlaceId: snapshot.transportPlaces[0].id,
    }))
    const resolver = new BarcodeResolver(snapshot)

    expect(resolver.resolve('10001')).toMatchObject({
      event: { productId: 'P1', type: 'product-scanned' },
      kind: 'resolved',
    })
    snapshot.allocationLines = []
    expect(resolver.resolve(' тм-001 ')).toMatchObject({
      event: { type: 'transport-place-scanned' },
      kind: 'resolved',
    })
    for (const internalCode of ['C1', 'P1', 'TM1']) {
      expect(resolver.resolve(internalCode)).toEqual({ kind: 'unknown' })
    }
  })
})
