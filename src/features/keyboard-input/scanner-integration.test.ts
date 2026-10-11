import { describe, expect, it, vi } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'
import { BarcodeInputAdapter, BarcodeResolver, ScanMachine } from '@/features/scan-machine'
import type { ResolvedScanEvent } from '@/features/scan-machine'

import { KeyboardManager } from './keyboard-manager'

it('доставляет штрихкод адаптеру во время перемещения, оставляя решение машине', () => {
  const machine = new ScanMachine()
  const receive = vi.fn((event: ResolvedScanEvent) => machine.send(event))
  const adapter = new BarcodeInputAdapter(new BarcodeResolver(createDemoData()), {
    barcodeUnknown: () => {
      machine.barcodeUnknown()
    },
    send: receive,
  })
  const keyboard = new KeyboardManager()
  keyboard.onSequence((value) => adapter.submit(value))
  const scan = (value: string) => {
    for (const key of [...value, 'Enter']) {
      const stroke = { code: key.length === 1 ? `Key${key}` : key, key }
      keyboard.keyDown(stroke, { editing: false })
      keyboard.keyUp(stroke, { editing: false })
    }
  }
  scan('C1')
  scan('C1')
  expect(machine.isTransferring).toBe(true)
  const pending = machine.pendingEffect
  if (!pending) throw new Error('Ожидалось перемещение')
  scan('C2')
  expect(receive).toHaveBeenLastCalledWith({ containerId: 'C2', type: 'container-scanned' })
  expect(machine.pendingEffect?.id).toBe(pending.id)
  machine.send({ id: pending.id, transportPlaceId: 'TM1', type: 'operation-succeeded' })
  scan('C2')
  expect(machine.source).toEqual({ containerId: 'C2', kind: 'container' })
  keyboard.reset()
})

describe('Клавиатура и внешний контроллер ручного ввода', () => {
  it('обработчик вызывает внешний метод только после отпускания', () => {
    const keyboard = new KeyboardManager()
    const toggle = vi.fn()
    keyboard.register({ handler: toggle, shortcut: 'F2' })
    keyboard.keyDown({ code: 'F2', key: 'F2' }, { editing: false })
    expect(toggle).not.toHaveBeenCalled()
    keyboard.keyUp({ code: 'F2', key: 'F2' }, { editing: false })
    expect(toggle).toHaveBeenCalledTimes(1)
  })
})
