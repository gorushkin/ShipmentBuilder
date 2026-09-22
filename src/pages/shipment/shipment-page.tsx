import { useEffect, useState } from 'react'

import { observer } from 'mobx-react-lite'

import { ShipmentStore } from '@/domain/shipment/shipment-store'
import { BarcodeInput } from '@/features/barcode-input'
import {
  barcodeInputAdapter,
  scanMachine,
  scannerWorkflowOrchestrator,
  shipmentDemoData,
} from '@/features/scanner-workflow'

import { DistributionStatus } from './distribution-status'
import { DistributionWorkspace } from './distribution-workspace'
import { OrderSummary } from './order-summary'
import { RemainingSummary } from './remaining-summary'
import { ShipmentHeader } from './shipment-header'
import './shipment.css'

export const ShipmentPage = observer(function ShipmentPage() {
  const [store] = useState(() => new ShipmentStore(shipmentDemoData))
  useEffect(() => {
    scannerWorkflowOrchestrator.start()
    return () => scannerWorkflowOrchestrator.dispose()
  }, [])
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
      <DistributionWorkspace store={store} />
      <RemainingSummary store={store} />
    </main>
  )
})
