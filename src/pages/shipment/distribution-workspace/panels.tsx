import { ArrowLeft, ArrowRight, Box, Layers, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ShipmentStore } from '@/domain/shipment/shipment-store'
import { containerRows, number, transportPlaceRows } from '@/pages/shipment/shared/format'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

function DisabledModeSelect({
  label,
  options,
  value,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="disabled-control mode-control" />}>
        <Select disabled value={value}>
          <SelectTrigger size="sm" aria-label={label}>
            <SelectValue>{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TooltipTrigger>
      <TooltipContent>Переключение режима появится позже</TooltipContent>
    </Tooltip>
  )
}

function CreateTransportPlaceAction({ store }: { store: ShipmentStore }) {
  return (
    <Button size="sm" onClick={() => store.createTransportPlace()}>
      <Plus />
      Создать ТМ
    </Button>
  )
}

function ShipmentTableHeader({ destination = false }: { destination?: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        {[destination ? 'ТМ' : 'Контейнер', 'SKU', 'ШТ', 'Короба', 'Объём, м³'].map((label) => (
          <TableHead scope="col" key={label}>
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export const SourcePanel = observer(function SourcePanel({ store }: { store: ShipmentStore }) {
  const rows = containerRows(store)
  const selectedRow = rows.find((row) => row.id === store.selectedContainerId)
  return (
    <section className="work-panel" aria-labelledby="source-title">
      <header className="panel-header">
        <div className="panel-title">
          <Box aria-hidden="true" />
          <h2 id="source-title">К распределению</h2>
          <Badge variant="secondary" className="count">
            {rows.length}
          </Badge>
        </div>
        <div className="panel-toolbar">
          <DisabledModeSelect
            label="Режим источника"
            value="containers"
            options={[
              { label: 'Контейнеры', value: 'containers' },
              { label: 'Товары', value: 'products' },
            ]}
          />
          <span>Контейнер: {selectedRow?.name ?? '—'}</span>
          <span>Товар: —</span>
        </div>
      </header>
      <div className="table-scroll">
        <Table aria-label="Контейнеры отбора">
          <ShipmentTableHeader />
          <TableBody>
            {rows.map((row) => {
              const isSelected = row.id === store.selectedContainerId

              return (
                <TableRow
                  aria-selected={isSelected}
                  className="source-container-row"
                  data-active={isSelected}
                  key={row.id}
                  onClick={() => store.selectContainer(row.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    store.selectContainer(row.id)
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
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
})

export const DestinationPanel = observer(function DestinationPanel({
  store,
}: {
  store: ShipmentStore
}) {
  const rows = transportPlaceRows(store)

  return (
    <section className="work-panel" aria-labelledby="destination-title">
      <header className="panel-header">
        <div className="panel-title">
          <Layers aria-hidden="true" />
          <h2 id="destination-title">Транспортные места</h2>
          <CreateTransportPlaceAction store={store} />
        </div>
        <div className="panel-toolbar">
          <DisabledModeSelect
            label="Режим транспортных мест"
            value="transport-places"
            options={[
              { label: 'Контейнеры ТМ', value: 'transport-places' },
              { label: 'Товары ТМ', value: 'transport-place-products' },
            ]}
          />
          <UnavailableButton variant="outline" size="sm">
            PAL
          </UnavailableButton>
          <UnavailableButton variant="outline" size="sm">
            MIX
          </UnavailableButton>
        </div>
      </header>
      <div className="table-scroll destination-scroll">
        <Table aria-label="Транспортные места">
          <ShipmentTableHeader destination />
          <TableBody>
            {rows.map((row) => {
              const isActive = row.id === store.activeTransportPlaceId

              return (
                <TableRow
                  aria-selected={isActive}
                  className="transport-place-row"
                  data-active={isActive}
                  key={row.id}
                  onClick={() => store.selectTransportPlace(row.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    store.selectTransportPlace(row.id)
                  }}
                  tabIndex={0}
                >
                  <TableCell>
                    <span className="container-name">
                      <Layers aria-hidden="true" />
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{number(row.units, 0)}</TableCell>
                  <TableCell>{number(row.boxes)}</TableCell>
                  <TableCell>{number(row.volume, 4)}</TableCell>
                </TableRow>
              )
            })}
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
      </div>
    </section>
  )
})

export const TransferActions = observer(function TransferActions({
  store,
}: {
  store: ShipmentStore
}) {
  const unavailableActions = [
    { direction: 'forward', label: 'Переместить всё по фильтру' },
    { direction: 'forward', label: 'Переместить количество' },
    { direction: 'return', label: 'Вернуть строку' },
    { direction: 'return', label: 'Вернуть всё по фильтру' },
  ] as const

  return (
    <aside className="transfer-actions" aria-label="Распределение товаров">
      <span className="eyebrow">ПЕРЕМЕЩЕНИЕ</span>
      <Button
        variant="outline"
        className="transfer-button"
        disabled={!store.canDistributeSelectedContainer}
        onClick={() => store.distributeSelectedContainer()}
      >
        <ArrowRight />
        <span>Переместить строку</span>
      </Button>
      {unavailableActions.map(({ direction, label }) => (
        <UnavailableButton
          variant="outline"
          className="transfer-button"
          triggerClassName={label === 'Вернуть строку' ? 'return-action' : undefined}
          key={label}
        >
          {direction === 'forward' ? <ArrowRight /> : <ArrowLeft />}
          <span>{label}</span>
        </UnavailableButton>
      ))}
    </aside>
  )
})
