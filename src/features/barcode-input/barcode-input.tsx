import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { ScanBarcode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionPanelStatus } from '@/features/action-panel-status'

import './barcode-input.css'
import { BarcodeInputController } from './barcode-input-controller'

interface BarcodeInputProps {
  actionStatus: ActionPanelStatus
  isProcessing: boolean
  onCancel?: () => void
  onCompleted: (value: string) => void
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  )
}

function hasOpenDialog(): boolean {
  return Boolean(document.querySelector('[data-slot="dialog-content"]'))
}

export const BarcodeInput = observer(function BarcodeInput({
  actionStatus,
  isProcessing,
  onCancel,
  onCompleted,
}: BarcodeInputProps) {
  const [controller] = useState(() => new BarcodeInputController())
  const [isExpanded, setIsExpanded] = useState(false)
  const [value, setValue] = useState('')

  const focusInput = useCallback(
    () =>
      window.requestAnimationFrame(() => {
        if (!hasOpenDialog()) controller.focus()
      }),
    [controller],
  )

  useEffect(() => {
    focusInput()
  }, [focusInput, isProcessing])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'F2' &&
        !hasOpenDialog() &&
        (!isTextEntryTarget(event.target) || controller.isFocused())
      ) {
        event.preventDefault()
        setIsExpanded(true)
        focusInput()
        return
      }

      if (event.key === 'Escape' && isExpanded && controller.isFocused()) {
        event.preventDefault()
        setIsExpanded(false)
        focusInput()
        return
      }

      if (event.key === 'Escape' && !hasOpenDialog()) onCancel?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controller, focusInput, isExpanded, onCancel])

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (isTextEntryTarget(event.target)) return

      window.setTimeout(() => {
        if (hasOpenDialog() || isTextEntryTarget(document.activeElement)) return
        controller.focus()
      }, 0)
    }

    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [controller])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const barcode = value.trim()
    setValue('')

    if (barcode) {
      onCompleted(barcode)
    }

    focusInput()
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
      <form className="barcode-input__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="barcode-input">
          Штрихкод
        </label>
        <Input
          aria-label="Штрихкод"
          className={
            isExpanded
              ? 'barcode-input__field'
              : 'barcode-input__field barcode-input__field--hidden'
          }
          id="barcode-input"
          disabled={isProcessing}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Сканируйте или введите штрихкод"
          ref={(input) => controller.connect(input)}
          value={value}
        />
      </form>
      <Button
        onClick={() => {
          setIsExpanded(true)
          focusInput()
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <ScanBarcode />
        Развернуть ввод
        <kbd>F2</kbd>
      </Button>
    </section>
  )
})
