import { useRef, useState } from 'react'

import { Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

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
import { commands } from '@/features/command-config'
import { useShortcut } from '@/features/keyboard-input'
import { scannerWorkflowOrchestrator } from '@/features/scanner-workflow'
import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'

export const DeleteTransportPlaceAction = observer(function DeleteTransportPlaceAction() {
  const workflow = scannerWorkflowOrchestrator
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const shortcut = shipmentShortcuts.deleteTransportPlace

  const activePlace = workflow.getDestinationRows('transport-places').find((row) => row.isActive)
  const available = () => !target && workflow.canDeleteTransportPlace(activePlace?.id ?? null)
  const open = () => {
    if (!available() || !activePlace) return
    setError(null)
    setTarget({ id: activePlace.id, name: activePlace.name })
  }

  useShortcut(shortcut, open, { accepts: available })

  const targetPlace = workflow
    .getDestinationRows('transport-places')
    .find((row) => row.id === target?.id)
  const hasProducts = Boolean(targetPlace && targetPlace.units > 0)
  const confirm = () => {
    if (!target) return
    if (!workflow.deleteTransportPlace(target.id)) {
      setError('Не удалось удалить ТМ. Оно отсутствует или другая операция ещё не завершена.')
      return
    }
    setTarget(null)
  }

  return (
    <>
      <Button
        disabled={!available()}
        onClick={open}
        shortcut={shortcut}
        size="sm"
        title={commands.deleteTransportPlace.description}
        variant="outline"
      >
        <Trash2 aria-hidden="true" />
        {commands.deleteTransportPlace.label}
      </Button>
      <Dialog
        open={Boolean(target)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTarget(null)
        }}
      >
        <DialogContent initialFocus={cancelRef} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Удалить {target?.name}?</DialogTitle>
            <DialogDescription>
              {hasProducts
                ? `Все товары из ${target?.name} будут возвращены в «К распределению», затем место будет удалено.`
                : 'Транспортное место пустое и будет удалено.'}
            </DialogDescription>
          </DialogHeader>
          {error && <p role="alert">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button ref={cancelRef} variant="outline" />}>Отмена</DialogClose>
            <Button
              disabled={!workflow.canDeleteTransportPlace(target?.id ?? null)}
              onClick={confirm}
              variant="destructive"
            >
              {hasProducts ? 'Вернуть товары и удалить' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
