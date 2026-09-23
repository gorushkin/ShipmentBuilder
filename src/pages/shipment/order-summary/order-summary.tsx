import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'
import { Metrics } from '@/pages/shipment/summary'
export const OrderSummary = observer(function OrderSummary() {
  return (
    <section className="order-summary" aria-label="Сведения о заказе">
      <div className="order-identity">
        <span className="eyebrow">ЗАКАЗ</span>
        <strong>{store.order?.number ?? '—'}</strong>
        <span>{store.order?.clientName ?? 'Загрузка…'}</span>
      </div>
      <Metrics totals={store.orderTotals} />
      <div className="progress-block">
        <div>
          <span>Прогресс распределения</span>
          <Badge variant="outline" className="progress-value">
            {number(store.distributionProgress, 1)}%
          </Badge>
        </div>
        <Progress aria-label="Прогресс распределения" value={store.distributionProgress} />
        <small>
          {number(store.distributedUnits, 0)} из {number(store.orderTotals.units, 0)} шт.
          распределено
        </small>
      </div>
    </section>
  )
})
