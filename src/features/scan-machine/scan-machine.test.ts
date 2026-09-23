import { describe, expect, it } from 'vitest'

import { ScanMachine } from './scan-machine'

describe('ScanMachine operation lifecycle', () => {
  it('blocks concurrent input and accepts only the matching completion', () => {
    const m = new ScanMachine()
    m.mouseContainerSelected('C1')
    m.send({ containerId: 'C1', type: 'container-scanned' })
    const id = m.pendingEffect!.id
    expect(m.isTransferring).toBe(true)
    m.mouseContainerSelected('C2')
    m.send({ command: 'cancel', type: 'command-scanned' })
    m.send({ id: 'stale', transportPlaceId: 'TM2', type: 'operation-succeeded' })
    expect(m.pendingEffect?.id).toBe(id)
    expect(m.source).toEqual({ containerId: 'C1', kind: 'container' })
    m.send({ id, transportPlaceId: 'TM1', type: 'operation-succeeded' })
    expect(m.isTransferring).toBe(false)
    expect(m.pendingEffect).toBeNull()
    expect(m.activeTransportPlaceId).toBe('TM1')
    m.send({ containerId: 'C1', type: 'container-scanned' })
    expect(m.pendingEffect?.id).not.toBe(id)
  })

  it('preserves the pre-operation selection on failure', () => {
    const m = new ScanMachine()
    m.mouseContainerSelected('C1')
    m.send({ productId: 'P1', type: 'product-scanned' })
    expect(m.pendingEffect).toMatchObject({
      kind: 'transfer',
      scope: { containerId: 'C1', productId: 'P1' },
    })
    m.send({ id: m.pendingEffect!.id, message: 'Нет остатка', type: 'operation-failed' })
    expect(m.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(m.feedback.message).toBe('Нет остатка')
  })

  it('prioritizes a pinned line then resumes sequential product scanning', () => {
    const m = new ScanMachine()
    m.mouseProductSelected('P1')
    m.send({ productId: 'P1', sourceLineId: 'L3', type: 'mouse-source-line-selected' })
    m.send({ productId: 'P1', type: 'product-scanned' })
    expect(m.pendingEffect).toMatchObject({ scope: { kind: 'line', sourceLineId: 'L3' } })
    m.send({ id: m.pendingEffect!.id, transportPlaceId: 'TM1', type: 'operation-succeeded' })
    expect(m.selectedSourceLineId).toBeNull()
    m.send({ productId: 'P1', type: 'product-scanned' })
    expect(m.pendingEffect).toMatchObject({
      scope: { kind: 'product', next: true, productId: 'P1' },
    })
  })

  it('does not transfer on repeated mouse clicks and cancels quantity', () => {
    const m = new ScanMachine()
    m.mouseProductSelected('P1')
    m.mouseProductSelected('P1')
    expect(m.pendingEffect).toBeNull()
    m.send({ command: 'request-transfer-quantity', type: 'command-scanned' })
    expect(m.step.kind).toBe('awaiting-quantity')
    m.send({ quantity: 0, type: 'quantity-submitted' })
    expect(m.step.kind).toBe('awaiting-quantity')
    m.send({ command: 'cancel', type: 'command-scanned' })
    expect(m.step).toMatchObject({ kind: 'product-selected', productId: 'P1' })
  })

  it('returns an issue for an unknown barcode unless a transfer is in progress', () => {
    const m = new ScanMachine()

    expect(m.barcodeUnknown()).toEqual({
      code: 'barcode-unrecognized',
      message: 'ШК не распознан',
      type: 'error',
    })
    expect(m.feedback).toEqual({ kind: 'error', message: 'ШК не распознан' })

    m.mouseContainerSelected('C1')
    m.send({ containerId: 'C1', type: 'container-scanned' })
    expect(m.isTransferring).toBe(true)
    expect(m.barcodeUnknown()).toBeNull()
    expect(m.feedback).toEqual({ kind: 'processing', message: 'Обработка…' })
  })

  it('preserves source context while acquiring a return product', () => {
    const m = new ScanMachine()
    m.mouseContainerSelected('C1')
    m.mouseTransportPlaceSelected('TM1')
    m.send({ command: 'request-return-quantity', type: 'command-scanned' })
    expect(m.step.kind).toBe('awaiting-return-product')
    m.send({ productId: 'P2', type: 'product-scanned' })
    expect(m.step).toMatchObject({
      kind: 'awaiting-quantity',
      operation: { kind: 'return', productId: 'P2' },
    })
    expect(m.source).toEqual({ containerId: 'C1', kind: 'container' })
    m.send({ command: 'cancel', type: 'command-scanned' })
    expect(m.step).toMatchObject({ containerId: 'C1', kind: 'container-selected' })
  })
})
