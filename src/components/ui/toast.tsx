import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import { OctagonXIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const toast = ToastPrimitive.createToastManager()

function ToastIcon({ type }: { type: string | undefined }) {
  if (type !== 'error') return null
  return <OctagonXIcon className="size-4 shrink-0 text-destructive" aria-hidden="true" />
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      className="pointer-events-auto absolute right-0 bottom-0 flex w-full items-center gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
    >
      <ToastIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <ToastPrimitive.Title className="text-sm font-medium" />
        <ToastPrimitive.Description className="text-sm text-muted-foreground" />
      </div>
      <ToastPrimitive.Close
        aria-label="Закрыть уведомление"
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <XIcon aria-hidden="true" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

function Toaster({
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props & { toastManager?: typeof toast }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

// The toast manager is part of shadcn's public component API.
// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast }
