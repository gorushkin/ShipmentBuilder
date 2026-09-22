import { useEffect, useState } from 'react'

import { observer } from 'mobx-react-lite'

import { createDemoData, createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentDataStore } from '@/domain/shipment/shipment-data-store'
import { ShipmentStore } from '@/domain/shipment/shipment-store'
import { BarcodeInput } from '@/features/barcode-input'
import { BarcodeInputAdapter, BarcodeResolver, ScanMachine } from '@/features/scan-machine'
import { loadDemoShipmentSnapshot, ScannerWorkflowOrchestrator } from '@/features/scanner-workflow'

import { DistributionStatus } from './distribution-status'
import { DistributionWorkspace } from './distribution-workspace'
import { OrderSummary } from './order-summary'
import { RemainingSummary } from './remaining-summary'
import { ShipmentHeader } from './shipment-header'
import './shipment.css'

export const ShipmentPage = observer(function ShipmentPage() {
  const [data] = useState(() =>
    new URLSearchParams(window.location.search).get('scenario') === 'large'
      ? createLargeDemoData()
      : createDemoData(),
  )
  const [store] = useState(
    () => new ShipmentStore(data),
  )
  const [scanMachine] = useState(() => new ScanMachine())
  const [shipmentDataStore] = useState(() => new ShipmentDataStore())
  const [workflowOrchestrator] = useState(
    () => new ScannerWorkflowOrchestrator(scanMachine, shipmentDataStore, loadDemoShipmentSnapshot),
  )
  const [barcodeInputAdapter] = useState(
    () => new BarcodeInputAdapter(new BarcodeResolver(data), scanMachine),
  )
  useEffect(() => {
    workflowOrchestrator.start()
    return () => workflowOrchestrator.dispose()
  }, [workflowOrchestrator])
  return (
    <main className="shipment-page">
      <ShipmentHeader />
      <BarcodeInput
        feedback={scanMachine.feedback.message}
        isProcessing={scanMachine.isTransferring}
        onCompleted={(value) => barcodeInputAdapter.submit(value)}
      />
      <OrderSummary store={store} />
      <DistributionStatus />
      <DistributionWorkspace scanMachine={scanMachine} store={store} />
      <RemainingSummary store={store} />
    </main>
  )
})
