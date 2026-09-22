import { describe, expect, it } from 'vitest'

import { ScanMachine } from './scan-machine'

describe('ScanMachine', () => {
  it('keeps a container selected and emits a new intent for each repeated scan', () => {
    const machine = new ScanMachine()
    machine.send({ containerId: 'C1', type: 'container-scanned' })
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(machine.source).toEqual({ containerId: 'C1', kind: 'container' })
    expect(machine.lastIntent).toBeNull()

    machine.send({ containerId: 'C1', type: 'container-scanned' })
    expect(machine.lastIntent).toEqual({
      containerId: 'C1',
      id: 'scan-intent-1',
      kind: 'transfer-container',
    })
    machine.send({ containerId: 'C1', type: 'container-scanned' })
    expect(machine.lastIntent?.id).toBe('scan-intent-2')
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(machine.pendingEffect).toBeNull()
    expect(machine.isTransferring).toBe(false)
  })

  it('preserves container context when selecting its product by scanner or mouse', () => {
    const machine = new ScanMachine()
    machine.mouseContainerSelected('C1')
    machine.send({ productId: 'P1', type: 'product-scanned' })

    expect(machine.step).toEqual({ containerId: 'C1', kind: 'product-selected', productId: 'P1' })
    expect(machine.selectedSource).toEqual({ containerId: 'C1', kind: 'product', productId: 'P1' })
    expect(machine.source).toEqual({ containerId: 'C1', kind: 'container' })
    expect(machine.lastIntent).toMatchObject({
      containerId: 'C1',
      kind: 'transfer-product-from-container',
      productId: 'P1',
    })

    const mouse = new ScanMachine()
    mouse.mouseContainerSelected('C1')
    mouse.mouseProductSelected('P1')
    expect(mouse.selectedSource).toEqual(machine.selectedSource)
    expect(mouse.source).toEqual(machine.source)
    expect(mouse.lastIntent).toBeNull()
  })

  it('selects a product across containers, preserves it after transport-place selection, and logs repeats', () => {
    const machine = new ScanMachine()
    machine.send({ productId: 'P1', type: 'product-scanned' })
    machine.send({ transportPlaceId: 'TM1', type: 'transport-place-scanned' })
    expect(machine.activeTransportPlaceId).toBe('TM1')
    expect(machine.source).toEqual({ kind: 'product', productId: 'P1' })

    machine.send({ productId: 'P1', type: 'product-scanned' })
    expect(machine.lastIntent).toEqual({
      id: 'scan-intent-1',
      kind: 'transfer-next-product-line',
      productId: 'P1',
    })
    machine.mouseProductSelected('P1')
    expect(machine.lastIntent?.id).toBe('scan-intent-1')
    expect(machine.pendingEffect).toBeNull()
  })

  it('records quantity command only when a product is selected, without entering quantity workflow', () => {
    const machine = new ScanMachine()
    machine.send({ command: 'transfer-quantity', type: 'command-scanned' })
    expect(machine.feedback.message).toBe('Товар для перемещения количества не выбран')
    machine.mouseProductSelected('P1')
    machine.send({ command: 'transfer-quantity', type: 'command-scanned' })
    expect(machine.step).toEqual({ kind: 'product-selected', productId: 'P1' })
    expect(machine.lastIntent).toEqual({
      containerId: undefined,
      id: 'scan-intent-1',
      kind: 'transfer-quantity',
      productId: 'P1',
    })
    expect(machine.pendingEffect).toBeNull()
  })

  it('keeps valid context after a selection rejection and clears source only on explicit action', () => {
    const machine = new ScanMachine()
    machine.mouseContainerSelected('C1')
    machine.send({ code: 'product-not-in-container', type: 'selection-rejected' })
    expect(machine.source).toEqual({ containerId: 'C1', kind: 'container' })
    expect(machine.step).toEqual({ containerId: 'C1', kind: 'container-selected' })
    expect(machine.feedback.message).toBe('Товар отсутствует в выбранном контейнере')
    machine.mouseFilterCleared()
    expect(machine.source).toEqual({ kind: 'none' })
    expect(machine.activeTransportPlaceId).toBeNull()
  })
})
