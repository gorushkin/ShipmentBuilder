import type { ShipmentStore } from '@/domain/shipment/shipment-store'

export const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)

export function containerRows(store: ShipmentStore) {
  const productsById = new Map(store.data.products.map((product) => [product.id, product]))
  const rows = new Map<
    string,
    { boxes: number; id: string; name: string; products: Set<string>; units: number; volume: number }
  >()

  for (const container of store.data.containers) {
    rows.set(container.id, {
      boxes: 0,
      id: container.id,
      name: container.barcode,
      products: new Set<string>(),
      units: 0,
      volume: 0,
    })
  }

  for (const line of store.remainingLines) {
    if (line.remainingQuantity <= 0) continue
    const product = productsById.get(line.productId)
    const row = rows.get(line.containerId)
    if (!product || !row) continue
    row.products.add(product.id)
    row.units += line.remainingQuantity
    row.boxes += line.remainingQuantity / product.unitsPerBox
    row.volume += line.remainingQuantity * product.unitVolumeM3
  }

  return [...rows.values()]
    .map(({ products, ...row }) => ({ ...row, sku: products.size }))
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

export function filteredSourceRows(store: ShipmentStore) {
  const productsById = new Map(store.data.products.map((product) => [product.id, product]))
  const containersById = new Map(
    store.data.containers.map((container) => [container.id, container]),
  )

  return store.filteredRemainingLines
    .map((line) => {
      const product = productsById.get(line.productId)
      const container = containersById.get(line.containerId)
      if (!product || !container) return null
      return {
        boxes: line.remainingQuantity / product.unitsPerBox,
        code: product.code,
        container: container.barcode,
        id: line.id,
        name: product.name,
        units: line.remainingQuantity,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.code.localeCompare(b.code) || a.container.localeCompare(b.container))
}

export function transportPlaceRows(store: ShipmentStore) {
  const productsById = new Map(store.data.products.map((product) => [product.id, product]))
  const sourceLinesById = new Map(store.data.sourceLines.map((line) => [line.id, line]))
  const rows = new Map<
    string,
    {
      boxes: number
      id: string
      name: string
      products: Set<string>
      sequence: number
      units: number
      volume: number
    }
  >()

  for (const transportPlace of store.data.transportPlaces) {
    rows.set(transportPlace.id, {
      boxes: 0,
      id: transportPlace.id,
      name: transportPlace.number,
      products: new Set<string>(),
      sequence: transportPlace.sequence,
      units: 0,
      volume: 0,
    })
  }

  for (const allocation of store.data.allocationLines) {
    if (allocation.quantity <= 0) continue
    const row = rows.get(allocation.transportPlaceId)
    const sourceLine = sourceLinesById.get(allocation.sourceLineId)
    const product = sourceLine ? productsById.get(sourceLine.productId) : undefined
    if (!row || !product) continue
    row.products.add(product.id)
    row.units += allocation.quantity
    row.boxes += allocation.quantity / product.unitsPerBox
    row.volume += allocation.quantity * product.unitVolumeM3
  }

  return [...rows.values()]
    .map(({ products, ...row }) => ({ ...row, sku: products.size }))
    .sort((a, b) => a.sequence - b.sequence)
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
