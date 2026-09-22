import { useState } from 'react'

import { createLargeDemoData } from '@/domain/shipment/demo-data'
import { ShipmentStore } from '@/domain/shipment/shipment-store'

import { DistributionStatus } from './distribution-status'
import { DistributionWorkspace } from './distribution-workspace'
import { OrderSummary } from './order-summary'
import { RemainingSummary } from './remaining-summary'
import { ShipmentHeader } from './shipment-header'
import './shipment.css'

export function ShipmentPage() {
  const [store] = useState(() =>
    new ShipmentStore(
      new URLSearchParams(window.location.search).get('scenario') === 'large'
        ? createLargeDemoData()
        : undefined,
    ),
  )
  return (
    <main className="shipment-page">
      <ShipmentHeader />
      <OrderSummary store={store} />
      <DistributionStatus />
      <DistributionWorkspace store={store} />
      <RemainingSummary store={store} />
    </main>
  )
}
