import { ArrowLeft, ArrowRight, Box, Layers, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { containerRows, number } from '@/pages/shipment/shared/format'
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

function CreateTransportPlaceAction() {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger render={<span className="disabled-control" />}>
          <DialogTrigger render={<Button disabled size="sm" />}>
            <Plus />
            Создать ТМ
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Создание ТМ появится в следующем функциональном change</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создание транспортного места</DialogTitle>
          <DialogDescription>
            Форма будет добавлена вместе с логикой создания транспортных мест.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          <span>Контейнер: —</span>
          <span>Товар: —</span>
        </div>
      </header>
      <div className="table-scroll">
        <Table aria-label="Контейнеры отбора">
          <ShipmentTableHeader />
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
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
      </div>
    </section>
  )
})

export function DestinationPanel() {
  return (
    <section className="work-panel" aria-labelledby="destination-title">
      <header className="panel-header">
        <div className="panel-title">
          <Layers aria-hidden="true" />
          <h2 id="destination-title">Транспортные места</h2>
          <CreateTransportPlaceAction />
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
          <TableBody />
        </Table>
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
      </div>
    </section>
  )
}

export function TransferActions() {
  return (
    <aside className="transfer-actions" aria-label="Распределение товаров">
      <span className="eyebrow">ПЕРЕМЕЩЕНИЕ</span>
      {[
        'Переместить строку',
        'Переместить всё по фильтру',
        'Переместить количество',
        'Вернуть строку',
        'Вернуть всё по фильтру',
      ].map((label, index) => (
        <UnavailableButton
          variant="outline"
          className="transfer-button"
          triggerClassName={index === 3 ? 'return-action' : undefined}
          key={label}
        >
          {index < 3 ? <ArrowRight /> : <ArrowLeft />}
          <span>{label}</span>
        </UnavailableButton>
      ))}
    </aside>
  )
}
