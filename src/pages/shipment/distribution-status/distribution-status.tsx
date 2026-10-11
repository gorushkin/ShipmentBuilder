import { cn } from 'cn'
import { CheckCircle2, CircleAlert, History, Info, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/ui/button'
import type { HistoryEvent } from '@/features/action-history'
import { commands } from '@/features/command-config'
import { useShortcut } from '@/features/keyboard-input'
import { scannerWorkflowOrchestrator } from '@/features/scanner-workflow'
import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'

const eventClassNames: Record<HistoryEvent['level'], string> = {
  error: 'text-error',
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
}

const eventIcons = {
  error: CircleAlert,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
}
const eventTime = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function EventMessage({ event }: { event: HistoryEvent }) {
  const Icon = eventIcons[event.level]

  return (
    <div className={cn('flex min-w-0 items-center gap-[9px]', eventClassNames[event.level])}>
      <Icon className="size-4 flex-none" aria-hidden="true" />
      <div
        className="flex min-w-0 items-baseline gap-[9px]"
        title={[event.title, event.description].filter(Boolean).join(' ')}
      >
        <strong className="max-w-full shrink-0 truncate font-semibold">{event.title}</strong>
        {event.description && <span className="truncate text-[#6c798c]">{event.description}</span>}
      </div>
    </div>
  )
}

export const DistributionStatus = observer(function DistributionStatus() {
  const history = scannerWorkflowOrchestrator.actionHistory
  const latest = history.latestEvent
  const command = commands.historyToggle
  const shortcut = shipmentShortcuts.historyToggle

  useShortcut(shortcut, () => history.toggle(), {
    accepts: (context) => !context.editing || context.targetId === 'barcode-input',
    whenEditing: 'allow',
  })

  return (
    <section className="relative min-w-0 text-xs leading-normal" aria-label="История действий">
      <div className="flex min-h-8 items-center gap-3 pl-1">
        <div className="min-w-0 flex-1" role="status">
          {latest && <EventMessage event={latest} />}
        </div>
        <Button
          className="flex-none text-[11px] leading-[1.428571]"
          aria-controls="action-history-list"
          aria-expanded={history.isExpanded}
          onClick={() => history.toggle()}
          shortcut={shortcut}
          size="sm"
          title={command.description}
          type="button"
          variant="outline"
        >
          <History aria-hidden="true" />
          {command.label}
        </Button>
      </div>
      {history.isExpanded && (
        <ol
          className="absolute inset-x-0 top-[calc(100%+6px)] z-10 m-0 max-h-[242px] list-none overflow-y-auto overscroll-contain rounded-lg border border-summary-border bg-card p-0 shadow-[0_8px_24px_#2330471a] [scrollbar-gutter:stable]"
          id="action-history-list"
          aria-label="События, сначала новые"
          tabIndex={0}
        >
          {history.newestFirst.map((event) => (
            <li
              className="grid h-12 grid-cols-[68px_minmax(0,1fr)] items-center gap-3 border-b border-[#edf0f5] px-3 last:border-b-0"
              key={event.id}
            >
              <time
                className="text-subtle-foreground tabular-nums"
                dateTime={new Date(event.timestamp).toISOString()}
              >
                {eventTime.format(event.timestamp)}
              </time>
              <EventMessage event={event} />
            </li>
          ))}
          {history.entries.length === 0 && (
            <li className="grid h-12 items-center px-3">История пока пуста</li>
          )}
        </ol>
      )}
    </section>
  )
})
