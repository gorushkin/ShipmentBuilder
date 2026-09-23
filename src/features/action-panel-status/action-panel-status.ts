import type { ScanFeedback, ScanStep } from '@/features/scan-machine'

export type ActionPanelStatus = {
  message: string
  tone: 'error' | 'info' | 'processing' | 'success'
}

export type ActionPanelStatusInput = {
  activeTransportPlaceId: string | null
  feedback: ScanFeedback
  hasRemainingItems: boolean
  hasSnapshot: boolean
  step: ScanStep
}

export function getActionPanelStatus({
  activeTransportPlaceId,
  feedback,
  hasRemainingItems,
  hasSnapshot,
  step,
}: ActionPanelStatusInput): ActionPanelStatus {
  if (step.kind === 'transferring') return { message: 'Обработка…', tone: 'processing' }
  if (feedback.kind === 'error') return { message: feedback.message, tone: 'error' }
  if (hasSnapshot && !hasRemainingItems)
    return { message: 'Все товары распределены', tone: 'success' }

  if (step.kind === 'awaiting-quantity') {
    return {
      message:
        step.operation.kind === 'return' ? 'Введите количество возврата' : 'Введите количество',
      tone: 'info',
    }
  }
  if (step.kind === 'awaiting-return-product')
    return { message: 'Отсканируйте товар для возврата', tone: 'info' }
  if (!activeTransportPlaceId) return { message: 'Выберите транспортное место', tone: 'info' }
  if (step.kind === 'container-selected') return { message: 'Контейнер выбран', tone: 'success' }
  if (step.kind === 'product-selected') return { message: 'Товар выбран', tone: 'success' }

  return { message: 'Отсканируйте контейнер или товар', tone: 'info' }
}
