export type ApplicationAlert = {
  code: string
  message: string
  type: 'error'
}

export interface AlertService {
  publish(alert: ApplicationAlert): void
}

export const noopAlertService: AlertService = {
  publish: () => undefined,
}
