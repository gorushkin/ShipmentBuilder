import type { ShipmentStore } from '@/domain/shipment/shipment-store'
import type { ScanMachine } from '@/features/scan-machine'

import { DestinationPanel, SourcePanel, TransferActions } from './panels'

export function DistributionWorkspace({
  scanMachine,
  store,
}: {
  scanMachine: ScanMachine
  store: ShipmentStore
}) {
  return (
    <div className="workspace">
      <SourcePanel scanMachine={scanMachine} store={store} />
      <TransferActions store={store} />
      <DestinationPanel scanMachine={scanMachine} store={store} />
    </div>
  )
}
