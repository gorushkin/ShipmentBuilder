import { observer } from 'mobx-react-lite'

import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'
import { Metrics } from '@/pages/shipment/summary'
export const RemainingSummary = observer(function RemainingSummary() {
  return (
    <footer className="grid grid-cols-[180px_1fr] items-center gap-6 rounded-lg border border-[#dce7fb] bg-selection px-5 py-2">
      <h2 className="text-[14px] font-[650] text-[#365487]">К распределению</h2>
      <Metrics remaining totals={store.remainingTotals} />
    </footer>
  )
})
