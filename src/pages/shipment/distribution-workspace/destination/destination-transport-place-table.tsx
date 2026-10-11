import { Layers } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DestinationTransportPlaceTableRow } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'
import {
  selectableRowClassName,
  tableHeadClassName,
  tableCellClassName,
} from '@/pages/shipment/shared/table-styles'

function ShipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['ТМ', 'SSCC', 'SKU', 'ЧЗ', 'ШТ', 'Кол-во мест', 'Объём, м³'].map((label) => (
          <TableHead className={tableHeadClassName} scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function DestinationTransportPlaceTable({
  onSelect,
  rows,
}: {
  onSelect: (transportPlaceId: string) => void
  rows: DestinationTransportPlaceTableRow[]
}) {
  return (
    <>
      <Table
        containerClassName="overflow-visible"
        className="tabular-nums"
        aria-label="Транспортные места"
      >
        <ShipmentTableHeader />
        <TableBody>
          {rows.map((row) => (
            <TableRow
              aria-selected={row.isActive}
              className={selectableRowClassName}
              data-active={row.isActive}
              key={row.id}
              onClick={() => onSelect(row.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(row.id)
                }
              }}
              tabIndex={0}
            >
              <TableCell className={tableCellClassName}>
                <span className="grid grid-cols-[17px_auto] items-center justify-start gap-2 font-semibold">
                  <Layers className="size-4 text-[#6582b3]" aria-hidden="true" />
                  {row.name}
                </span>
              </TableCell>
              <TableCell className={tableCellClassName}>---</TableCell>
              <TableCell className={tableCellClassName}>{row.sku}</TableCell>
              <TableCell className={tableCellClassName}>{row.isMarked ? 'Да' : 'Нет'}</TableCell>
              <TableCell className={tableCellClassName}>{number(row.units, 0)}</TableCell>
              <TableCell className={tableCellClassName}>{number(row.boxes)}</TableCell>
              <TableCell className={tableCellClassName}>{number(row.volume, 4)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <div className="grid content-center justify-items-center gap-3 p-6 text-center">
          <div className="mb-1 grid size-15 place-items-center rounded-[18px] bg-[#f0f4fb] text-[#9aaac3] [&>svg]:size-7 [&>svg]:text-inherit">
            <Layers className="size-4 text-[#6582b3]" aria-hidden="true" />
          </div>
          <h3 className="text-[14px] leading-[1.6] font-semibold text-[#59677e]">
            Транспортные места
            <br />
            ещё не созданы
          </h3>
          <p className="text-xs leading-[1.7] text-[#8a95a6]">
            Здесь появятся места
            <br />
            для упаковки товаров заказа
          </p>
        </div>
      )}
    </>
  )
}
