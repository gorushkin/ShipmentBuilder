import { makeAutoObservable } from 'mobx'

export type ScanSourceContext =
  | { containerId: string; kind: 'container'; }
  | { kind: 'none' }
  | { kind: 'product'; productId: string }

export type ScanStep =
  | { kind: 'awaiting-quantity'; productId: string }
  | { containerId: string; kind: 'container-selected'; }
  | { kind: 'product-selected'; productId: string }
  | { kind: 'ready' }
  | { containerId: string; effectId: string; kind: 'transferring-container' }
  | {
      containerId: string
      effectId: string
      kind: 'transferring-product-from-container'
      productId: string
    }
  | { effectId: string; kind: 'transferring-next-product-line'; productId: string }
  | { effectId: string; kind: 'transferring-quantity'; productId: string; quantity: number }

export type ScanEffect =
  | { containerId: string; id: string; kind: 'transfer-container' }
  | {
      containerId: string
      id: string
      kind: 'transfer-product-from-container'
      productId: string
    }
  | { id: string; kind: 'transfer-next-product-line'; productId: string }
  | { id: string; kind: 'transfer-quantity'; productId: string; quantity: number }

export type ScanErrorCode =
  | 'destination-not-selected'
  | 'product-not-found'
  | 'product-not-in-container'
  | 'quantity-invalid'
  | 'source-empty'
  | 'transfer-failed'

export type ScanFeedback = { kind: 'error' | 'info' | 'processing'; message: string }

export type ResolvedScanEvent =
  | { containerId: string; type: 'container-scanned' }
  | { productId: string; type: 'product-scanned' }
  | { command: 'transfer-quantity'; type: 'command-scanned' }
  | { transportPlaceId: string; type: 'transport-place-scanned' }

export type ScanEvent =
  | ResolvedScanEvent
  | { effectId: string; result: 'completed' | 'container-emptied' | 'product-exhausted'; type: 'operation-succeeded' }
  | { code: ScanErrorCode; effectId: string; type: 'operation-failed' }
  | { quantity: number; type: 'quantity-confirmed' }

type StableStep = Extract<ScanStep, { kind: 'awaiting-quantity' | 'container-selected' | 'product-selected' | 'ready' }>
type NewScanEffect = ScanEffect extends infer Effect
  ? Effect extends ScanEffect
    ? Omit<Effect, 'id'>
    : never
  : never

function sourceForStep(step: StableStep): ScanSourceContext {
  if (step.kind === 'container-selected') return { containerId: step.containerId, kind: 'container' }
  if (step.kind === 'product-selected' || step.kind === 'awaiting-quantity') {
    return { kind: 'product', productId: step.productId }
  }
  return { kind: 'none' }
}

function errorMessage(code: ScanErrorCode): string {
  const messages: Record<ScanErrorCode, string> = {
    'destination-not-selected': 'Транспортное место не выбрано',
    'product-not-found': 'Товар не найден',
    'product-not-in-container': 'Товар отсутствует в выбранном контейнере',
    'quantity-invalid': 'Укажите допустимое количество',
    'source-empty': 'Нет товара для перемещения',
    'transfer-failed': 'Не удалось выполнить перемещение',
  }
  return messages[code]
}

export class ScanMachine {
  activeTransportPlaceId: null | string = null
  feedback: ScanFeedback = { kind: 'info', message: 'Сканируйте контейнер или товар' }
  pendingEffect: null | ScanEffect = null
  source: ScanSourceContext = { kind: 'none' }
  step: ScanStep = { kind: 'ready' }

  private effectSequence = 0
  private previousStableStep: StableStep = { kind: 'ready' }

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get isTransferring(): boolean {
    return this.step.kind.startsWith('transferring-')
  }

  send(event: ScanEvent): void {
    if (this.isTransferring && event.type !== 'operation-failed' && event.type !== 'operation-succeeded') {
      return
    }

    switch (event.type) {
      case 'container-scanned':
        this.handleContainerScan(event.containerId)
        return
      case 'product-scanned':
        this.handleProductScan(event.productId)
        return
      case 'transport-place-scanned':
        this.activeTransportPlaceId = event.transportPlaceId
        this.feedback = { kind: 'info', message: 'Транспортное место выбрано' }
        return
      case 'command-scanned':
        this.handleCommand(event.command)
        return
      case 'quantity-confirmed':
        this.handleQuantity(event.quantity)
        return
      case 'operation-succeeded':
        this.handleSuccess(event.effectId, event.result)
        return
      case 'operation-failed':
        this.handleFailure(event.effectId, event.code)
    }
  }

