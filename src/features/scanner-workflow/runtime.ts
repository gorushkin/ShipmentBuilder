import { createDemoData, createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { shadcnToastAlertService } from '@/features/application-alerts'
import { BarcodeInputAdapter, BarcodeResolver, ScanMachine } from '@/features/scan-machine'

import { ScannerWorkflowOrchestrator } from './scanner-workflow-orchestrator'

function createCurrentDemoData() {
  const scenario =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('scenario')
  return scenario === 'large' ? createLargeDemoData() : createDemoData()
}

export const shipmentDemoData = createCurrentDemoData()
export const scanMachine = new ScanMachine()
export const shipmentDataStore = new ShipmentDataStore()
export const scannerWorkflowOrchestrator = new ScannerWorkflowOrchestrator(
  scanMachine,
  shipmentDataStore,
  () => Promise.resolve(shipmentDemoData),
  shadcnToastAlertService,
)
export const barcodeInputAdapter = new BarcodeInputAdapter(
  new BarcodeResolver(() => shipmentDataStore.data),
  scannerWorkflowOrchestrator,
)
