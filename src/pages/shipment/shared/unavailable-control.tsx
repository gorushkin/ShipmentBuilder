import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

type UnavailableButtonProps = ComponentProps<typeof Button>

export function UnavailableButton({
  title = 'Будет доступно в следующих версиях прототипа',
  ...buttonProps
}: UnavailableButtonProps) {
  return <Button {...buttonProps} disabled title={title} />
}
