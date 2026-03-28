import * as React from 'react'

import { cn } from '@/shared/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded border border-grimoire-border bg-grimoire-input px-3 py-2 font-sans text-sm text-grimoire-ink placeholder:text-grimoire-muted focus:outline-none focus:ring-2 focus:ring-grimoire-gold focus:border-grimoire-border-lg disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }