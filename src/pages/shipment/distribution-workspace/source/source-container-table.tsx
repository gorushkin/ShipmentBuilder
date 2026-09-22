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

function ShipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['Контейнер', 'SKU', 'ШТ', 'Короба', 'Объём, м³'].map((label) => (
          <TableHead scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function SourceContainerTable({ rows }: { rows: SourceContainerTableRow[] }) {
  return (
    <Table aria-label="Контейнеры отбора">
      <ShipmentTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow className="source-container-row" key={row.id}>
            <TableCell>
              <span className="container-name">
                <Box aria-hidden="true" />
                {row.name}
              </span>
            </TableCell>
            <TableCell>{row.sku}</TableCell>
            <TableCell>{number(row.units, 0)}</TableCell>
            <TableCell>{number(row.boxes)}</TableCell>
            <TableCell>{number(row.volume, 4)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
