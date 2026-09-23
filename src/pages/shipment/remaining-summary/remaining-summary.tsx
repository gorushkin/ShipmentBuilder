import { observer } from 'mobx-react-lite'

import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'
import { Metrics } from '@/pages/shipment/summary'
export const RemainingSummary = observer(function RemainingSummary() {
  return (
    <footer className="remaining-summary">
      <div>
        <span className="eyebrow">ОСТАЛОСЬ</span>
        <h2>К распределению</h2>
      </div>
      <Metrics totals={store.remainingTotals} />
    </footer>
  )
})
