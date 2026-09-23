import type { ShipmentData } from './types'

/** Каждый вызов создаёт независимый набор демонстрационных данных. */
export function createDemoData(): ShipmentData {
  return {
    aggregationCodes: [
      { id: 'A01', markingCodeIds: ['M01', 'M02', 'M03', 'M04'], value: 'DEMO-KA-001' },
      { id: 'A02', markingCodeIds: ['M05', 'M06', 'M07', 'M08'], value: 'DEMO-KA-002' },
      { id: 'A03', markingCodeIds: ['M09', 'M10'], value: 'DEMO-KA-003' },
    ],
    allocationLines: [],
    containers: [
      { barcode: 'N00001', id: 'C1', orderId: 'ORD-001', scanBarcode: 'C1' },
      { barcode: 'N00002', id: 'C2', orderId: 'ORD-001', scanBarcode: 'C2' },
      { barcode: 'N00003', id: 'C3', orderId: 'ORD-001', scanBarcode: 'C3' },
    ],
    markingCodes: Array.from({ length: 12 }, (_, index) => {
      const number = index + 1
      return {
        id: `M${String(number).padStart(2, '0')}`,
        sourceLineId: number <= 8 ? 'L4' : 'L6',
        value: `DEMO-KM-${String(number).padStart(3, '0')}`,
      }
    }),
    order: {
      clientName: 'Демо-клиент',
      controlStatus: 'checked',
      id: 'ORD-001',
      number: '1000000001',
    },
    products: [
      {
        barcode: 'DEMO-P-10001',
        code: '10001',
        id: 'P1',
        isMarked: false,
        name: 'Розетка IP54',
        scanBarcode: 'P1',
        unitsPerBox: 10,
        unitVolumeM3: 0.001,
        unitWeightKg: 0.2,
      },
      {
        barcode: 'DEMO-P-10002',
        code: '10002',
        id: 'P2',
        isMarked: false,
        name: 'Выключатель',
        scanBarcode: 'P2',
        unitsPerBox: 5,
        unitVolumeM3: 0.0005,
        unitWeightKg: 0.1,
      },
      {
        barcode: 'DEMO-P-10003',
        code: '10003',
        id: 'P3',
        isMarked: true,
        name: 'Товар с маркировкой А',
        scanBarcode: 'P3',
        unitsPerBox: 4,
        unitVolumeM3: 0.002,
        unitWeightKg: 0.5,
      },
      {
        barcode: 'DEMO-P-10004',
        code: '10004',
        id: 'P4',
        isMarked: true,
        name: 'Товар с маркировкой Б',
        scanBarcode: 'P4',
        unitsPerBox: 2,
        unitVolumeM3: 0.001,
        unitWeightKg: 0.25,
      },
    ],
    sourceLines: [
      { containerId: 'C1', id: 'L1', productId: 'P1', quantity: 10 },
      { containerId: 'C1', id: 'L2', productId: 'P2', quantity: 5 },
      { containerId: 'C2', id: 'L3', productId: 'P1', quantity: 15 },
      { containerId: 'C2', id: 'L4', productId: 'P3', quantity: 8 },
      { containerId: 'C3', id: 'L5', productId: 'P2', quantity: 2 },
      { containerId: 'C3', id: 'L6', productId: 'P4', quantity: 4 },
    ],
    transportPlaces: [
      {
        barcode: 'TM1',
        id: 'ORD-001-TP-001',
        number: 'ТМ-001',
        orderId: 'ORD-001',
        scanBarcode: 'TM1',
        sequence: 1,
      },
    ],
  }
}

/**
 * Набор для ручной проверки объёмного заказа.
 *
 * В заказе ровно 1 000 SKU, по две товарные строки в каждом из 500 контейнеров
 * и 500 уже созданных транспортных мест. Первая половина товарных строк
 * распределена по ТМ, поэтому в интерфейсе можно проверить и остатки, и места.
 */
export function createLargeDemoData(): ShipmentData {
  const orderId = 'ORD-LARGE-001'
  const skuCount = 1000
  const containerCount = 500
  const transportPlaceCount = 500
  const products = Array.from({ length: skuCount }, (_, index) => {
    const number = index + 1
    const suffix = String(number).padStart(4, '0')
    return {
      barcode: `LARGE-P-${suffix}`,
      code: `SKU-${suffix}`,
      id: `P${suffix}`,
      isMarked: number % 10 === 0,
      name: `Тестовый товар ${suffix}`,
      scanBarcode: `P${number}`,
      unitsPerBox: 10,
      unitVolumeM3: 0.001,
      unitWeightKg: 0.2,
    }
  })
  const containers = Array.from({ length: containerCount }, (_, index) => {
    const number = index + 1
    const suffix = String(number).padStart(3, '0')
    return { barcode: `N-LARGE-${suffix}`, id: `C${suffix}`, orderId, scanBarcode: `C${number}` }
  })
  const sourceLines = products.map((product, index) => {
    const suffix = String(index + 1).padStart(4, '0')
    return {
      containerId: containers[Math.floor(index / 2)].id,
      id: `L${suffix}`,
      productId: product.id,
      quantity: 10,
    }
  })
  const transportPlaces = Array.from({ length: transportPlaceCount }, (_, index) => {
    const number = index + 1
    const suffix = String(number).padStart(3, '0')
    return {
      barcode: `TM${number}`,
      id: `${orderId}-TP-${suffix}`,
      number: `ТМ-${suffix}`,
      orderId,
      scanBarcode: `TM${number}`,
      sequence: number,
    }
  })
  const allocationLines = transportPlaces.map((transportPlace, index) => ({
    id: `${transportPlace.id}-L${String(index + 1).padStart(4, '0')}-allocation`,
    quantity: 10,
    sourceLineId: sourceLines[index].id,
    transportPlaceId: transportPlace.id,
  }))

  return {
    aggregationCodes: [],
    allocationLines,
    containers,
    markingCodes: [],
    order: {
      clientName: 'Тестовый клиент: большой заказ',
      controlStatus: 'checked',
      id: orderId,
      number: '9000000001',
    },
    products,
    sourceLines,
    transportPlaces,
  }
}
