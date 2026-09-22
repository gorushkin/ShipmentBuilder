import { makeAutoObservable } from 'mobx'

export type ScanSourceContext =
  | { containerId: string; kind: 'container' }
  | { kind: 'none' }
  | { kind: 'product'; productId: string }

export type ScanSelection =
  | { containerId: string; kind: 'container' }
  | { containerId?: string; kind: 'product'; productId: string }

export type ScanStep =
  | { containerId: string; kind: 'container-selected' }
  | { containerId?: string; kind: 'product-selected'; productId: string }
  | { kind: 'ready' }

export type ScanEffect =
  | { containerId: string; id: string; kind: 'transfer-container' }
  | { containerId: string; id: string; kind: 'transfer-product-from-container'; productId: string }
  | { id: string; kind: 'transfer-next-product-line'; productId: string }
  | { id: string; kind: 'transfer-quantity'; productId: string; quantity: number }

export type ScanIntent =
  | { containerId: string; id: string; kind: 'transfer-container' }
  | { containerId: string; id: string; kind: 'transfer-product-from-container'; productId: string }
  | { id: string; kind: 'transfer-next-product-line'; productId: string }
  | { containerId?: string; id: string; kind: 'transfer-quantity'; productId: string }

type NewScanIntent = ScanIntent extends infer Intent
  ? Intent extends ScanIntent
    ? Omit<Intent, 'id'>
    : never
  : never

export type ScanErrorCode =
  | 'container-not-found'
  | 'product-not-found'
  | 'product-not-in-container'
  | 'transport-place-not-found'

export type ScanFeedback = { kind: 'error' | 'info' | 'processing'; message: string }

export type ResolvedScanEvent =
  | { containerId: string; type: 'container-scanned' }
  | { productId: string; type: 'product-scanned' }
  | { command: 'transfer-quantity'; type: 'command-scanned' }
  | { transportPlaceId: string; type: 'transport-place-scanned' }

export type ScanEvent =
  | ResolvedScanEvent
  | { containerId: string; type: 'mouse-container-selected' }
  | { productId: string; type: 'mouse-product-selected' }
  | { transportPlaceId: string; type: 'mouse-transport-place-selected' }
  | { type: 'mouse-filter-cleared' }
  | { code: ScanErrorCode; type: 'selection-rejected' }

const errorMessages: Record<ScanErrorCode, string> = {
  'container-not-found': 'Контейнер не найден',
  'product-not-found': 'Товар не найден',
  'product-not-in-container': 'Товар отсутствует в выбранном контейнере',
  'transport-place-not-found': 'Транспортное место не найдено',
}

export class ScanMachine {
  activeTransportPlaceId: null | string = null
  feedback: ScanFeedback = { kind: 'info', message: 'Сканируйте контейнер или товар' }
  readonly isTransferring = false
  lastIntent: null | ScanIntent = null
  pendingEffect: null | ScanEffect = null
  selectedSource: null | ScanSelection = null
  source: ScanSourceContext = { kind: 'none' }
  step: ScanStep = { kind: 'ready' }

  private intentSequence = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  send(event: ScanEvent): void {
    switch (event.type) {
      case 'container-scanned':
      case 'mouse-container-selected':
        this.selectContainer(event.containerId, event.type === 'container-scanned')
        return
      case 'product-scanned':
      case 'mouse-product-selected':
        this.selectProduct(event.productId, event.type === 'product-scanned')
        return
      case 'transport-place-scanned':
      case 'mouse-transport-place-selected':
        this.activeTransportPlaceId = event.transportPlaceId
        this.feedback = { kind: 'info', message: 'Транспортное место выбрано' }
        return
      case 'command-scanned':
        this.handleCommand()
        return
      case 'mouse-filter-cleared':
        this.source = { kind: 'none' }
        this.selectedSource = null
        this.step = { kind: 'ready' }
        this.feedback = { kind: 'info', message: 'Фильтр снят' }
        return
      case 'selection-rejected':
        this.feedback = { kind: 'error', message: errorMessages[event.code] }
    }
  }

  barcodeUnknown(): void {
    this.feedback = { kind: 'error', message: 'Штрихкод не распознан' }
  }

  mouseContainerSelected(containerId: string): void {
    this.send({ containerId, type: 'mouse-container-selected' })
  }

  mouseFilterCleared(): void {
    this.send({ type: 'mouse-filter-cleared' })
  }

  mouseProductSelected(productId: string): void {
    this.send({ productId, type: 'mouse-product-selected' })
  }

  mouseTransportPlaceSelected(transportPlaceId: string): void {
    this.send({ transportPlaceId, type: 'mouse-transport-place-selected' })
  }

  private handleCommand(): void {
    if (this.selectedSource?.kind !== 'product') {
      this.feedback = { kind: 'error', message: 'Товар для перемещения количества не выбран' }
      return
    }
    const { containerId, productId } = this.selectedSource
    this.publishIntent({ containerId, kind: 'transfer-quantity', productId })
    this.feedback = { kind: 'info', message: 'Команда перемещения количества принята' }
  }

  private publishIntent(intent: NewScanIntent): void {
    this.lastIntent = { ...intent, id: `scan-intent-${++this.intentSequence}` }
  }

  private selectContainer(containerId: string, scanned: boolean): void {
    if (
      scanned &&
      this.selectedSource?.kind === 'container' &&
      this.selectedSource.containerId === containerId
    ) {
      this.publishIntent({ containerId, kind: 'transfer-container' })
    }
    this.source = { containerId, kind: 'container' }
    this.selectedSource = { containerId, kind: 'container' }
    this.step = { containerId, kind: 'container-selected' }
    this.feedback = { kind: 'info', message: 'Контейнер выбран' }
  }

  private selectProduct(productId: string, scanned: boolean): void {
    if (this.source.kind === 'container') {
      const containerId = this.source.containerId
      this.selectedSource = { containerId, kind: 'product', productId }
      this.step = { containerId, kind: 'product-selected', productId }
      if (scanned)
        this.publishIntent({ containerId, kind: 'transfer-product-from-container', productId })
    } else {
      if (scanned && this.source.kind === 'product' && this.source.productId === productId) {
        this.publishIntent({ kind: 'transfer-next-product-line', productId })
      }
      this.source = { kind: 'product', productId }
      this.selectedSource = { kind: 'product', productId }
      this.step = { kind: 'product-selected', productId }
    }
    this.feedback = { kind: 'info', message: 'Товар выбран' }
  }
}
