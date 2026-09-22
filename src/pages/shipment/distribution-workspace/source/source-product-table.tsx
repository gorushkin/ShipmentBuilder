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

function ProductTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['Код товара', 'Наименование', 'ШТ', 'Короба', 'Контейнеров'].map((label) => (
          <TableHead scope="col" key={label}>
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
  onSelect: (productId: string) => void
  rows: SourceProductTableRow[]
  selectedProductId: null | string
}) {
  if (rows.length === 0) {
    return (
      <div className="empty-state source-empty-state">
        <div className="empty-icon">
          <Box aria-hidden="true" />
        </div>
        <h3>Все товары распределены</h3>
      </div>
    )
  }

  return (
    <Table aria-label="Товары к распределению">
      <ProductTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow
            aria-selected={selectedProductId === row.id}
            className="source-product-row"
            data-active={selectedProductId === row.id}
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
            <TableCell>{row.code}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{number(row.units, 0)}</TableCell>
            <TableCell>{number(row.boxes)}</TableCell>
            <TableCell>{number(row.containers, 0)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
