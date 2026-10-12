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
import { commands } from '@/features/command-config'
import { barcodeShortcuts, useShortcut } from '@/features/keyboard-input'
import {
  scannerWorkflowOrchestrator,
  type DestinationTableMode,
  type SourceTableMode,
} from '@/features/scanner-workflow'
import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

import { DeleteTransportPlaceAction } from './delete-transport-place-action'
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
      <SelectTrigger className="ml-auto w-[132px]" size="sm" aria-label="Режим источника">
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
      <SelectTrigger className="ml-auto w-[132px]" size="sm" aria-label="Режим транспортных мест">
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
  const workflow = scannerWorkflowOrchestrator
  const shortcut = shipmentShortcuts.createTransportPlace
  const canCreate = () => workflow.hasSnapshot && !workflow.isBusy && !workflow.isWaiting
  const create = () => {
    if (canCreate()) workflow.createTransportPlace()
  }

  useShortcut(shortcut, create, { accepts: canCreate })

  return (
    <Button
      disabled={!canCreate()}
      shortcut={shortcut}
      title={commands.createTransportPlace.description}
      size="sm"
      onClick={create}
    >
      <Plus aria-hidden="true" />
      {commands.createTransportPlace.label}
    </Button>
  )
})

const ClearSourceFilterAction = observer(function ClearSourceFilterAction() {
  const workflow = scannerWorkflowOrchestrator
  const shortcut = shipmentShortcuts.clearFilter
  const clear = () => {
    if (workflow.sourceFilter) workflow.clearSourceFilter()
  }

  useShortcut(shortcut, clear, { accepts: () => Boolean(workflow.sourceFilter) })

  return (
    <Button
      onClick={clear}
      shortcut={shortcut}
      title={commands.clearFilter.description}
      size="sm"
      type="button"
      variant="ghost"
    >
      {commands.clearFilter.label}
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
    <section
      className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-panel-border bg-card"
      aria-labelledby="source-title"
    >
      <header className="grid gap-2 px-4 py-2">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <Box className="size-[17px] text-primary" aria-hidden="true" />
          <h2 className="text-[14px] font-[650]" id="source-title">
            К распределению
          </h2>
          <Badge
            variant="secondary"
            className="rounded-[5px] bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {rowCount}
          </Badge>
          <SourceModeSelect
            mode={mode}
            onModeChange={scannerWorkflowOrchestrator.setSourceMode.bind(
              scannerWorkflowOrchestrator,
            )}
          />
        </div>
        {sourceFilter && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#365487]">
            <span>
              {sourceFilter.type === 'container' ? 'Контейнер' : 'Товар'}:{' '}
              {scannerWorkflowOrchestrator.sourceFilterLabel}
            </span>
            <ClearSourceFilterAction />
          </div>
        )}
      </header>
      <div className="min-h-0 min-w-0 overflow-auto">{sourceTable}</div>
    </section>
  )
})

export const DestinationPanel = observer(function DestinationPanel() {
  const workflow = scannerWorkflowOrchestrator
  const places = workflow.getDestinationRows('transport-places')
  const activePlace = places.find((place) => place.isActive)
  const [mode, setMode] = useState<DestinationTableMode>('transport-places')
  const [previousActiveId, setPreviousActiveId] = useState(activePlace?.id)

  if (previousActiveId !== activePlace?.id) {
    setPreviousActiveId(activePlace?.id)
    if (previousActiveId && !activePlace) setMode('transport-places')
  }

  const selectPlace = (id: string) => {
    if (workflow.selectTransportPlace(id)) setMode('transport-place-products')
  }

  const isProductMode = mode === 'transport-place-products'
  const clearShortcut = shipmentShortcuts.clearDestinationFilter
  const clearFilter = () => setMode('transport-places')

  useShortcut(clearShortcut, clearFilter, {
    accepts: () => isProductMode && Boolean(activePlace),
  })

  const rowCount = isProductMode
    ? scannerWorkflowOrchestrator.getDestinationRows('transport-place-products').length
    : scannerWorkflowOrchestrator.getDestinationRows('transport-places').length
  const destinationTable = isProductMode ? (
    <DestinationProductTable
      rows={scannerWorkflowOrchestrator.getDestinationRows('transport-place-products')}
    />
  ) : (
    <DestinationTransportPlaceTable
      onSelect={selectPlace}
      rows={scannerWorkflowOrchestrator.getDestinationRows('transport-places')}
    />
  )

  return (
    <section
      className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-panel-border bg-card"
      aria-labelledby="destination-title"
    >
      <header className="grid gap-2 px-4 py-2">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <Layers className="size-[17px] text-primary" aria-hidden="true" />
          <h2 className="text-[14px] font-[650]" id="destination-title">
            Транспортные места
          </h2>
          <Badge
            variant="secondary"
            className="rounded-[5px] bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {rowCount}
          </Badge>
          <DestinationModeSelect mode={mode} onModeChange={setMode} />
          <CreateTransportPlaceAction />
          <DeleteTransportPlaceAction />
        </div>
        {isProductMode && activePlace && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#365487]">
            <span>ТМ: {activePlace.name}</span>
            <Button
              onClick={clearFilter}
              shortcut={clearShortcut}
              title={commands.clearDestinationFilter.description}
              size="sm"
              type="button"
              variant="ghost"
            >
              {commands.clearDestinationFilter.label}
            </Button>
          </div>
        )}
      </header>
      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(200px,1fr)] overflow-auto">
        {destinationTable}
      </div>
    </section>
  )
})

