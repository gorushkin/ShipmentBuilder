import { observer } from 'mobx-react-lite'

import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'
import { Metrics } from '@/pages/shipment/summary'
export const RemainingSummary = observer(function RemainingSummary() {
  return (
    <footer className="grid grid-cols-[180px_1fr] items-center gap-6 rounded-lg border border-[#dce7fb] bg-selection px-5 py-4">
      <div>
        <span className="text-[10px] font-[650] tracking-[1.2px] text-subtle-foreground">
          ОСТАЛОСЬ
        </span>
        <h2 className="mt-1 text-[14px] font-[650] text-[#365487]">К распределению</h2>
      </div>
      <Metrics remaining totals={store.remainingTotals} />
    </footer>
  )
})
