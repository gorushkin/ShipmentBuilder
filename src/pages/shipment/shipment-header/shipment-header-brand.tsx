import { Package } from 'lucide-react'

export function ShipmentHeaderBrand() {
  return (
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
  )
}
