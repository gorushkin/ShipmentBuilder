import { Box } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SourceProductTableRow } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'
import {
  selectableRowClassName,
  tableHeadClassName,
  tableCellClassName,
} from '@/pages/shipment/shared/table-styles'

function ProductTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['Код товара', 'Наименование', 'ЧЗ', 'ШТ', 'Кол-во мест', 'Контейнеров'].map((label) => (
          <TableHead className={tableHeadClassName} scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function SourceProductTable({
  onSelect,
  rows,
  selectedProductId,
}: {
  onSelect: (row: SourceProductTableRow) => void
  rows: SourceProductTableRow[]
  selectedProductId: null | string
}) {
  if (rows.length === 0) {
    return (
      <div className="grid min-h-full content-center justify-items-center gap-3 p-6 text-center">
        <div className="mb-1 grid size-15 place-items-center rounded-[18px] bg-[#f0f4fb] text-[#9aaac3] [&>svg]:size-7 [&>svg]:text-inherit">
          <Box className="size-4 text-[#6582b3]" aria-hidden="true" />
        </div>
        <h3 className="text-[14px] leading-[1.6] font-semibold text-[#59677e]">
          Все товары распределены
        </h3>
      </div>
    )
  }

  return (
    <Table
      containerClassName="overflow-visible"
      className="tabular-nums"
      aria-label="Товары к распределению"
    >
      <ProductTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow
            aria-selected={selectedProductId === row.id}
            className={selectableRowClassName}
            data-active={selectedProductId === row.id}
            key={row.id}
            onClick={() => onSelect(row)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(row)
              }
            }}
            tabIndex={0}
          >
            <TableCell className={tableCellClassName}>{row.code}</TableCell>
            <TableCell className={tableCellClassName}>{row.name}</TableCell>
            <TableCell className={tableCellClassName}>{row.isMarked ? 'Да' : 'Нет'}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.units, 0)}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.boxes)}</TableCell>
            <TableCell className={tableCellClassName}>
              {row.containerName ?? number(row.containers, 0)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