type TransferCommand = Parameters<typeof scannerWorkflowOrchestrator.canCommand>[0]

const TransferAction = observer(function TransferAction({
  command,
  label,
  shortcut,
  title,
}: {
  command: TransferCommand
  label: string
  shortcut: string
  title: string
}) {
  const workflow = scannerWorkflowOrchestrator
  const available = () => workflow.canCommand(command)
  const run = () => {
    if (available()) workflow.command(command)
  }

  useShortcut(shortcut, run, { accepts: available })

  return (
    <Button
      variant="outline"
      className="grid h-auto min-h-[40px] grid-cols-[14px_minmax(0,1fr)_max-content] gap-2 px-2.5 py-1.5 text-left text-[11px] leading-normal whitespace-normal [&>[data-slot=kbd]]:col-start-3"
      disabled={!available()}
      onClick={run}
      shortcut={shortcut}
      title={title}
    >
      {command.includes('return') ? (
        <ArrowLeft aria-hidden="true" />
      ) : (
        <ArrowRight aria-hidden="true" />
      )}
      <span>{label}</span>
    </Button>
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
    [
      workflow.selectedTransferCommand,
      commands.transferRow.label,
      shipmentShortcuts.transferRow,
      commands.transferRow.description,
    ],
    [
      'transfer-filtered',
      commands.transferAll.label,
      shipmentShortcuts.transferAll,
      commands.transferAll.description,
    ],
    [
      'request-transfer-quantity',
      commands.transferQuantity.label,
      shipmentShortcuts.transferQuantity,
      commands.transferQuantity.description,
    ],
  ] as const

  const returnActions = [
    [
      'return-product',
      commands.returnRow.label,
      shipmentShortcuts.returnRow,
      commands.returnRow.description,
    ],
    [
      'request-return-quantity',
      commands.returnQuantity.label,
      shipmentShortcuts.returnQuantity,
      commands.returnQuantity.description,
    ],
    [
      'return-transport-place',
      commands.returnAll.label,
      shipmentShortcuts.returnAll,
      commands.returnAll.description,
    ],
  ] as const

  const renderAction = ([command, label, shortcut, title]:
    (typeof transferActions)[number] | (typeof returnActions)[number]) => (
    <TransferAction
      key={command}
      command={command}
      label={label}
      shortcut={shortcut}
      title={title}
    />
  )

  return (
    <aside
      className="grid min-h-0 content-start gap-2 overflow-y-auto"
      aria-label="Распределение товаров"
    >
      <div className="grid gap-3">
        <div className="grid gap-1.5" role="group" aria-label="Перенос в ТМ">
          {transferActions.map(renderAction)}
        </div>
        <div className="grid gap-1.5" role="group" aria-label="PAL/MIX">
          <UnavailableButton
            className="w-full min-h-8 text-[11px]"
            variant="outline"
            shortcut={shipmentShortcuts.pal}
            title={commands.pal.description}
          >
            {commands.pal.label}
          </UnavailableButton>
          <UnavailableButton
            className="w-full min-h-8 text-[11px]"
            variant="outline"
            shortcut={shipmentShortcuts.mix}
            title={commands.mix.description}
          >
            {commands.mix.label}
          </UnavailableButton>
        </div>
        <div className="grid gap-1.5" role="group" aria-label="Возврат из ТМ">
          {returnActions.map(renderAction)}
        </div>
      </div>
      {workflow.isWaiting && (
        <Button
          variant="outline"
          shortcut={barcodeShortcuts.cancel}
          title={commands.cancel.description}
          onClick={() => workflow.command('cancel')}
        >
          {commands.cancel.label}
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
