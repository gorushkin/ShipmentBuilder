import { useState } from 'react'

import { createDemoData, createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentStore } from '@/domain/shipment/shipment-store'
import { BarcodeInput } from '@/features/barcode-input'
import { BarcodeInputAdapter, BarcodeResolver, ScanMachine } from '@/features/scan-machine'

import { DistributionStatus } from './distribution-status'
import { DistributionWorkspace } from './distribution-workspace'
import { OrderSummary } from './order-summary'
import { RemainingSummary } from './remaining-summary'
import { ShipmentHeader } from './shipment-header'
import './shipment.css'

export function ShipmentPage() {
  const [data] = useState(() =>
    new URLSearchParams(window.location.search).get('scenario') === 'large'
      ? createLargeDemoData()
      : createDemoData(),
  )
  const [store] = useState(
    () => new ShipmentStore(data),
  )
  const [scanMachine] = useState(() => new ScanMachine())
  const [barcodeInputAdapter] = useState(
    () => new BarcodeInputAdapter(new BarcodeResolver(data), scanMachine),
  )
  return (
    <main className="shipment-page">
      <ShipmentHeader />
      <BarcodeInput
        machine={scanMachine}
        onCompleted={(value) => barcodeInputAdapter.submit(value)}
      />
      <OrderSummary store={store} />
      <DistributionStatus />
      <DistributionWorkspace scanMachine={scanMachine} store={store} />
      <RemainingSummary store={store} />
    </main>
  )
}
