import { TooltipProvider } from '@/components/ui/tooltip'
import { ShipmentPage } from '@/pages/shipment/shipment-page'

export default function App() {
  return (
    <TooltipProvider delay={300}>
      <ShipmentPage />
    </TooltipProvider>
  )
}
