import { Package, Printer, Send } from 'lucide-react'

import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

import './shipment-header.css'
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
export function ShipmentHeader() {
  return (
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
  )
}
