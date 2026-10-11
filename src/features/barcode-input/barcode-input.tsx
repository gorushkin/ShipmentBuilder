import { useLayoutEffect, useRef } from 'react'
import type { FormEvent } from 'react'

import { cn } from 'cn'
import { ScanBarcode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionPanelStatus } from '@/features/action-panel-status'
import { commands } from '@/features/command-config'
import { barcodeShortcuts } from '@/features/keyboard-input'

import { useBarcodeInput } from './use-barcode-input'

const statusClassNames: Record<ActionPanelStatus['tone'], string> = {
  error: 'text-error',
  info: 'text-primary',
  processing: 'text-muted-foreground',
  success: 'text-success',
}

interface BarcodeInputProps {
  actionStatus: ActionPanelStatus
  isProcessing: boolean
  onCancel?: () => void
  onCompleted: (value: string) => void
}

export const BarcodeInput = observer(function BarcodeInput({
  actionStatus,
  isProcessing,
  onCancel,
  onCompleted,
}: BarcodeInputProps) {
  const controller = useBarcodeInput(onCompleted, onCancel)
  const inputRef = useRef<HTMLInputElement>(null)
  const isExpanded = controller.isExpanded

  useLayoutEffect(() => {
    if (isExpanded) inputRef.current?.focus({ preventScroll: true })
  }, [isExpanded])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const barcode = controller.takeValue()

    if (barcode) {
      onCompleted(barcode)
    }
  }

  return (
    <section
      className="group/barcode flex min-h-[42px] items-center gap-3 rounded-lg border border-summary-border bg-card px-2.5 py-1.5"
      aria-label="Панель действий и сканирование штрихкода"
    >
      <div
        className={cn(
          'flex min-w-[220px] flex-[1_1_360px] items-center gap-[7px] text-[15px] leading-[1.35] font-semibold group-has-[input:disabled]/barcode:text-muted-foreground',
          statusClassNames[actionStatus.tone],
        )}
        role="status"
      >
        <ScanBarcode className="size-3.5" aria-hidden="true" />
        <span className="min-w-0">{actionStatus.message}</span>
      </div>
      {isExpanded && (
        // TODO: move this form to a separate component for better readability and maintainability
        <form className="min-w-[180px] flex-[0_1_420px]" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="barcode-input">
            Штрихкод
          </label>
          <Input
            aria-label="Штрихкод"
            id="barcode-input"
            disabled={isProcessing}
            onChange={(event) => controller.setValue(event.target.value)}
            placeholder="Сканируйте или введите штрихкод"
            ref={inputRef}
            value={controller.value}
          />
        </form>
      )}
      <Button
        className="text-[11px] leading-[1.428571] [&_kbd]:rounded-[3px] [&_kbd]:border-summary-border [&_kbd]:px-1 [&_kbd]:py-px [&_kbd]:font-[650] [&_kbd]:text-muted-foreground"
        shortcut={barcodeShortcuts.toggle}
        title={commands.barcodeToggle.description}
        aria-controls={isExpanded ? 'barcode-input' : undefined}
        aria-expanded={isExpanded}
        onClick={() => controller.toggle()}
        size="sm"
        type="button"
        variant="outline"
      >
        <ScanBarcode className="size-3.5" aria-hidden="true" />
        {commands.barcodeToggle.label}
      </Button>
    </section>
  )
})
