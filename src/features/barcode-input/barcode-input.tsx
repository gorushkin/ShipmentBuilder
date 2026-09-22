import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { ScanBarcode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { BarcodeInputController } from './barcode-input-controller'
import './barcode-input.css'

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  )
}

function hasOpenDialog(): boolean {
  return Boolean(document.querySelector('[data-slot="dialog-content"]'))
}

export function BarcodeInput() {
  const [controller] = useState(() => new BarcodeInputController())
  const [isExpanded, setIsExpanded] = useState(false)
  const [value, setValue] = useState('')

  const focusInput = useCallback(
    () => window.requestAnimationFrame(() => controller.focus()),
    [controller],
  )

  useEffect(() => {
    focusInput()
  }, [focusInput])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'F2' && !isTextEntryTarget(event.target)) {
        event.preventDefault()
        setIsExpanded(true)
        focusInput()
        return
      }

      if (event.key === 'Escape' && isExpanded && controller.isFocused()) {
        event.preventDefault()
        setIsExpanded(false)
        focusInput()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controller, focusInput, isExpanded])

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
      // eslint-disable-next-line no-console -- Первый этап требует технический лог завершённого ввода.
      console.log('barcode completed', { timestamp: new Date().toISOString(), value: barcode })
    }

    focusInput()
  }

  return (
    <section className="barcode-input" aria-label="Сканирование штрихкода">
      <div className="barcode-input__status">
        <ScanBarcode aria-hidden="true" />
        <span>Сканирование штрихкода</span>
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
}
