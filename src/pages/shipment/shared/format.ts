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
    .filter((row) => row.units > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function productRows(store: ShipmentStore) {
  const productsById = new Map(store.data.products.map((product) => [product.id, product]))
  const rows = new Map<
    string,
    {
      boxes: number
      code: string
      containers: Set<string>
      id: string
      name: string
      units: number
    }
  >()

  for (const line of store.remainingLines) {
    if (line.remainingQuantity <= 0) continue

    const product = productsById.get(line.productId)
    if (!product) continue

    const row = rows.get(product.id) ?? {
      boxes: 0,
      code: product.code,
      containers: new Set<string>(),
      id: product.id,
      name: product.name,
      units: 0,
    }
    row.units += line.remainingQuantity
    row.boxes += line.remainingQuantity / product.unitsPerBox
    row.containers.add(line.containerId)
    rows.set(product.id, row)
  }

  return [...rows.values()]
    .map(({ containers, ...row }) => ({ ...row, containers: containers.size }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function transportPlaceRows(store: ShipmentStore) {
  return [...store.data.transportPlaces]
    .sort((a, b) => a.sequence - b.sequence)
    .map((transportPlace) => {
      const allocations = store.data.allocationLines.filter(
        (line) => line.transportPlaceId === transportPlace.id,
      )
      let boxes = 0
      let units = 0
      let volume = 0
      const products = new Set<string>()

      for (const allocation of allocations) {
        const sourceLine = store.data.sourceLines.find(
          (line) => line.id === allocation.sourceLineId,
        )
        const product = store.data.products.find((item) => item.id === sourceLine?.productId)
        if (!product || allocation.quantity <= 0) continue

        products.add(product.id)
        units += allocation.quantity
        boxes += allocation.quantity / product.unitsPerBox
        volume += allocation.quantity * product.unitVolumeM3
      }

      return {
        boxes,
        id: transportPlace.id,
        name: transportPlace.number,
        sequence: transportPlace.sequence,
        sku: products.size,
        units,
        volume,
      }
    })
}

export function transportPlaceProductRows(store: ShipmentStore) {
  const transportPlaceId = store.activeTransportPlaceId
  if (!transportPlaceId) return []

  const productsById = new Map(store.data.products.map((product) => [product.id, product]))
  const sourceLinesById = new Map(store.data.sourceLines.map((line) => [line.id, line]))
  const rows = new Map<
    string,
    { boxes: number; code: string; id: string; name: string; units: number }
  >()

  for (const allocation of store.data.allocationLines) {
    if (allocation.transportPlaceId !== transportPlaceId || allocation.quantity <= 0) continue

    const sourceLine = sourceLinesById.get(allocation.sourceLineId)
    const product = sourceLine ? productsById.get(sourceLine.productId) : undefined
    if (!product) continue

    const row = rows.get(product.id) ?? {
      boxes: 0,
      code: product.code,
      id: product.id,
      name: product.name,
      units: 0,
    }
    row.units += allocation.quantity
    row.boxes += allocation.quantity / product.unitsPerBox
    rows.set(product.id, row)
  }

  return [...rows.values()].sort((a, b) => a.code.localeCompare(b.code))
}
