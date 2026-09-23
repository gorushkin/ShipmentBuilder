import { toast } from '@/components/ui/toast'

import type { AlertService } from './alert-service'

export const shadcnToastAlertService: AlertService = {
  publish: (alert) => {
    toast.add({ title: alert.message, type: alert.type })
  },
}
