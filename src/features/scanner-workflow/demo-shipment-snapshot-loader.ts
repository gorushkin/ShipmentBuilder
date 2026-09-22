import { createDemoData } from '@/domain/shipment/demo-data'

import type { ShipmentSnapshotLoader } from './scanner-workflow-orchestrator'

export const loadDemoShipmentSnapshot: ShipmentSnapshotLoader = () => Promise.resolve(createDemoData())
