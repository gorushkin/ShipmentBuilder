import { makeAutoObservable } from 'mobx'

import type { RemainingLine, ShipmentData, ShipmentTotals, SourceLine, TransportPlace } from './types'

export type SourceFilter =
  | { containerId: string; type: 'container' }
  | { productId: string; type: 'product' }

export type DataOperationError =
  | 'container-not-found'
  | 'product-not-found'
  | 'product-not-in-container'
  | 'quantity-invalid'
  | 'source-empty'
  | 'transport-place-empty'
  | 'transport-place-not-found'
  | 'product-not-in-transport-place'

export type DataResult<T> = { code: DataOperationError; ok: false; } | { ok: true; value: T }

export interface TransferInput { transportPlaceId: string }
export interface ContainerTransferInput extends TransferInput { containerId: string }
export interface ProductTransferInput extends TransferInput { productId: string }
export interface ContainerProductTransferInput extends ProductTransferInput { containerId: string }
export interface QuantityTransferInput extends ProductTransferInput { quantity: number }
export type ReturnQuantityInput = QuantityTransferInput
export interface TransferResult { quantity: number; sourceLineIds: string[]; transportPlaceId: string }

const emptyTotals = (): ShipmentTotals => ({ boxes: 0, containers: 0, sku: 0, units: 0, volumeM3: 0, weightKg: 0 })

function copySnapshot(data: ShipmentData): ShipmentData {
  return {
    aggregationCodes: data.aggregationCodes.map((item) => ({ ...item, markingCodeIds: [...item.markingCodeIds] })),
    allocationLines: data.allocationLines.map((item) => ({ ...item })),
    containers: data.containers.map((item) => ({ ...item })),
    markingCodes: data.markingCodes.map((item) => ({ ...item })),
    order: { ...data.order }, products: data.products.map((item) => ({ ...item })),
    sourceLines: data.sourceLines.map((item) => ({ ...item })), transportPlaces: data.transportPlaces.map((item) => ({ ...item })),
  }
}

export class ShipmentDataStore {
  activeTransportPlaceId: null | string = null
  data: null | ShipmentData = null
  sourceFilter: null | SourceFilter = null

  constructor() { makeAutoObservable(this, {}, { autoBind: true }) }

