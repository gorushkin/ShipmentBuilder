import { useState } from 'react'
import type { ReactNode } from 'react'

import { Printer, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UnavailableButton } from '@/pages/shipment/shared/unavailable-control'

type ShipmentHeaderActionButtonProps = {
  icon: ReactNode
  label: string
  onClick?: () => void
}

function ShipmentHeaderActionButton({ icon, label, onClick }: ShipmentHeaderActionButtonProps) {
  return (
    <UnavailableButton variant="outline" size="sm" onClick={onClick}>
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
    <ShipmentHeaderActionButton label="Отправка ТМ в 1С" icon={<Send />} onClick={handleClick} />
  )
}

export function ReceiveSSCCButton() {
  const handleClick = () => {
    console.info('Получить SSCC')
  }

  return <ShipmentHeaderActionButton label="Получить SSCC" icon={<Send />} onClick={handleClick} />
}

export function ReceiveLabelsButton() {
  const handleClick = () => {
    console.info('Получить маркировки')
  }

  return (
    <ShipmentHeaderActionButton label="Получить маркировки" icon={<Send />} onClick={handleClick} />
  )
}

export function RepeatShipmentButton() {
  const handleClick = () => {
    console.info('Повторная отправка')
  }

  return (
    <ShipmentHeaderActionButton label="Повторная отправка" icon={<Send />} onClick={handleClick} />
  )
}

export function PrintTMLabelButton() {
  const handleClick = () => {
    console.info('Печать этикетки ТМ')
  }

  return (
    <ShipmentHeaderActionButton
      label="Печать этикетки ТМ"
      icon={<Printer />}
      onClick={handleClick}
    />
  )
}

export function PrintReportsButton() {
  const [open, setOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState('Отчет 1')

  const reports = ['Отчет 1', 'Отчет 2', 'Отчет 3']

  const handlePrint = () => {
    console.info('Печать отчета', selectedReport)
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Printer />
        Печать
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Печать</DialogTitle>
            <DialogDescription>Выберите отчет для печати.</DialogDescription>
          </DialogHeader>

          <RadioGroup
            aria-label="Выбор отчета"
            className="grid gap-3 py-2"
            onValueChange={setSelectedReport}
            value={selectedReport}
          >
            {reports.map((report) => (
              <label key={report} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={report} />
                <span>{report}</span>
              </label>
            ))}
          </RadioGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button onClick={handlePrint}>Печать</Button>
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
      <ReceiveSSCCButton />
      <ReceiveLabelsButton />
      <RepeatShipmentButton />
      <PrintTMLabelButton />
      <PrintReportsButton />
    </div>
  )
}
