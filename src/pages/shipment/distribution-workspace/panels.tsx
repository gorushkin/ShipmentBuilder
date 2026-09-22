import { useState } from 'react'

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
import type { ShipmentStore } from '@/domain/shipment/shipment-store'
import {
  scannerWorkflowOrchestrator,
  type DestinationTableMode,
  type SourceTableMode,
} from '@/features/scanner-workflow'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

import { DestinationProductTable } from './destination/destination-product-table'
import { DestinationTransportPlaceTable } from './destination/destination-transport-place-table'
import { PartialQuantityDialog } from './partial-quantity-dialog'
import { SourceContainerTable } from './source/source-container-table'
import { SourceProductTable } from './source/source-product-table'

function SourceModeSelect({
  mode,
  onModeChange,
}: {
  mode: SourceTableMode
  onModeChange: (mode: SourceTableMode) => void
}) {
  const selectedLabel = mode === 'containers' ? 'Контейнеры' : 'Товары'

  return (
    <Select
      value={mode}
      onValueChange={(value) => {
        if (value === 'containers' || value === 'products') onModeChange(value)
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

function DestinationModeSelect({
  mode,
  onModeChange,
}: {
  mode: DestinationTableMode
  onModeChange: (mode: DestinationTableMode) => void
}) {
  const selectedLabel = mode === 'transport-places' ? 'Контейнеры ТМ' : 'Товары ТМ'

  return (
    <Select
      value={mode}
      onValueChange={(value) => {
        if (value === 'transport-places' || value === 'transport-place-products')
          onModeChange(value)
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
}

function CreateTransportPlaceAction({ store }: { store: ShipmentStore }) {
  return (
    <Button
      disabled={!scannerWorkflowOrchestrator.hasSnapshot}
      size="sm"
      onClick={() => {
        if (scannerWorkflowOrchestrator.createTransportPlace()) store.createTransportPlace()
      }}
    >
      <Plus />
      Создать ТМ
    </Button>
  )
}

export const SourcePanel = observer(function SourcePanel() {
  const mode = scannerWorkflowOrchestrator.sourceMode
  const sourceFilter = scannerWorkflowOrchestrator.sourceFilter
  const selectedSource = scannerWorkflowOrchestrator.selectedSource
  const rowCount =
    mode === 'products'
      ? scannerWorkflowOrchestrator.getSourceRows('products').length
      : scannerWorkflowOrchestrator.getSourceRows('containers').length
  const sourceTable =
    mode === 'products' ? (
      <SourceProductTable
        rows={scannerWorkflowOrchestrator.getSourceRows('products')}
        selectedProductId={selectedSource?.kind === 'product' ? selectedSource.productId : null}
        onSelect={scannerWorkflowOrchestrator.selectProduct.bind(scannerWorkflowOrchestrator)}
      />
    ) : (
      <SourceContainerTable
        rows={scannerWorkflowOrchestrator.getSourceRows('containers')}
        selectedContainerId={sourceFilter?.type === 'container' ? sourceFilter.containerId : null}
        onSelect={scannerWorkflowOrchestrator.selectContainer.bind(scannerWorkflowOrchestrator)}
      />
    )

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
          <SourceModeSelect
            mode={mode}
            onModeChange={scannerWorkflowOrchestrator.setSourceMode.bind(
              scannerWorkflowOrchestrator,
            )}
          />
        </div>
        {sourceFilter && (
          <div className="source-filter-indicator">
            <span>
              {sourceFilter.type === 'container' ? 'Контейнер' : 'Товар'}:{' '}
              {scannerWorkflowOrchestrator.sourceFilterLabel}
            </span>
            <Button
              onClick={() => scannerWorkflowOrchestrator.clearSourceFilter()}
              size="sm"
              type="button"
              variant="ghost"
            >
              Сбросить
            </Button>
          </div>
        )}
      </header>
      <div className="table-scroll">{sourceTable}</div>
    </section>
  )
})

export const DestinationPanel = observer(function DestinationPanel({
  store,
}: {
  store: ShipmentStore
}) {
  const [mode, setMode] = useState<DestinationTableMode>('transport-places')
  const isProductMode = mode === 'transport-place-products'
  const rowCount = isProductMode
    ? scannerWorkflowOrchestrator.getDestinationRows('transport-place-products').length
    : scannerWorkflowOrchestrator.getDestinationRows('transport-places').length
  const destinationTable = isProductMode ? (
    <DestinationProductTable
      rows={scannerWorkflowOrchestrator.getDestinationRows('transport-place-products')}
    />
  ) : (
    <DestinationTransportPlaceTable
      rows={scannerWorkflowOrchestrator.getDestinationRows('transport-places')}
    />
  )

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
          <DestinationModeSelect mode={mode} onModeChange={setMode} />
          <UnavailableButton variant="outline" size="sm">
            PAL
          </UnavailableButton>
          <UnavailableButton variant="outline" size="sm">
            MIX
          </UnavailableButton>
        </div>
      </header>
      <div className="table-scroll destination-scroll">{destinationTable}</div>
    </section>
  )
})

export const TransferActions = observer(function TransferActions({
  store,
}: {
  store: ShipmentStore
}) {
  const [partialDirection, setPartialDirection] = useState<null | 'distribute' | 'return'>(null)
  const partialContext =
    partialDirection === 'distribute'
      ? store.partialDistributionContext
      : partialDirection === 'return'
        ? store.partialReturnContext
        : null

  return (
    <aside className="transfer-actions" aria-label="Распределение товаров">
      <span className="eyebrow">ПЕРЕМЕЩЕНИЕ</span>
      <Button
        variant="outline"
        className="transfer-button"
        disabled={
          store.sourceFilter
            ? !store.canDistributeSelectedSourceLine
            : store.sourceDisplayMode === 'containers'
              ? !store.canDistributeSelectedContainer
              : !store.canDistributeSelectedProduct
        }
        onClick={() => {
          if (store.sourceFilter) store.distributeSelectedSourceLine()
          else if (store.sourceDisplayMode === 'containers') store.distributeSelectedContainer()
          else store.distributeSelectedProduct()
        }}
      >
        <ArrowRight />
        <span>Переместить строку</span>
      </Button>
      <Button
        variant="outline"
        className="transfer-button"
        disabled={!store.canDistributeBulkSourceLines}
        onClick={() => store.distributeBulkSourceLines()}
      >
        <ArrowRight />
        <span>Переместить всё по фильтру</span>
      </Button>
      <Button
        variant="outline"
        className="transfer-button"
        disabled={!store.partialDistributionContext}
        onClick={() => setPartialDirection('distribute')}
      >
        <ArrowRight />
        <span>Переместить количество</span>
      </Button>
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
      <Button
        variant="outline"
        className="transfer-button return-action"
        disabled={!store.partialReturnContext}
        onClick={() => setPartialDirection('return')}
      >
        <ArrowLeft />
        <span>Вернуть количество</span>
      </Button>
      <Button
        variant="outline"
        className="transfer-button return-action"
        disabled={!store.canReturnBulkDestinationLines}
        onClick={() => store.returnBulkDestinationLines()}
      >
        <ArrowLeft />
        <span>Вернуть всё по фильтру</span>
      </Button>
      <PartialQuantityDialog
        key={partialDirection}
        context={partialContext}
        direction={partialDirection}
        onConfirm={(quantity) => {
          if (partialDirection === 'distribute') store.distributeSelectedProductQuantity(quantity)
          if (partialDirection === 'return')
            store.returnSelectedTransportPlaceProductQuantity(quantity)
          setPartialDirection(null)
        }}
        onOpenChange={(open) => {
          if (!open) setPartialDirection(null)
        }}
        open={partialDirection !== null}
      />
    </aside>
  )
})
