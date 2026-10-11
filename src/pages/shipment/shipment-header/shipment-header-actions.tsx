import { useState } from 'react'
import type { ReactNode } from 'react'

import { Printer, Send } from 'lucide-react'

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
import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

type ShipmentHeaderActionButtonProps = {
  icon: ReactNode
  label: string
  onClick?: () => void
  shortcut: string
  title: string
}

function ShipmentHeaderActionButton({
  icon,
  label,
  onClick,
  shortcut,
  title,
}: ShipmentHeaderActionButtonProps) {
  return (
    <UnavailableButton
      variant="outline"
      size="sm"
      onClick={onClick}
      shortcut={shortcut}
      title={title}
    >
      {icon}
      {label}
    </UnavailableButton>
  )
}

export function SendTo1CButton() {
  const handleClick = () => {
    console.info('Отправка ТМ в 1С')
  }

  return (
    <ShipmentHeaderActionButton
      label={commands.sendTo1C.label}
      shortcut={shipmentShortcuts.sendTo1C}
      title={commands.sendTo1C.description}
      icon={<Send aria-hidden="true" />}
      onClick={handleClick}
    />
  )
}

export function ReceiveSSCCButton() {
  const handleClick = () => {
    console.info('Получить SSCC')
  }

  return (
    <ShipmentHeaderActionButton
      label={commands.receiveSSCC.label}
      shortcut={shipmentShortcuts.receiveSSCC}
      title={commands.receiveSSCC.description}
      icon={<Send aria-hidden="true" />}
      onClick={handleClick}
    />
  )
}

export function ReceiveLabelsButton() {
  const handleClick = () => {
    console.info('Получить маркировки')
  }

  return (
    <ShipmentHeaderActionButton
      label={commands.receiveLabels.label}
      shortcut={shipmentShortcuts.receiveLabels}
      title={commands.receiveLabels.description}
      icon={<Send aria-hidden="true" />}
      onClick={handleClick}
    />
  )
}

export function RepeatShipmentButton() {
  const handleClick = () => {
    console.info('Повторная отправка')
  }

  return (
    <ShipmentHeaderActionButton
      label={commands.repeatShipment.label}
      shortcut={shipmentShortcuts.repeatShipment}
      title={commands.repeatShipment.description}
      icon={<Send aria-hidden="true" />}
      onClick={handleClick}
    />
  )
}

export function PrintTMLabelButton() {
  const handleClick = () => {
    console.info('Печать этикетки ТМ')
  }

  return (
    <ShipmentHeaderActionButton
      label={commands.printLabel.label}
      shortcut={shipmentShortcuts.printLabel}
      title={commands.printLabel.description}
      icon={<Printer aria-hidden="true" />}
      onClick={handleClick}
    />
  )
}

export function PrintReportsButton() {
  const [open, setOpen] = useState(false)
  const [selectedReports, setSelectedReports] = useState(['Отчет 1'])

  const shortcut = shipmentShortcuts.printReports
  const openReports = () => {
    if (!open) setOpen(true)
  }
  useShortcut(shortcut, openReports, { accepts: () => !open })

  const reports = ['Отчет 1', 'Отчет 2', 'Отчет 3']

  const handlePrint = () => {
    console.info('Печать отчетов', selectedReports)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openReports}
        shortcut={shortcut}
        title={commands.printReports.description}
      >
        <Printer aria-hidden="true" />
        {commands.printReports.label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Печать</DialogTitle>
            <DialogDescription>Выберите отчеты для печати.</DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-3 py-2">
            <legend className="sr-only">Выбор отчетов</legend>
            {reports.map((report) => (
              <label key={report} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report)}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setSelectedReports((selected) =>
                      checked
                        ? [...selected, report]
                        : selected.filter((value) => value !== report),
                    )
                  }}
                />
                <span>{report}</span>
              </label>
            ))}
          </fieldset>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button disabled={selectedReports.length === 0} onClick={handlePrint}>
              Печать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ShipmentHeaderActions() {
  return (
    <div className="order-actions" aria-label="Обмен и печать">
      <SendTo1CButton />
      <RepeatShipmentButton />
      <PrintTMLabelButton />
      <PrintReportsButton />
    </div>
  )
}
