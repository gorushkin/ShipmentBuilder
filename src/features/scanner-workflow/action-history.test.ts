import { describe, expect, it, vi } from 'vitest'

import { createDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { ActionHistoryStore } from '@/features/action-history'
import { ScanMachine } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

async function setup(emptyPlaces = false) {
  const snapshot = createDemoData()
  if (emptyPlaces) snapshot.transportPlaces = []
  const data = new ShipmentDataStore()
  const machine = new ScanMachine()
  const history = new ActionHistoryStore()
  const alerts = { publish: vi.fn() }
  const workflow = new ScannerWorkflowOrchestrator(
    machine,
    data,
    () => Promise.resolve(snapshot),
    alerts,
    history,
  )
  workflow.start()
  await Promise.resolve()
  return { alerts, data, history, machine, workflow }
}

describe('Workflow action history', () => {
  it('records initial load once and retains history across reconnects', async () => {
    const { history, workflow } = await setup()
    expect(history.latestEvent).toMatchObject({
      description: 'Товары ожидают распределения',
      title: 'Заказ проверен.',
    })
    workflow.dispose()
    workflow.start()
    expect(history.entries).toHaveLength(1)
    workflow.dispose()
  })

  it('records actual transfer and return quantities without logging selections or cancellation', async () => {
    const { history, workflow } = await setup()
    workflow.selectContainer('C1')
    workflow.selectProduct('P1')
    expect(history.entries).toHaveLength(1)
    workflow.command('request-transfer-quantity')
    workflow.command('cancel')
    expect(history.entries).toHaveLength(1)
    workflow.command('request-transfer-quantity')
    workflow.submitQuantity(3)
    expect(history.latestEvent?.title).toBe('Перемещено 3 шт. в ТМ-001')
    workflow.selectDestinationProduct('P1')
    workflow.command('request-return-quantity')
    workflow.submitQuantity(2)
    expect(history.latestEvent?.title).toBe('Возвращено 2 шт. из ТМ-001')
    workflow.command('return-transport-place')
    expect(history.latestEvent?.title).toBe('Возвращено 1 шт. из ТМ-001')
    expect(history.entries.map((entry) => entry.type)).toEqual([
      'order-loaded',
      'transfer',
      'return',
      'return',
    ])
    workflow.dispose()
  })

  it('captures deleted place details before mutation and ignores a repeated delete', async () => {
    const { data, history, workflow } = await setup()
    workflow.selectContainer('C1')
    workflow.command('transfer-container')
    const placeId = data.activeTransportPlaceId!
    expect(workflow.deleteTransportPlace(placeId)).toBe(true)
    expect(history.latestEvent).toMatchObject({
      description: 'Возвращено товаров: 15 шт.',
      title: 'Удалено ТМ-001',
    })
    expect(workflow.deleteTransportPlace(placeId)).toBe(false)
    expect(history.entries).toHaveLength(3)
    workflow.createTransportPlace()
    expect(history.latestEvent?.title).toBe('Создано ТМ-002')
    workflow.dispose()
  })

  it('logs automatic creation and executes scanner effects once', async () => {
    const { history, machine, workflow } = await setup(true)
    workflow.send({ containerId: 'C1', type: 'container-scanned' })
    workflow.send({ containerId: 'C1', type: 'container-scanned' })
    expect(history.entries.map((entry) => entry.type)).toEqual([
      'order-loaded',
      'transport-place-created',
      'transfer',
    ])
    expect(history.latestEvent?.title).toBe('Перемещено 15 шт. в ТМ-001')
    machine.send({ containerId: 'C1', type: 'mouse-container-selected' })
    expect(history.entries).toHaveLength(3)
    workflow.dispose()
  })

  it('resets history when another order snapshot replaces the current one', async () => {
    const { data, history, workflow } = await setup()
    workflow.createTransportPlace()
    history.expand()
    const snapshot = createDemoData()
    snapshot.order.id = 'OTHER-ORDER'
    data.setSnapshot(snapshot)
    expect(history.entries).toHaveLength(1)
    expect(history.latestEvent?.type).toBe('order-loaded')
    expect(history.isExpanded).toBe(false)
    workflow.dispose()
  })

  it('retains unknown-code notifications and records failed quantity validation', async () => {
    const { alerts, history, workflow } = await setup()
    workflow.barcodeUnknown()
    expect(history.latestEvent?.level).toBe('error')
    expect(alerts.publish).toHaveBeenCalledOnce()
    workflow.selectContainer('C1')
    workflow.selectProduct('P1')
    workflow.command('request-transfer-quantity')
    workflow.submitQuantity(999)
    expect(history.latestEvent?.type).toBe('workflow-rejected')
    expect(history.entries).toHaveLength(3)
    workflow.dispose()
  })
})
