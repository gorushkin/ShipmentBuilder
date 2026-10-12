import { Package } from 'lucide-react'

export function ShipmentHeaderBrand() {
  return (
    <div className="grid w-max max-w-full grid-cols-[36px_auto] items-center gap-3">
      <div className="grid size-9 place-items-center rounded-lg border border-primary-border bg-primary-soft text-primary">
        <Package aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-[20px] leading-[1.25] font-[650] tracking-[-0.6px] whitespace-nowrap">
          Формирование транспортных мест
        </h1>
      </div>
    </div>
  )
}
