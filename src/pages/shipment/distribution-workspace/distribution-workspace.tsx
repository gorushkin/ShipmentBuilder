import { DestinationPanel, SourcePanel, TransferActions } from './panels'

export function DistributionWorkspace() {
  return (
    <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_210px_minmax(0,1fr)] gap-3.5">
      <SourcePanel />
      <TransferActions />
      <DestinationPanel />
    </div>
  )
}
