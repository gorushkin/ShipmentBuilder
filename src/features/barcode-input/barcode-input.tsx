import { useLayoutEffect, useRef } from 'react'
import type { FormEvent } from 'react'

import { ScanBarcode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionPanelStatus } from '@/features/action-panel-status'

import './barcode-input.css'
import { useBarcodeInput } from './use-barcode-input'

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
    <section className="barcode-input" aria-label="Панель действий и сканирование штрихкода">
      <div
        className={`barcode-input__status barcode-input__status--${actionStatus.tone}`}
        role="status"
      >
        <ScanBarcode aria-hidden="true" />
        <span>{actionStatus.message}</span>
      </div>
      {isExpanded && (
        // TODO: move this form to a separate component for better readability and maintainability
        <form className="barcode-input__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="barcode-input">
            Штрихкод
          </label>
          <Input
            aria-label="Штрихкод"
            className="barcode-input__field"
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
        aria-controls={isExpanded ? 'barcode-input' : undefined}
        aria-expanded={isExpanded}
        onClick={() => controller.toggle()}
        size="sm"
        type="button"
        variant="outline"
      >
        <ScanBarcode />
        {isExpanded ? 'Свернуть ввод' : 'Развернуть ввод'}
        <kbd>F2</kbd>
      </Button>
    </section>
  )
})
