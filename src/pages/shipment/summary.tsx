import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ShipmentTotals } from '@/domain/shipment/types'
import { scannerWorkflowOrchestrator as store } from '@/features/scanner-workflow'

import { number } from './shared/format'

export function Metrics({ totals }: { totals: ShipmentTotals }) {
  const items = [
    ['Контейнеров', number(totals.containers, 0)],
    ['SKU', number(totals.sku, 0)],
    ['Штук', number(totals.units, 0)],
    ['Коробов', number(totals.boxes)],
    ['Вес', `${number(totals.weightKg)} кг`],
    ['Объём', `${number(totals.volumeM3, 4)} м³`],
  ]
  return (
    <dl className="metrics">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

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
