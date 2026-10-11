import { Package } from 'lucide-react'

export function ShipmentHeaderBrand() {
  return (
    <div className="grid w-max max-w-full grid-cols-[44px_auto] items-center gap-3.5">
      <div className="grid h-12 w-11 place-items-center rounded-xl border border-primary-border bg-primary-soft text-primary">
        <Package aria-hidden="true" />
      </div>
      <div>
        <span className="text-[10px] font-[650] tracking-[1.2px] text-subtle-foreground">
          ПОДГОТОВКА К ОТГРУЗКЕ
        </span>
        <h1 className="text-[23px] leading-[1.25] font-[650] tracking-[-0.6px] whitespace-nowrap">
          Формирование транспортных мест
        </h1>
      </div>
    </div>
  )
}
