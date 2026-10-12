import { useId } from 'react'

import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

import { formatShortcut } from '@/features/keyboard-input'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all cursor-pointer outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-100 disabled:text-disabled-foreground disabled:bg-disabled disabled:border-disabled-border aria-disabled:opacity-100 aria-disabled:text-disabled-foreground aria-disabled:bg-disabled aria-disabled:border-disabled-border aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default:
          'h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-9',
        'icon-lg': 'size-10',
        'icon-sm':
          'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        lg: 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        sm: 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        outline:
          'border-border bg-card shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
      },
    },
  },
)

function Button({
  children,
  className,
  id,
  shortcut,
  size = 'default',
  title,
  variant = 'default',
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    shortcut?: string
  }) {
  const generatedId = useId()
  const buttonId = id ?? generatedId
  const descriptionId = `${generatedId}-description`
  const formatted = shortcut ? formatShortcut(shortcut) : null
  const disabled = Boolean(
    props.disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true',
  )
  const description =
    title ?? props['aria-label'] ?? (typeof children === 'string' ? children : undefined)
  const nativeTitle =
    [description, formatted && `(${formatted.label})`].filter(Boolean).join(' ') || undefined
  const hasDescription = Boolean(formatted || title)
  const iconOnly = size?.startsWith('icon')
  const keycap = formatted && (
    <kbd
      aria-hidden="true"
      data-slot="kbd"
      className="shrink-0 rounded border border-current/20 bg-current/5 px-1 py-0.5 font-sans text-[10px] leading-none font-medium whitespace-nowrap"
    >
      {formatted.label}
    </kbd>
  )
  const button = (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
      id={buttonId}
      title={disabled && hasDescription ? undefined : nativeTitle}
      aria-describedby={
        [props['aria-describedby'], hasDescription && descriptionId].filter(Boolean).join(' ') ||
        undefined
      }
      aria-keyshortcuts={disabled ? undefined : (formatted?.aria ?? props['aria-keyshortcuts'])}
    >
      {children}
      {!iconOnly && keycap}
    </ButtonPrimitive>
  )
  if (!hasDescription) return button

  return (
    <>
      <span id={descriptionId} className="sr-only">
        {description}
        {formatted && <>. Сочетание клавиш: {formatted.label}</>}
      </span>
      {disabled ? (
        <span
          className="inline-grid min-w-0 [&>button]:w-full cursor-not-allowed rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&>button]:pointer-events-none"
          role="group"
          tabIndex={0}
          aria-labelledby={buttonId}
          aria-describedby={descriptionId}
          title={nativeTitle}
        >
          {button}
        </span>
      ) : (
        button
      )}
    </>
  )
}

// The variant helper is part of shadcn's public component API.
// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
