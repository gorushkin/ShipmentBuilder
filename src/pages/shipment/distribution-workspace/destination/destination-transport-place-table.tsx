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
import { scannerWorkflowOrchestrator } from '@/features/scanner-workflow'
import { number } from '@/pages/shipment/shared/format'

function ShipmentTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        {['ТМ', 'SSCC', 'SKU', 'ЧЗ', 'ШТ', 'Кол-во мест', 'Объём, м³'].map((label) => (
          <TableHead scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export function DestinationTransportPlaceTable({
  rows,
}: {
  rows: DestinationTransportPlaceTableRow[]
}) {
  return (
    <>
      <Table aria-label="Транспортные места">
        <ShipmentTableHeader />
        <TableBody>
          {rows.map((row) => (
            <TableRow
              aria-selected={row.isActive}
              className="transport-place-row"
              data-active={row.isActive}
              key={row.id}
              onClick={() => scannerWorkflowOrchestrator.selectTransportPlace(row.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  scannerWorkflowOrchestrator.selectTransportPlace(row.id)
                }
              }}
              tabIndex={0}
            >
              <TableCell>
                <span className="container-name">
                  <Layers aria-hidden="true" />
                  {row.name}
                </span>
              </TableCell>
              <TableCell>---</TableCell>
              <TableCell>{row.sku}</TableCell>
              <TableCell>{row.isMarked ? 'Да' : 'Нет'}</TableCell>
              <TableCell>{number(row.units, 0)}</TableCell>
              <TableCell>{number(row.boxes)}</TableCell>
              <TableCell>{number(row.volume, 4)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Layers aria-hidden="true" />
          </div>
          <h3>
            Транспортные места
            <br />
            ещё не созданы
          </h3>
          <p>
            Здесь появятся места
            <br />
            для упаковки товаров заказа
          </p>
        </div>
      )}
    </>
  )
}
