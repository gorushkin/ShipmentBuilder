import { describe, expect, it } from 'vitest'

import { getActionPanelStatus } from './action-panel-status'

const base = {
  activeTransportPlaceId: 'TP-1',
  feedback: { kind: 'info' as const, message: 'Выбор обновлён' },
  hasRemainingItems: true,
  hasSnapshot: true,
}

describe('getActionPanelStatus', () => {
  it('shows the initial scan prompt', () => {
    expect(getActionPanelStatus({ ...base, step: { kind: 'ready' } })).toMatchObject({
      message: 'Отсканируйте контейнер или товар',
    })
  })

  it('shows selected source states after transport place is selected', () => {
    expect(
      getActionPanelStatus({ ...base, step: { containerId: 'C1', kind: 'container-selected' } }),
    ).toMatchObject({ message: 'Контейнер выбран' })
    expect(
      getActionPanelStatus({ ...base, step: { kind: 'product-selected', productId: 'P1' } }),
    ).toMatchObject({ message: 'Товар выбран' })
  })

  it('requires a transport place before showing a stable source selection', () => {
    expect(
      getActionPanelStatus({
        ...base,
        activeTransportPlaceId: null,
        step: { containerId: 'C1', kind: 'container-selected' },
      }),
    ).toMatchObject({ message: 'Выберите транспортное место' })
  })

  it('describes pending input', () => {
    expect(
      getActionPanelStatus({
        ...base,
        step: {
          kind: 'awaiting-quantity',
          operation: { kind: 'transfer', scope: { kind: 'product', productId: 'P1' } },
          transportPlaceId: 'TP-1',
        },
      }),
    ).toMatchObject({ message: 'Введите количество' })
    expect(
      getActionPanelStatus({ ...base, step: { kind: 'awaiting-return-product', partial: false } }),
    ).toMatchObject({ message: 'Отсканируйте товар для возврата' })
  })

  it('prioritizes processing, errors, and completion in that order', () => {
    expect(
      getActionPanelStatus({
        ...base,
        feedback: { kind: 'error', message: 'Ошибка операции' },
        hasRemainingItems: false,
        step: { kind: 'transferring' },
      }),
    ).toMatchObject({ message: 'Обработка…' })
    expect(
      getActionPanelStatus({
        ...base,
        feedback: { kind: 'error', message: 'Ошибка операции' },
        hasRemainingItems: false,
        step: { kind: 'ready' },
      }),
    ).toMatchObject({ message: 'Ошибка операции' })
    expect(
      getActionPanelStatus({ ...base, hasRemainingItems: false, step: { kind: 'ready' } }),
    ).toMatchObject({ message: 'Все товары распределены' })
  })
})