  barcodeUnknown(): void {
    if (this.isTransferring) return
    this.feedback = { kind: 'error', message: 'Штрихкод не распознан' }
  }

  mouseContainerSelected(containerId: string): void {
    if (this.isTransferring) return
    this.setStableStep({ containerId, kind: 'container-selected' }, 'Контейнер выбран')
  }

  mouseFilterCleared(): void {
    if (this.isTransferring) return
    this.setStableStep({ kind: 'ready' }, 'Фильтр снят')
  }

  mouseProductSelected(productId: string): void {
    if (this.isTransferring) return
    this.setStableStep({ kind: 'product-selected', productId }, 'Товар выбран')
  }

  mouseTransportPlaceSelected(transportPlaceId: string): void {
    if (this.isTransferring) return
    this.activeTransportPlaceId = transportPlaceId
    this.feedback = { kind: 'info', message: 'Транспортное место выбрано' }
  }

  private handleCommand(command: 'transfer-quantity'): void {
    if (command === 'transfer-quantity' && this.step.kind === 'product-selected') {
      this.setStableStep(
        { kind: 'awaiting-quantity', productId: this.step.productId },
        'Введите количество для перемещения',
      )
      return
    }
    this.feedback = { kind: 'error', message: 'Товар для перемещения количества не выбран' }
  }

  private handleContainerScan(containerId: string): void {
    if (this.step.kind === 'container-selected' && this.step.containerId === containerId) {
      this.startTransfer({ containerId, kind: 'transfer-container' }, this.step)
      return
    }
    this.setStableStep({ containerId, kind: 'container-selected' }, 'Контейнер выбран')
  }

  private handleFailure(effectId: string, code: ScanErrorCode): void {
    if (this.pendingEffect?.id !== effectId) return
    this.pendingEffect = null
    this.step = this.previousStableStep
    this.source = sourceForStep(this.step)
    this.feedback = { kind: 'error', message: errorMessage(code) }
  }

  private handleProductScan(productId: string): void {
    if (this.step.kind === 'container-selected') {
      this.startTransfer({
        containerId: this.step.containerId,
        kind: 'transfer-product-from-container',
        productId,
      }, this.step)
      return
    }
    if (this.step.kind === 'product-selected' && this.step.productId === productId) {
      this.startTransfer({ kind: 'transfer-next-product-line', productId }, this.step)
      return
    }
    this.setStableStep({ kind: 'product-selected', productId }, 'Товар выбран')
  }

  private handleQuantity(quantity: number): void {
    if (this.step.kind !== 'awaiting-quantity') {
      this.feedback = { kind: 'error', message: 'Сначала выберите товар для перемещения количества' }
      return
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.feedback = { kind: 'error', message: errorMessage('quantity-invalid') }
      return
    }
    this.startTransfer(
      { kind: 'transfer-quantity', productId: this.step.productId, quantity },
      this.step,
    )
  }

  private handleSuccess(
    effectId: string,
    result: 'completed' | 'container-emptied' | 'product-exhausted',
  ): void {
    if (this.pendingEffect?.id !== effectId) return
    this.pendingEffect = null
    const shouldReset = result === 'container-emptied' || result === 'product-exhausted'
    this.setStableStep(shouldReset ? { kind: 'ready' } : this.previousStableStep, 'Перемещение выполнено')
  }

  private setStableStep(step: StableStep, message: string): void {
    this.previousStableStep = step
    this.step = step
    this.source = sourceForStep(step)
    this.pendingEffect = null
    this.feedback = { kind: 'info', message }
  }

  private startTransfer(effect: NewScanEffect, previousStableStep: StableStep): void {
    const id = `scan-effect-${++this.effectSequence}`
    const pendingEffect: ScanEffect = { ...effect, id }
    this.previousStableStep = previousStableStep
    this.pendingEffect = pendingEffect
    this.step = this.stepForEffect(pendingEffect)
    this.feedback = { kind: 'processing', message: 'Обработка…' }
  }

  private stepForEffect(effect: ScanEffect): ScanStep {
    switch (effect.kind) {
      case 'transfer-container':
        return { containerId: effect.containerId, effectId: effect.id, kind: 'transferring-container' }
      case 'transfer-product-from-container':
        return {
          containerId: effect.containerId,
          effectId: effect.id,
          kind: 'transferring-product-from-container',
          productId: effect.productId,
        }
      case 'transfer-next-product-line':
        return {
          effectId: effect.id,
          kind: 'transferring-next-product-line',
          productId: effect.productId,
        }
      case 'transfer-quantity':
        return {
          effectId: effect.id,
          kind: 'transferring-quantity',
          productId: effect.productId,
          quantity: effect.quantity,
        }
    }
  }
}
