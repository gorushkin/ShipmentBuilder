import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'
import { Metrics } from '@/pages/shipment/summary'
export const OrderSummary = observer(function OrderSummary() {
  return (
    <section
      className="grid grid-cols-[180px_minmax(0,1fr)_230px] items-center gap-[22px] rounded-lg border border-summary-border bg-card p-5 [@media(max-width:1300px)]:grid-cols-[150px_1fr_190px] [@media(max-width:1300px)]:gap-3.5 [@media(max-width:1300px)]:p-4"
      aria-label="Сведения о заказе"
    >
      <div className="grid gap-1 border-r border-divider">
        <span className="text-[10px] font-[650] tracking-[1.2px] text-subtle-foreground">
          ЗАКАЗ
        </span>
        <strong className="text-[18px] tracking-[0.3px]">{store.order?.number ?? '—'}</strong>
        <span className="text-xs leading-normal text-muted-foreground">
          {store.order?.clientName ?? 'Загрузка…'}
        </span>
      </div>
      <Metrics totals={store.orderTotals} />
      <div className="grid gap-2 border-l border-divider pl-5">
        <div className="grid grid-cols-[1fr_auto] text-[11px]">
          <span>Прогресс распределения</span>
          <Badge variant="outline" className="border-primary-border bg-[#f7f9ff] text-primary">
            {number(store.distributionProgress, 1)}%
          </Badge>
        </div>
        <Progress
          className="gap-0 [&_[data-slot=progress-track]]:bg-progress-track"
          aria-label="Прогресс распределения"
          value={store.distributionProgress}
        />
        <small className="text-[10px] text-subtle-foreground">
          {number(store.distributedUnits, 0)} из {number(store.orderTotals.units, 0)} шт.
          распределено
        </small>
      </div>
    </section>
  )
})
