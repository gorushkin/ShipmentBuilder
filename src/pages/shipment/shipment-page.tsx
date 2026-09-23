import { useEffect } from 'react'

import { observer } from 'mobx-react-lite'

import { Toaster } from '@/components/ui/toast'
import { getActionPanelStatus } from '@/features/action-panel-status'
import { BarcodeInput } from '@/features/barcode-input'
import {
  barcodeInputAdapter,
  scanMachine,
  scannerWorkflowOrchestrator,
} from '@/features/scanner-workflow'

import { DistributionStatus } from './distribution-status'
import { DistributionWorkspace } from './distribution-workspace'
import { OrderSummary } from './order-summary'
import { RemainingSummary } from './remaining-summary'
import { ShipmentHeader } from './shipment-header'
import './shipment.css'

export const ShipmentPage = observer(function ShipmentPage() {
  useEffect(() => {
    scannerWorkflowOrchestrator.start()
    return () => scannerWorkflowOrchestrator.dispose()
  }, [])
  const actionStatus = getActionPanelStatus({
    activeTransportPlaceId: scanMachine.activeTransportPlaceId,
    feedback: scanMachine.feedback,
    hasRemainingItems: scannerWorkflowOrchestrator.remainingTotals.units > 0,
    hasSnapshot: scannerWorkflowOrchestrator.hasSnapshot,
    step: scanMachine.step,
  })
  return (
    <>
      <main className="shipment-page">
        <ShipmentHeader />
        <BarcodeInput
          actionStatus={actionStatus}
          isProcessing={scanMachine.isTransferring}
          onCancel={() => scannerWorkflowOrchestrator.command('cancel')}
          onCompleted={(value) => barcodeInputAdapter.submit(value)}
        />
        <OrderSummary />
        <DistributionStatus />
        <DistributionWorkspace />
        <RemainingSummary />
      </main>
      <Toaster />
    </>
  )
})
