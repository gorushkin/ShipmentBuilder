export const barcodeCommands = {
  'CMD:ALL': 'transfer-filtered',
  'CMD:CANCEL': 'cancel',
  'CMD:CONTAINER': 'transfer-container',
  'CMD:LINE': 'transfer-source-line',
  'CMD:NEXT': 'transfer-next-product-line',
  'CMD:PRODUCT': 'transfer-product',
  'CMD:QTY': 'request-transfer-quantity',
  'CMD:RETURN': 'return-product',
  'CMD:RETURN-ALL': 'return-transport-place',
  'CMD:RETURN-QTY': 'request-return-quantity',
} as const
export type WorkflowCommand =
  (typeof barcodeCommands)[keyof typeof barcodeCommands] | 'transfer-product-from-container'
import type { SourceScope } from '@/domain/shipment/source-scope'
export type { SourceScope } from '@/domain/shipment/source-scope'
export type Operation =
  | { kind: 'transfer'; quantity?: number; scope: SourceScope }
  | { kind: 'return'; productId?: string; quantity?: number }
export type PendingOperation = Operation & { id: string; transportPlaceId: string | null }
