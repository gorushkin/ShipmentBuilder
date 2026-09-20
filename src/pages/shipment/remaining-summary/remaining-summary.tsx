import { observer } from 'mobx-react-lite'

import type { ShipmentStore } from '@/domain/shipment/shipment-store'
import { Metrics } from '@/pages/shipment/summary'
export const RemainingSummary = observer(function RemainingSummary({ store }: { store: ShipmentStore }) { return <footer className="remaining-summary"><div><span className="eyebrow">ОСТАЛОСЬ</span><h2>К распределению</h2></div><Metrics totals={store.remainingTotals} /></footer> })
