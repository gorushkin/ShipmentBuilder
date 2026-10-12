import { shadcnToastAlertService } from '@/features/application-alerts'

import { KeyboardManager } from './keyboard-manager'

export const keyboard = new KeyboardManager({
  onError: () =>
    shadcnToastAlertService.publish({
      code: 'keyboard-handler-error',
      message: 'Не удалось выполнить действие клавиатуры',
      type: 'error',
    }),
})
