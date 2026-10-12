import { cn } from 'cn'

import type { ShipmentTotals } from '@/domain/shipment/types'

import { number } from './shared/format'

export function Metrics({
  remaining = false,
  totals,
}: {
  remaining?: boolean
  totals: ShipmentTotals
}) {
  const items = [
    ['Контейнеров', number(totals.containers, 0)],
    ['SKU', number(totals.sku, 0)],
    ['Штук', number(totals.units, 0)],
    ['Кол-во мест', number(totals.boxes)],
    ['Вес', `${number(totals.weightKg)} кг`],
    ['Объём', `${number(totals.volumeM3, 4)} м³`],
  ]

  return (
    <dl className="m-0 grid grid-cols-6 gap-3.5 [@media(max-width:1300px)]:gap-2.5">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="mb-1.5 text-[11px] text-subtle-foreground">{label}</dt>
          <dd
            className={cn(
              'font-semibold whitespace-nowrap tabular-nums',
              remaining
                ? 'text-[15px]'
                : 'text-base leading-normal [@media(max-width:1300px)]:text-[14px]',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
