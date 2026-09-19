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
      { barcode: 'N00001', id: 'C1', orderId: 'ORD-001' },
      { barcode: 'N00002', id: 'C2', orderId: 'ORD-001' },
      { barcode: 'N00003', id: 'C3', orderId: 'ORD-001' },
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
    transportPlaces: [],
  }
}
