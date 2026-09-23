import { makeAutoObservable } from 'mobx'

import type { Operation, PendingOperation, SourceScope, WorkflowCommand } from './commands'

export type ScanSourceContext =
  | { containerId: string; kind: 'container' }
  | { kind: 'none' }
  | { kind: 'product'; productId: string }
export type ScanSelection =
  | { containerId: string; kind: 'container' }
  | { containerId?: string; kind: 'product'; productId: string }
type StableStep =
  | { containerId: string; kind: 'container-selected' }
  | { containerId?: string; kind: 'product-selected'; productId: string }
  | { kind: 'ready' }
export type ScanStep =
  | StableStep
  | { kind: 'transferring' }
  | { kind: 'awaiting-return-product'; partial: boolean }
  | { kind: 'awaiting-quantity'; operation: Operation; transportPlaceId: string | null }
export type ScanEffect = PendingOperation
export type ScanFeedback = { kind: 'error' | 'info' | 'processing'; message: string }
export type ScanErrorCode =
  | 'container-not-found'
  | 'product-not-found'
  | 'product-not-in-container'
  | 'transport-place-not-found'
export type ResolvedScanEvent =
  | { containerId: string; type: 'container-scanned' }
  | { productId: string; type: 'product-scanned' }
  | { command: WorkflowCommand; type: 'command-scanned' }
  | { transportPlaceId: string; type: 'transport-place-scanned' }
export type ScanEvent =
  | ResolvedScanEvent
  | { containerId: string; type: 'mouse-container-selected' }
  | { productId: string; type: 'mouse-product-selected' }
  | { productId: string; sourceLineId: string; type: 'mouse-source-line-selected' }
  | { productId: string; type: 'mouse-destination-product-selected' }
  | { transportPlaceId: string; type: 'mouse-transport-place-selected' }
  | { type: 'mouse-filter-cleared' }
  | { code: ScanErrorCode; type: 'selection-rejected' }
  | { message: string; type: 'workflow-rejected' }
  | { quantity: number; type: 'quantity-submitted' }
  | { id: string; transportPlaceId: string; type: 'operation-succeeded' }
  | { id: string; message: string; transportPlaceId?: string; type: 'operation-failed' }
