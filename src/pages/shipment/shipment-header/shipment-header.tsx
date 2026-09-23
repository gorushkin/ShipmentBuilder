import { ShipmentHeaderActions } from './shipment-header-actions'
import { ShipmentHeaderBrand } from './shipment-header-brand'
import './shipment-header.css'

export function ShipmentHeader() {
  return (
    <header className="page-header">
      <ShipmentHeaderBrand />
      <ShipmentHeaderActions />
    </header>
  )
}
