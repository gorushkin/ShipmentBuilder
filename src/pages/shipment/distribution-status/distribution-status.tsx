import { CheckCircle2, CircleAlert, History, Info, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/ui/button'
import type { HistoryEvent } from '@/features/action-history'
import { commands } from '@/features/command-config'
import { useShortcut } from '@/features/keyboard-input'
import { scannerWorkflowOrchestrator } from '@/features/scanner-workflow'
import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'

import './distribution-status.css'

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
    <div className={`history-event history-event--${event.level}`}>
      <Icon aria-hidden="true" />
      <div
        className="history-event__message"
        title={[event.title, event.description].filter(Boolean).join(' ')}
      >
        <strong>{event.title}</strong>
        {event.description && <span>{event.description}</span>}
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
    <section className="action-history" aria-label="История действий">
      <div className="action-history__summary">
        <div className="action-history__latest" role="status">
          {latest && <EventMessage event={latest} />}
        </div>
        <Button
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
          className="action-history__list"
          id="action-history-list"
          aria-label="События, сначала новые"
          tabIndex={0}
        >
          {history.newestFirst.map((event) => (
            <li key={event.id}>
              <time dateTime={new Date(event.timestamp).toISOString()}>
                {eventTime.format(event.timestamp)}
              </time>
              <EventMessage event={event} />
            </li>
          ))}
          {history.entries.length === 0 && <li>История пока пуста</li>}
        </ol>
      )}
    </section>
  )
})
