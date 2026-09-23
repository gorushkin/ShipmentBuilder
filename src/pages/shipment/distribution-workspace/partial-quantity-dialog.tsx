import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Product } from '@/domain/shipment/types'
import { number } from '@/pages/shipment/shared/format'

type Direction = 'distribute' | 'return'

interface PartialQuantityDialogProps {
  context: { maximum: number; product: Product } | null
  direction: Direction | null
  error?: string | null
  onConfirm: (quantity: number) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function PartialQuantityDialog({
  context,
  direction,
  error,
  onConfirm,
  onOpenChange,
  open,
}: PartialQuantityDialogProps) {
  const [value, setValue] = useState('')

  const quantity = Number(value)
  const isValid = Boolean(
    context &&
    /^\d+$/.test(value) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= context.maximum,
  )
  const isReturn = direction === 'return'
  const title = isReturn ? 'Вернуть количество' : 'Переместить количество'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={() => document.getElementById('partial-quantity')}
        finalFocus={() => document.getElementById('barcode-input')}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {context
              ? `${context.product.code} · ${context.product.name}. Доступно: ${number(context.maximum, 0)} ШТ.`
              : 'Выберите товарную строку для операции.'}
          </DialogDescription>
        </DialogHeader>

        {context?.product.isMarked && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            Подтверждение КМ/КА будет добавлено позже. Сейчас выполняется только количественная
            операция.
          </p>
        )}

        <label className="grid gap-2 font-medium" htmlFor="partial-quantity">
          Количество, ШТ
          <input
            aria-describedby="partial-quantity-hint"
            id="partial-quantity"
            inputMode="numeric"
            max={context?.maximum}
            min={1}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              if (value.trim().toUpperCase() === 'CMD:CANCEL') onOpenChange(false)
              else if (isValid) onConfirm(quantity)
            }}
            placeholder="Введите количество"
            step={1}
            type="text"
            value={value}
          />
          <span className="text-sm font-normal text-muted-foreground" id="partial-quantity-hint">
            Только целые значения от 1 до {context ? number(context.maximum, 0) : '—'}.
          </span>
        </label>
        {error && <p role="alert">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
          <Button
            disabled={!isValid}
            onClick={() => {
              if (!isValid) return
              onConfirm(quantity)
            }}
          >
            {isReturn ? 'Вернуть' : 'Переместить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
