import { useState } from 'react'

import { CheckCircle2, Package, Printer, Send } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShipmentStore } from '@/domain/shipment/shipment-store'

import { DestinationPanel, SourcePanel, TransferActions } from './panels'
import { OrderSummary, RemainingSummary } from './summary'
import './shipment.css'
import { UnavailableButton } from './unavailable-control'

const actions = [
  'Получить SSCC',
  'Получить маркировки',
  'Отправка ТМ в 1С',
  'Повторная отправка',
  'Печать этикетки ТМ',
  'Печать паллетной этикетки',
  'Печать маркировок',
  'Повторная печать',
]

export function ShipmentPage() {
  const [store] = useState(() => new ShipmentStore())
  return (
    <main className="shipment-page">
      <header className="page-header">
        <div className="page-heading">
          <div className="app-icon">
            <Package aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">ПОДГОТОВКА К ОТГРУЗКЕ</span>
            <h1>
              Формирование
              <br />
              транспортных мест
            </h1>
          </div>
        </div>
        <div className="order-actions" aria-label="Обмен и печать">
          {actions.map((label, index) => (
            <UnavailableButton variant="outline" size="sm" key={label}>
              {index < 4 ? <Send /> : <Printer />}
              {label}
            </UnavailableButton>
          ))}
        </div>
      </header>
      <OrderSummary store={store} />
      <Alert className="guidance" role="status">
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Заказ проверен.</AlertTitle>
        <AlertDescription>Товары ожидают распределения</AlertDescription>
      </Alert>
      <div className="workspace">
        <SourcePanel store={store} />
        <TransferActions />
        <DestinationPanel />
      </div>
      <RemainingSummary store={store} />
    </main>
  )
}
