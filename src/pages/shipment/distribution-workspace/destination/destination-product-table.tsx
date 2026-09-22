import { Box } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DestinationProductTableRow } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'

function TransportPlaceProductTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['Код товара', 'Наименование', 'ШТ', 'Короба'].map((label) => (
          <TableHead scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function DestinationProductTable({ rows }: { rows: DestinationProductTableRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Box aria-hidden="true" />
        </div>
        <h3>В транспортном месте нет товаров</h3>
      </div>
    )
  }

  return (
    <Table aria-label="Товары активного транспортного места">
      <TransportPlaceProductTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow className="transport-place-product-row" key={row.id}>
            <TableCell>{row.code}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{number(row.units, 0)}</TableCell>
            <TableCell>{number(row.boxes)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