const errorMessages: Record<ScanErrorCode, string> = {
  'container-not-found': 'Контейнер не найден',
  'product-not-found': 'Товар не найден',
  'product-not-in-container': 'Товар отсутствует в выбранном контейнере',
  'transport-place-not-found': 'Транспортное место не найдено',
}
export class ScanMachine {
  activeTransportPlaceId: string | null = null
  selectedDestinationProductId: string | null = null
  selectedSourceLineId: string | null = null
  selectedSource: ScanSelection | null = null
  source: ScanSourceContext = { kind: 'none' }
  step: ScanStep = { kind: 'ready' }
  feedback: ScanFeedback = { kind: 'info', message: 'Сканируйте контейнер или товар' }
  pendingEffect: PendingOperation | null = null
  private sequence = 0
  private resumeStep: StableStep = { kind: 'ready' }
  private resumeDestination: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }
  get isTransferring() {
    return this.step.kind === 'transferring'
  }
  get isWaiting() {
    return this.step.kind === 'awaiting-quantity' || this.step.kind === 'awaiting-return-product'
  }
  get sourceScope(): SourceScope | null {
    const selection = this.selectedSource
    if (selection?.kind === 'product' && this.selectedSourceLineId)
      return {
        kind: 'line',
        productId: selection.productId,
        sourceLineId: this.selectedSourceLineId,
      }
    if (this.source.kind === 'container')
      return {
        containerId: this.source.containerId,
        kind: 'container',
        productId: selection?.kind === 'product' ? selection.productId : undefined,
      }
    return selection?.kind === 'product'
      ? { kind: 'product', productId: selection.productId }
      : null
  }
  send(event: ScanEvent): void {
    if (event.type === 'operation-succeeded' || event.type === 'operation-failed') {
      if (event.id !== this.pendingEffect?.id) return
      const operation = this.pendingEffect
      if (event.transportPlaceId) this.activeTransportPlaceId = event.transportPlaceId
      this.pendingEffect = null
      this.step = this.resumeStep
      if (event.type === 'operation-failed') {
        this.reject(event.message)
        return
      }
      if (operation.kind === 'return') this.selectedDestinationProductId = null
      else {
        this.selectedSourceLineId = null
        if (this.source.kind === 'container') {
          this.selectedSource = { ...this.source }
          this.step = { containerId: this.source.containerId, kind: 'container-selected' }
        }
      }
      this.feedback = {
        kind: 'info',
        message: operation.kind === 'return' ? 'Возврат выполнен' : 'Перенос выполнен',
      }
      return
    }
    if (this.isTransferring) return
    if (event.type === 'workflow-rejected') {
      this.reject(event.message)
      return
    }
    if (event.type === 'selection-rejected') {
      this.reject(errorMessages[event.code])
      return
    }
    if (event.type === 'command-scanned' && event.command === 'cancel') {
      this.cancel()
      return
    }
    if (event.type === 'quantity-submitted') {
      if (this.step.kind === 'awaiting-quantity') {
        if (!Number.isInteger(event.quantity) || event.quantity < 1) {
          this.reject('Некорректное количество')
          return
        }
        this.begin({ ...this.step.operation, quantity: event.quantity }, this.step.transportPlaceId)
      }
      return
    }
    if (this.step.kind === 'awaiting-quantity') {
      this.reject('Подтвердите количество или отмените ввод')
      return
    }
    if (
      event.type === 'transport-place-scanned' ||
      event.type === 'mouse-transport-place-selected'
    ) {
      this.activeTransportPlaceId = event.transportPlaceId
      this.selectedDestinationProductId = null
      if (this.isWaiting) this.resumeDestination = null
      this.feedback = { kind: 'info', message: 'Транспортное место выбрано' }
      return
    }
    if (this.step.kind === 'awaiting-return-product') {
      if (event.type === 'product-scanned' || event.type === 'mouse-destination-product-selected') {
        const partial = this.step.partial
        this.selectedDestinationProductId = event.productId
        this.startReturn(partial)
      } else this.reject('Сканируйте товар для возврата или отмените операцию')
      return
    }
    switch (event.type) {
      case 'command-scanned':
        this.command(event.command)
        return
      case 'mouse-destination-product-selected':
        this.selectedDestinationProductId = event.productId
        return
      case 'container-scanned':
      case 'mouse-container-selected':
        if (
          event.type === 'container-scanned' &&
          this.selectedSource?.kind === 'container' &&
          this.selectedSource.containerId === event.containerId
        ) {
          this.command('transfer-container')
          return
        }
        this.source = { containerId: event.containerId, kind: 'container' }
        this.selectedSource = { ...this.source }
        this.selectedSourceLineId = null
        this.step = { containerId: event.containerId, kind: 'container-selected' }
        break
      case 'product-scanned':
      case 'mouse-product-selected':
      case 'mouse-source-line-selected': {
        const scanned = event.type === 'product-scanned'
        if (
          scanned &&
          this.selectedSource?.kind === 'product' &&
          this.selectedSource.productId === event.productId &&
          this.selectedSourceLineId
        ) {
          this.command('transfer-source-line')
          return
        }
        const repeated = this.source.kind === 'product' && this.source.productId === event.productId
        const containerId = this.source.kind === 'container' ? this.source.containerId : undefined
        if (scanned && containerId) {
          this.begin({
            kind: 'transfer',
            scope: { containerId, kind: 'container', productId: event.productId },
          })
          return
        }
        if (!containerId) this.source = { kind: 'product', productId: event.productId }
        this.selectedSource = { containerId, kind: 'product', productId: event.productId }
        this.selectedSourceLineId =
          event.type === 'mouse-source-line-selected' ? event.sourceLineId : null
        this.step = { containerId, kind: 'product-selected', productId: event.productId }
        if (scanned && repeated) {
          this.command('transfer-next-product-line')
          return
        }
        break
      }
      case 'mouse-filter-cleared':
        this.source = { kind: 'none' }
        this.selectedSource = null
        this.selectedSourceLineId = null
        this.step = { kind: 'ready' }
        break
    }
    this.feedback = { kind: 'info', message: 'Выбор обновлён' }
  }
  private command(command: WorkflowCommand): void {
    const scope = this.sourceScope
    switch (command) {
      case 'return-product':
        this.startReturn(false)
        return
      case 'request-return-quantity':
        this.startReturn(true)
        return
      case 'return-transport-place':
        if (this.activeTransportPlaceId) this.begin({ kind: 'return' })
        else this.reject('Транспортное место не выбрано')
        return
      case 'request-transfer-quantity':
        if (!scope || this.selectedSource?.kind !== 'product') break
        this.rememberStep()
        this.step = {
          kind: 'awaiting-quantity',
          operation: { kind: 'transfer', scope },
          transportPlaceId: this.activeTransportPlaceId,
        }
        this.feedback = { kind: 'info', message: 'Введите количество' }
        return
      case 'transfer-container':
        if (this.source.kind === 'container') {
          this.begin({ kind: 'transfer', scope: { ...this.source } })
          return
        }
        break
      case 'transfer-filtered':
        if (this.source.kind !== 'none') {
          this.begin({ kind: 'transfer', scope: { ...this.source } })
          return
        }
        break
      case 'transfer-source-line':
        if (scope?.kind === 'line') {
          this.begin({ kind: 'transfer', scope })
          return
        }
        break
      case 'transfer-product-from-container':
        if (this.source.kind === 'container' && this.selectedSource?.kind === 'product') {
          this.begin({
            kind: 'transfer',
            scope: { ...this.source, productId: this.selectedSource.productId },
          })
          return
        }
        break
      case 'transfer-product':
      case 'transfer-next-product-line':
        if (this.source.kind === 'product') {
          this.begin({
            kind: 'transfer',
            scope: { ...this.source, next: command === 'transfer-next-product-line' },
          })
          return
        }
        break
      case 'cancel':
        this.cancel()
        return
    }
    this.reject('Нет подходящего выбора для команды')
  }
  private startReturn(partial: boolean): void {
    if (!this.activeTransportPlaceId) {
      this.reject('Транспортное место не выбрано')
      return
    }
    this.rememberStep()
    if (!this.selectedDestinationProductId) {
      this.step = { kind: 'awaiting-return-product', partial }
      this.feedback = { kind: 'info', message: 'Сканируйте товар для возврата' }
    } else if (partial) {
      this.step = {
        kind: 'awaiting-quantity',
        operation: { kind: 'return', productId: this.selectedDestinationProductId },
        transportPlaceId: this.activeTransportPlaceId,
      }
      this.feedback = { kind: 'info', message: 'Введите количество возврата' }
    } else this.begin({ kind: 'return', productId: this.selectedDestinationProductId })
  }
  private rememberStep(): void {
    if (
      this.step.kind === 'ready' ||
      this.step.kind === 'container-selected' ||
      this.step.kind === 'product-selected'
    ) {
      this.resumeStep = this.step
      this.resumeDestination = this.selectedDestinationProductId
    }
  }
  private begin(operation: Operation, transportPlaceId = this.activeTransportPlaceId): void {
    this.rememberStep()
    this.pendingEffect = { ...operation, id: `operation-${++this.sequence}`, transportPlaceId }
    this.step = { kind: 'transferring' }
    this.feedback = { kind: 'processing', message: 'Обработка…' }
  }
  private cancel(): void {
    if (!this.isWaiting) return
    this.step = this.resumeStep
    this.selectedDestinationProductId = this.resumeDestination
    this.feedback = { kind: 'info', message: 'Операция отменена' }
  }
  private reject(message: string): void {
    this.feedback = { kind: 'error', message }
  }
  barcodeUnknown(): void {
    if (!this.isTransferring) this.reject('Штрихкод не распознан')
  }
  mouseContainerSelected(containerId: string): void {
    this.send({ containerId, type: 'mouse-container-selected' })
  }
  mouseProductSelected(productId: string): void {
    this.send({ productId, type: 'mouse-product-selected' })
  }
  mouseTransportPlaceSelected(transportPlaceId: string): void {
    this.send({ transportPlaceId, type: 'mouse-transport-place-selected' })
  }
  mouseFilterCleared(): void {
    this.send({ type: 'mouse-filter-cleared' })
  }
}
