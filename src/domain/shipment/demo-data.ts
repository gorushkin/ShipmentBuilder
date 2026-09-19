import type { ShipmentData } from './types'

/** Каждый вызов создаёт независимый набор демонстрационных данных. */
export function createDemoData(): ShipmentData {
  return {
    order: {
      id: 'ORD-001',
      number: '1000000001',
      clientName: 'Демо-клиент',
      controlStatus: 'checked',
    },
    products: [
      {
        id: 'P1', code: '10001', name: 'Розетка IP54',
        barcode: 'DEMO-P-10001', unitsPerBox: 10,
        unitWeightKg: 0.2, unitVolumeM3: 0.001, isMarked: false,
      },
      {
        id: 'P2', code: '10002', name: 'Выключатель',
        barcode: 'DEMO-P-10002', unitsPerBox: 5,
        unitWeightKg: 0.1, unitVolumeM3: 0.0005, isMarked: false,
      },
      {
        id: 'P3', code: '10003', name: 'Товар с маркировкой А',
        barcode: 'DEMO-P-10003', unitsPerBox: 4,
        unitWeightKg: 0.5, unitVolumeM3: 0.002, isMarked: true,
      },
      {
        id: 'P4', code: '10004', name: 'Товар с маркировкой Б',
        barcode: 'DEMO-P-10004', unitsPerBox: 2,
        unitWeightKg: 0.25, unitVolumeM3: 0.001, isMarked: true,
      },
    ],
    containers: [
      { id: 'C1', orderId: 'ORD-001', barcode: 'N00001' },
      { id: 'C2', orderId: 'ORD-001', barcode: 'N00002' },
      { id: 'C3', orderId: 'ORD-001', barcode: 'N00003' },
    ],
    sourceLines: [
      { id: 'L1', containerId: 'C1', productId: 'P1', quantity: 10 },
      { id: 'L2', containerId: 'C1', productId: 'P2', quantity: 5 },
      { id: 'L3', containerId: 'C2', productId: 'P1', quantity: 15 },
      { id: 'L4', containerId: 'C2', productId: 'P3', quantity: 8 },
      { id: 'L5', containerId: 'C3', productId: 'P2', quantity: 2 },
      { id: 'L6', containerId: 'C3', productId: 'P4', quantity: 4 },
    ],
    transportPlaces: [],
    allocationLines: [],
    markingCodes: Array.from({ length: 12 }, (_, index) => {
      const number = index + 1
      return {
        id: `M${String(number).padStart(2, '0')}`,
        value: `DEMO-KM-${String(number).padStart(3, '0')}`,
        sourceLineId: number <= 8 ? 'L4' : 'L6',
      }
    }),
    aggregationCodes: [
      { id: 'A01', value: 'DEMO-KA-001', markingCodeIds: ['M01', 'M02', 'M03', 'M04'] },
      { id: 'A02', value: 'DEMO-KA-002', markingCodeIds: ['M05', 'M06', 'M07', 'M08'] },
      { id: 'A03', value: 'DEMO-KA-003', markingCodeIds: ['M09', 'M10'] },
    ],
  }
}