  get hasSnapshot(): boolean { return this.data !== null }
  get remainingLines(): RemainingLine[] {
    if (!this.data) return []
    const allocated = new Map<string, number>()
    for (const item of this.data.allocationLines) allocated.set(item.sourceLineId, (allocated.get(item.sourceLineId) ?? 0) + item.quantity)
    return this.data.sourceLines.map((item) => ({ ...item, remainingQuantity: item.quantity - (allocated.get(item.id) ?? 0) }))
  }
  get filteredRemainingLines(): RemainingLine[] {
    const filter = this.sourceFilter
    if (!filter) return []
    return this.remainingLines.filter((line) => line.remainingQuantity > 0 && (filter.type === 'container' ? line.containerId === filter.containerId : line.productId === filter.productId))
  }
  get orderTotals(): ShipmentTotals { return this.totals(this.data?.sourceLines ?? []) }
  get remainingTotals(): ShipmentTotals { return this.totals(this.remainingLines.map((item) => ({ ...item, quantity: item.remainingQuantity }))) }
  get distributedUnits(): number { return this.data?.allocationLines.reduce((sum, item) => sum + item.quantity, 0) ?? 0 }
  get distributionProgress(): number { return this.orderTotals.units === 0 ? 0 : (this.distributedUnits / this.orderTotals.units) * 100 }
  get activeTransportPlaceProducts(): { productId: string; quantity: number }[] {
    if (!this.data || !this.activeTransportPlaceId) return []
    const result = new Map<string, number>(); const byLine = new Map(this.data.sourceLines.map((line) => [line.id, line]))
    for (const item of this.data.allocationLines) { const line = byLine.get(item.sourceLineId); if (item.transportPlaceId === this.activeTransportPlaceId && line) result.set(line.productId, (result.get(line.productId) ?? 0) + item.quantity) }
    return [...result].map(([productId, quantity]) => ({ productId, quantity }))
  }
  setSnapshot(snapshot: ShipmentData): void { this.data = copySnapshot(snapshot); this.activeTransportPlaceId = null; this.sourceFilter = null }
  setContainerFilter(containerId: string): DataResult<void> { return this.data?.containers.some((x) => x.id === containerId) ? this.ok((this.sourceFilter = { containerId, type: 'container' }, undefined)) : this.fail('container-not-found') }
  setProductFilter(productId: string): DataResult<void> { return this.data?.products.some((x) => x.id === productId) ? this.ok((this.sourceFilter = { productId, type: 'product' }, undefined)) : this.fail('product-not-found') }
  clearSourceFilter(): void { this.sourceFilter = null }
  createTransportPlace(): DataResult<TransportPlace> {
    if (!this.data) return this.fail('source-empty')
    const sequence = Math.max(0, ...this.data.transportPlaces.map((x) => x.sequence)) + 1; const suffix = String(sequence).padStart(3, '0')
    const place: TransportPlace = { barcode: `TM${sequence}`, id: `${this.data.order.id}-TP-${suffix}`, number: `ТМ-${suffix}`, orderId: this.data.order.id, scanBarcode: `TM${sequence}`, sequence }
    this.data.transportPlaces.push(place); this.activeTransportPlaceId = place.id; return this.ok(place)
  }
  selectTransportPlace(transportPlaceId: string): DataResult<void> { if (!this.place(transportPlaceId)) return this.fail('transport-place-not-found'); this.activeTransportPlaceId = transportPlaceId; return this.ok(undefined) }
  transferContainer(input: ContainerTransferInput): DataResult<TransferResult> { const lines = this.remainingLines.filter((x) => x.containerId === input.containerId && x.remainingQuantity > 0); return this.transfer(lines, input.transportPlaceId, input.containerId, 'container-not-found') }
  transferProductFromContainer(input: ContainerProductTransferInput): DataResult<TransferResult> { const lines = this.remainingLines.filter((x) => x.containerId === input.containerId && x.productId === input.productId && x.remainingQuantity > 0); return this.transfer(lines, input.transportPlaceId, input.productId, 'product-not-in-container') }
  transferNextProductLine(input: ProductTransferInput): DataResult<TransferResult> { const line = this.remainingLines.find((x) => x.productId === input.productId && x.remainingQuantity > 0); return line ? this.transfer([line], input.transportPlaceId, input.productId, 'source-empty') : this.fail('source-empty') }
  transferProductQuantity(input: QuantityTransferInput): DataResult<TransferResult> { if (!Number.isInteger(input.quantity) || input.quantity < 1) return this.fail('quantity-invalid'); const lines = this.remainingLines.filter((x) => x.productId === input.productId && x.remainingQuantity > 0); if (lines.reduce((s,x)=>s+x.remainingQuantity,0) < input.quantity) return this.fail('quantity-invalid'); return this.transfer(lines, input.transportPlaceId, input.productId, 'source-empty', input.quantity) }
  returnTransportPlaceContents(transportPlaceId: string): DataResult<void> { if (!this.place(transportPlaceId)) return this.fail('transport-place-not-found'); if (!this.data?.allocationLines.some((x)=>x.transportPlaceId===transportPlaceId)) return this.fail('transport-place-empty'); this.data.allocationLines = this.data.allocationLines.filter((x)=>x.transportPlaceId!==transportPlaceId); return this.ok(undefined) }
  returnProduct(input: ProductTransferInput): DataResult<void> { return this.returnQuantity({ ...input, quantity: Number.MAX_SAFE_INTEGER }, true) }
  returnProductQuantity(input: ReturnQuantityInput): DataResult<void> { return this.returnQuantity(input, false) }
  private returnQuantity(input: ReturnQuantityInput, all: boolean): DataResult<void> {
    if (!this.place(input.transportPlaceId)) return this.fail('transport-place-not-found'); if (!this.data || (!all && (!Number.isInteger(input.quantity) || input.quantity < 1))) return this.fail('quantity-invalid')
    const ids = new Set(this.data.sourceLines.filter((x)=>x.productId===input.productId).map((x)=>x.id)); const lines = this.data.allocationLines.filter((x)=>x.transportPlaceId===input.transportPlaceId && ids.has(x.sourceLineId)); const available=lines.reduce((s,x)=>s+x.quantity,0)
    if (!available) return this.fail('product-not-in-transport-place'); if (!all && input.quantity > available) return this.fail('quantity-invalid')
    let left = all ? available : input.quantity; for (const line of lines) { const n=Math.min(line.quantity,left); line.quantity-=n; left-=n }; this.data.allocationLines=this.data.allocationLines.filter((x)=>x.quantity>0); return this.ok(undefined)
  }
  private transfer(lines: RemainingLine[], transportPlaceId: string, _source: string, missing: DataOperationError, quantity?: number): DataResult<TransferResult> {
    if (!this.data) return this.fail('source-empty'); if (!this.place(transportPlaceId)) return this.fail('transport-place-not-found'); if (!lines.length) return this.fail(missing)
    let left=quantity ?? lines.reduce((s,x)=>s+x.remainingQuantity,0); const ids:string[]=[]
    for (const line of lines) { if (!left) break; const n=Math.min(line.remainingQuantity,left); if (!n) continue; this.upsert(line.id,transportPlaceId,n); ids.push(line.id); left-=n }
    return this.ok({ quantity: quantity ?? lines.reduce((s,x)=>s+x.remainingQuantity,0), sourceLineIds: ids, transportPlaceId })
  }
  private upsert(sourceLineId:string, transportPlaceId:string, quantity:number):void { if (!this.data) return; const existing=this.data.allocationLines.find((x)=>x.sourceLineId===sourceLineId&&x.transportPlaceId===transportPlaceId); if(existing){existing.quantity+=quantity;return}; this.data.allocationLines.push({id:`${transportPlaceId}-${sourceLineId}-allocation`,quantity,sourceLineId,transportPlaceId}) }
  private place(id:string): TransportPlace | undefined { return this.data?.transportPlaces.find((x)=>x.id===id) }
  private totals(lines: SourceLine[]): ShipmentTotals { if(!this.data) return emptyTotals(); const products=new Map(this.data.products.map((x)=>[x.id,x])); const containers=new Set<string>(), sku=new Set<string>(); const total=emptyTotals(); for(const line of lines){const p=products.get(line.productId);if(!p||line.quantity<=0)continue;containers.add(line.containerId);sku.add(line.productId);total.units+=line.quantity;total.boxes+=line.quantity/p.unitsPerBox;total.weightKg+=line.quantity*p.unitWeightKg;total.volumeM3+=line.quantity*p.unitVolumeM3} total.containers=containers.size;total.sku=sku.size;return total }
  private ok<T>(value:T):DataResult<T>{return{ok:true,value}}
  private fail<T>(code:DataOperationError):DataResult<T>{return{code,ok:false}}
}
