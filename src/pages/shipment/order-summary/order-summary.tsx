import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ShipmentStore } from '@/domain/shipment/shipment-store'
import { number } from '@/pages/shipment/shared/format'
import { Metrics } from '@/pages/shipment/summary'
export const OrderSummary = observer(function OrderSummary({ store }: { store: ShipmentStore }) { return <section className="order-summary" aria-label="Сведения о заказе"><div className="order-identity"><span className="eyebrow">ЗАКАЗ</span><strong>{store.data.order.number}</strong><span>{store.data.order.clientName}</span></div><Metrics totals={store.orderTotals} /><div className="progress-block"><div><span>Прогресс распределения</span><Badge variant="outline" className="progress-value">{number(store.distributionProgress, 1)}%</Badge></div><Progress aria-label="Прогресс распределения" value={store.distributionProgress} /><small>{number(store.distributedUnits, 0)} из {number(store.orderTotals.units, 0)} шт. распределено</small></div></section> })
