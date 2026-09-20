import type { ShipmentStore } from '@/domain/shipment/shipment-store'

export const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)

export function containerRows(store: ShipmentStore) {
  return store.data.containers
    .map((container) => {
      const lines = store.remainingLines.filter((line) => line.containerId === container.id)
      let units = 0
      let boxes = 0
      let volume = 0
      const products = new Set<string>()
      for (const line of lines) {
        const product = store.data.products.find((item) => item.id === line.productId)
        if (!product || line.remainingQuantity <= 0) continue
        products.add(product.id)
        units += line.remainingQuantity
        boxes += line.remainingQuantity / product.unitsPerBox
        volume += line.remainingQuantity * product.unitVolumeM3
      }
      return { boxes, id: container.id, name: container.barcode, sku: products.size, units, volume }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
