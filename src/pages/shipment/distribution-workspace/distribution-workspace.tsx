import { DestinationPanel, SourcePanel, TransferActions } from './panels'

export function DistributionWorkspace() {
  return (
    <div className="workspace">
      <SourcePanel />
      <TransferActions />
      <DestinationPanel />
    </div>
  )
}
