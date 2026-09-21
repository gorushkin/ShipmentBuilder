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
import {
  containerRows,
  number,
  productRows,
  transportPlaceProductRows,
  transportPlaceRows,
} from '@/pages/shipment/shared/format'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

function SourceModeSelect({ store }: { store: ShipmentStore }) {
  const selectedLabel = store.sourceDisplayMode === 'containers' ? 'Контейнеры' : 'Товары'

  return (
    <Select
      value={store.sourceDisplayMode}
      onValueChange={(value) => {
        if (value === 'containers' || value === 'products') store.setSourceDisplayMode(value)
      }}
    >
      <SelectTrigger className="mode-control" size="sm" aria-label="Режим источника">
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="containers">Контейнеры</SelectItem>
        <SelectItem value="products">Товары</SelectItem>
      </SelectContent>
    </Select>
  )
}

function DestinationModeSelect({ store }: { store: ShipmentStore }) {
  const isDisabled = !store.activeTransportPlaceId
  const selectedLabel =
    store.destinationDisplayMode === 'transport-places' ? 'Контейнеры ТМ' : 'Товары ТМ'
  const select = (
    <Select
      disabled={isDisabled}
      value={store.destinationDisplayMode}
      onValueChange={(value) => {
        if (value === 'transport-places' || value === 'transport-place-products') {
          store.setDestinationDisplayMode(value)
        }
      }}
    >
      <SelectTrigger className="mode-control" size="sm" aria-label="Режим транспортных мест">
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="transport-places">Контейнеры ТМ</SelectItem>
        <SelectItem value="transport-place-products">Товары ТМ</SelectItem>
      </SelectContent>
    </Select>
  )

  if (!isDisabled) return select

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="disabled-control mode-control" />}>
        {select}
      </TooltipTrigger>
      <TooltipContent>Выберите транспортное место</TooltipContent>
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

export const SourcePanel = observer(function SourcePanel({ store }: { store: ShipmentStore }) {
  const containerRowsList = containerRows(store)
  const productRowsList = productRows(store)
  const isProductMode = store.sourceDisplayMode === 'products'
  const selectedContainer = containerRowsList.find((row) => row.id === store.selectedContainerId)
  const selectedProduct = productRowsList.find((row) => row.id === store.selectedProductId)
  const rowCount = isProductMode ? productRowsList.length : containerRowsList.length
  return (
    <section className="work-panel" aria-labelledby="source-title">
      <header className="panel-header">
        <div className="panel-title">
          <Box aria-hidden="true" />
          <h2 id="source-title">К распределению</h2>
          <Badge variant="secondary" className="count">
            {rowCount}
          </Badge>
        </div>
        <div className="panel-toolbar">
          <SourceModeSelect store={store} />
          <span>Контейнер: {selectedContainer?.name ?? '—'}</span>
          <span>
            Товар: {selectedProduct ? `${selectedProduct.code} · ${selectedProduct.name}` : '—'}
          </span>
        </div>
      </header>
      <div className="table-scroll">
        {isProductMode ? (
          productRowsList.length > 0 ? (
            <Table aria-label="Товары к распределению">
              <ProductTableHeader />
              <TableBody>
                {productRowsList.map((row) => {
                  const isSelected = row.id === store.selectedProductId

                  return (
                    <TableRow
                      aria-selected={isSelected}
                      className="source-product-row"
                      data-active={isSelected}
                      key={row.id}
                      onClick={() => store.selectProduct(row.id)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        store.selectProduct(row.id)
                      }}
                      tabIndex={0}
                    >
                      <TableCell>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{number(row.units, 0)}</TableCell>
                      <TableCell>{number(row.boxes)}</TableCell>
                      <TableCell>{number(row.containers, 0)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="empty-state source-empty-state">
              <div className="empty-icon">
                <Box aria-hidden="true" />
              </div>
              <h3>Все товары распределены</h3>
            </div>
          )
        ) : (
          <Table aria-label="Контейнеры отбора">
            <ShipmentTableHeader />
            <TableBody>
              {containerRowsList.map((row) => {
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
        )}
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
  const productRowsList = transportPlaceProductRows(store)
  const isProductMode = store.destinationDisplayMode === 'transport-place-products'
  const rowCount = isProductMode ? productRowsList.length : rows.length

  return (
    <section className="work-panel" aria-labelledby="destination-title">
      <header className="panel-header">
        <div className="panel-title">
          <Layers aria-hidden="true" />
          <h2 id="destination-title">Транспортные места</h2>
          <Badge variant="secondary" className="count">
            {rowCount}
          </Badge>
          <CreateTransportPlaceAction store={store} />
        </div>
        <div className="panel-toolbar">
          <DestinationModeSelect store={store} />
          <UnavailableButton variant="outline" size="sm">
            PAL
          </UnavailableButton>
          <UnavailableButton variant="outline" size="sm">
            MIX
          </UnavailableButton>
        </div>
      </header>
      <div className="table-scroll destination-scroll">
        {isProductMode ? (
          productRowsList.length > 0 ? (
            <Table aria-label="Товары активного транспортного места">
              <TransportPlaceProductTableHeader />
              <TableBody>
                {productRowsList.map((row) => {
                  const isSelected = row.id === store.selectedTransportPlaceProductId

                  return (
                    <TableRow
                      aria-selected={isSelected}
                      className="transport-place-product-row"
                      data-active={isSelected}
                      key={row.id}
                      onClick={() => store.selectTransportPlaceProduct(row.id)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        store.selectTransportPlaceProduct(row.id)
                      }}
                      tabIndex={0}
                    >
                      <TableCell>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{number(row.units, 0)}</TableCell>
                      <TableCell>{number(row.boxes)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Box aria-hidden="true" />
              </div>
              <h3>В транспортном месте нет товаров</h3>
            </div>
          )
        ) : (
          <>
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
          </>
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
  const unavailableActions = ['Переместить всё по фильтру', 'Переместить количество'] as const

  return (
    <aside className="transfer-actions" aria-label="Распределение товаров">
      <span className="eyebrow">ПЕРЕМЕЩЕНИЕ</span>
      <Button
        variant="outline"
        className="transfer-button"
        disabled={
          store.sourceDisplayMode === 'containers'
            ? !store.canDistributeSelectedContainer
            : !store.canDistributeSelectedProduct
        }
        onClick={() => {
          if (store.sourceDisplayMode === 'containers') store.distributeSelectedContainer()
          else store.distributeSelectedProduct()
        }}
      >
        <ArrowRight />
        <span>Переместить строку</span>
      </Button>
      {unavailableActions.map((label) => (
        <UnavailableButton variant="outline" className="transfer-button" key={label}>
          <ArrowRight />
          <span>{label}</span>
        </UnavailableButton>
      ))}
      <Button
        variant="outline"
        className="transfer-button return-action"
        disabled={
          store.destinationDisplayMode === 'transport-places'
            ? !store.canReturnActiveTransportPlaceContents
            : !store.canReturnSelectedTransportPlaceProduct
        }
        onClick={() => {
          if (store.destinationDisplayMode === 'transport-places') {
            store.returnActiveTransportPlaceContents()
          } else {
            store.returnSelectedTransportPlaceProduct()
          }
        }}
      >
        <ArrowLeft />
        <span>Вернуть строку</span>
      </Button>
      <UnavailableButton variant="outline" className="transfer-button">
        <ArrowLeft />
        <span>Вернуть всё по фильтру</span>
      </UnavailableButton>
    </aside>
  )
})
