import type { ShipmentStore } from '@/domain/shipment/shipment-store'

import { DestinationPanel, SourcePanel, TransferActions } from './panels'

export function DistributionWorkspace({ store }: { store: ShipmentStore }) {
  return (
    <div className="workspace">
      <SourcePanel store={store} />
      <TransferActions store={store} />
      <DestinationPanel store={store} />
    </div>
  )
}
