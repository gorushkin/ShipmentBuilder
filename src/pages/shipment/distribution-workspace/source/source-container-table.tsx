import { Box } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SourceContainerTableRow } from '@/features/scanner-workflow'
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
        {['Контейнер', 'SKU', 'ЧЗ', 'ШТ', 'Кол-во мест', 'Объём, м³'].map((label) => (
          <TableHead className={tableHeadClassName} scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function SourceContainerTable({
  onSelect,
  rows,
  selectedContainerId,
}: {
  onSelect: (containerId: string) => void
  rows: SourceContainerTableRow[]
  selectedContainerId: null | string
}) {
  return (
    <Table
      containerClassName="overflow-visible"
      className="tabular-nums"
      aria-label="Контейнеры отбора"
    >
      <ShipmentTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow
            aria-selected={selectedContainerId === row.id}
            className={selectableRowClassName}
            data-active={selectedContainerId === row.id}
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
                <Box className="size-4 text-[#6582b3]" aria-hidden="true" />
                {row.name}
              </span>
            </TableCell>
            <TableCell className={tableCellClassName}>{row.sku}</TableCell>
            <TableCell className={tableCellClassName}>{row.isMarked ? 'Да' : 'Нет'}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.units, 0)}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.boxes)}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.volume, 4)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
