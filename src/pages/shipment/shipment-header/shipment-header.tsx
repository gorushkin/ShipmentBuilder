import { ShipmentHeaderActions } from './shipment-header-actions'
import { ShipmentHeaderBrand } from './shipment-header-brand'

export function ShipmentHeader() {
  return (
    <header className="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-6">
      <ShipmentHeaderBrand />
      <ShipmentHeaderActions />
    </header>
  )
}
