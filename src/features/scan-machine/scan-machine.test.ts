import { describe, expect, it } from 'vitest'

import { ScanMachine } from './scan-machine'

describe('ScanMachine', () => {
  it('selects a container then starts one pending container transfer on the repeated scan', () => {
    const machine = new ScanMachine()

    machine.send({ containerId: 'C1', type: 'container-scanned' })
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })

    machine.send({ containerId: 'C1', type: 'container-scanned' })
    expect(machine.step).toEqual({
      containerId: 'C1',
      effectId: 'scan-effect-1',
      kind: 'transferring-container',
    })
    expect(machine.pendingEffect).toEqual({
      containerId: 'C1',
      id: 'scan-effect-1',
      kind: 'transfer-container',
    })
    expect(machine.feedback.message).toBe('Обработка…')

    machine.send({ productId: 'P1', type: 'product-scanned' })
    expect(machine.pendingEffect?.id).toBe('scan-effect-1')
  })

  it('creates a product-from-container effect and restores its context after an error', () => {
    const machine = new ScanMachine()
    machine.mouseContainerSelected('C1')

    machine.send({ productId: 'P1', type: 'product-scanned' })
    expect(machine.pendingEffect).toMatchObject({
      containerId: 'C1',
      kind: 'transfer-product-from-container',
      productId: 'P1',
    })

    machine.send({
      code: 'product-not-in-container',
      effectId: 'scan-effect-1',
      type: 'operation-failed',
    })
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(machine.feedback.message).toBe('Товар отсутствует в выбранном контейнере')
  })

  it('selects a product, preserves it while selecting a transport place, and transfers its next line', () => {
    const machine = new ScanMachine()
    machine.send({ productId: 'P1', type: 'product-scanned' })
    machine.send({ transportPlaceId: 'TM1', type: 'transport-place-scanned' })

    expect(machine.activeTransportPlaceId).toBe('TM1')
    expect(machine.step).toEqual({ kind: 'product-selected', productId: 'P1' })

    machine.send({ productId: 'P1', type: 'product-scanned' })
    expect(machine.pendingEffect).toMatchObject({
      kind: 'transfer-next-product-line',
      productId: 'P1',
    })

    machine.send({
      effectId: 'scan-effect-1',
      result: 'product-exhausted',
      type: 'operation-succeeded',
    })
    expect(machine.step).toEqual({ kind: 'ready' })
  })

  it('opens quantity entry only for a selected product and validates its quantity', () => {
    const machine = new ScanMachine()
    machine.mouseContainerSelected('C1')
    machine.send({ command: 'transfer-quantity', type: 'command-scanned' })
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(machine.feedback.message).toBe('Товар для перемещения количества не выбран')

    machine.mouseProductSelected('P1')
    machine.send({ command: 'transfer-quantity', type: 'command-scanned' })
    expect(machine.step).toEqual({ kind: 'awaiting-quantity', productId: 'P1' })

    machine.send({ quantity: 0, type: 'quantity-confirmed' })
    expect(machine.feedback.message).toBe('Укажите допустимое количество')

    machine.send({ quantity: 3, type: 'quantity-confirmed' })
    expect(machine.pendingEffect).toMatchObject({
      kind: 'transfer-quantity',
      productId: 'P1',
      quantity: 3,
    })
  })
})
