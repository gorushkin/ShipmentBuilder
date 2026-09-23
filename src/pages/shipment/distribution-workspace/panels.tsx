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

const CreateTransportPlaceAction = observer(function CreateTransportPlaceAction() {
  return (
    <Button
      disabled={
        !scannerWorkflowOrchestrator.hasSnapshot ||
        scannerWorkflowOrchestrator.isBusy ||
        scannerWorkflowOrchestrator.isWaiting
      }
      size="sm"
      onClick={() => {
        scannerWorkflowOrchestrator.createTransportPlace()
      }}
    >
      <Plus />
      Создать ТМ
    </Button>
  )
})

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
        selectedProductId={
          scannerWorkflowOrchestrator.selectedSourceLineId ??
          (selectedSource?.kind === 'product' ? selectedSource.productId : null)
        }
        onSelect={(row) =>
          row.sourceLineId
            ? scannerWorkflowOrchestrator.selectSourceLine(row.sourceLineId)
            : scannerWorkflowOrchestrator.selectProduct(row.id)
        }
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

export const DestinationPanel = observer(function DestinationPanel() {
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
          <CreateTransportPlaceAction />
        </div>
        <div className="panel-toolbar">
          <DestinationModeSelect mode={mode} onModeChange={setMode} />
        </div>
      </header>
      <div className="table-scroll destination-scroll">{destinationTable}</div>
    </section>
  )
})

export const TransferActions = observer(function TransferActions() {
  const workflow = scannerWorkflowOrchestrator
  const step = workflow.step
  const direction =
    step.kind === 'awaiting-quantity'
      ? step.operation.kind === 'return'
        ? 'return'
        : 'distribute'
      : null

  const transferActions = [
    [workflow.selectedTransferCommand, 'Переместить строку'],
    ['transfer-filtered', 'Переместить всё по фильтру'],
    ['request-transfer-quantity', 'Переместить количество'],
  ] as const

  const returnActions = [
    ['return-product', 'Вернуть строку'],
    ['request-return-quantity', 'Вернуть количество'],
    ['return-transport-place', 'Вернуть всё из ТМ'],
  ] as const

  const renderAction = ([command, label]:
    (typeof transferActions)[number] | (typeof returnActions)[number]) => (
    <Button
      key={command}
      variant="outline"
      className="transfer-button"
      disabled={!workflow.canCommand(command)}
      onClick={() => workflow.command(command)}
    >
      {command.includes('return') ? <ArrowLeft /> : <ArrowRight />}
      <span>{label}</span>
    </Button>
  )

  return (
    <aside className="transfer-actions" aria-label="Распределение товаров">
      <span className="eyebrow">ПЕРЕМЕЩЕНИЕ</span>
      <div className="transfer-actions-list">
        {transferActions.map(renderAction)}
        <UnavailableButton className="future-action" variant="outline">
          PAL
        </UnavailableButton>
        <UnavailableButton className="future-action" variant="outline">
          MIX
        </UnavailableButton>
        {returnActions.map(renderAction)}
      </div>
      {workflow.isWaiting && (
        <Button variant="outline" onClick={() => workflow.command('cancel')}>
          Отмена
        </Button>
      )}
      {step.kind === 'awaiting-quantity' && (
        <PartialQuantityDialog
          context={workflow.quantityContext}
          direction={direction}
          error={workflow.feedback.kind === 'error' ? workflow.feedback.message : null}
          onConfirm={(quantity) => workflow.submitQuantity(quantity)}
          onOpenChange={(open) => {
            if (!open) workflow.command('cancel')
          }}
          open
        />
      )}
    </aside>
  )
})
