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
    <Table aria-label="Контейнеры отбора">
      <ShipmentTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow
            aria-selected={selectedContainerId === row.id}
            className="source-container-row"
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
