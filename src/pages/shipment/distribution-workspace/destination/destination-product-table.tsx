import { Box } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { scannerWorkflowOrchestrator } from '@/features/scanner-workflow'
import type { DestinationProductTableRow } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'
import {
  selectableRowClassName,
  tableHeadClassName,
  tableCellClassName,
} from '@/pages/shipment/shared/table-styles'

function TransportPlaceProductTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['Код товара', 'Наименование', 'ЧЗ', 'ШТ', 'Кол-во мест'].map((label) => (
          <TableHead className={tableHeadClassName} scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export const DestinationProductTable = observer(function DestinationProductTable({
  rows,
}: {
  rows: DestinationProductTableRow[]
}) {
  if (rows.length === 0) {
    return (
      <div className="grid content-center justify-items-center gap-3 p-6 text-center">
        <div className="mb-1 grid size-15 place-items-center rounded-[18px] bg-[#f0f4fb] text-[#9aaac3] [&>svg]:size-7 [&>svg]:text-inherit">
          <Box className="size-4 text-[#6582b3]" aria-hidden="true" />
        </div>
        <h3 className="text-[14px] leading-[1.6] font-semibold text-[#59677e]">
          В транспортном месте нет товаров
        </h3>
      </div>
    )
  }

  return (
    <Table
      containerClassName="overflow-visible"
      className="tabular-nums"
      aria-label="Товары активного транспортного места"
    >
      <TransportPlaceProductTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow
            className={selectableRowClassName}
            key={row.id}
            aria-selected={scannerWorkflowOrchestrator.selectedDestinationProductId === row.id}
            data-active={scannerWorkflowOrchestrator.selectedDestinationProductId === row.id}
            tabIndex={0}
            onClick={() => scannerWorkflowOrchestrator.selectDestinationProduct(row.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                scannerWorkflowOrchestrator.selectDestinationProduct(row.id)
              }
            }}
          >
            <TableCell className={tableCellClassName}>{row.code}</TableCell>
            <TableCell className={tableCellClassName}>{row.name}</TableCell>
            <TableCell className={tableCellClassName}>{row.isMarked ? 'Да' : 'Нет'}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.units, 0)}</TableCell>
            <TableCell className={tableCellClassName}>{number(row.boxes)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
})
