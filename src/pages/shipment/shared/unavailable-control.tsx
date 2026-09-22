import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type UnavailableButtonProps = ComponentProps<typeof Button> & {
  tooltip?: ReactNode
  triggerClassName?: string
}

export function UnavailableButton({
  tooltip = 'Будет доступно в следующих версиях прототипа',
  triggerClassName,
  ...buttonProps
}: UnavailableButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className={['disabled-control', triggerClassName].filter(Boolean).join(' ')} />
        }
      >
        <Button {...buttonProps} disabled />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
