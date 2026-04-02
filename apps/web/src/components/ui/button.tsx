import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold focus-visible:ring-offset-2 focus-visible:ring-offset-grimoire-deep disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-grimoire-gold text-grimoire-deep hover:bg-grimoire-gold-bright',
        destructive:
          'bg-grimoire-status-dropped-bg text-grimoire-status-dropped-text border border-grimoire-status-dropped-text/30 hover:bg-grimoire-status-dropped-text/10',
        outline: 'border border-grimoire-border bg-transparent text-grimoire-ink hover:bg-grimoire-hover hover:border-grimoire-border-lg',
        secondary: 'bg-grimoire-hover text-grimoire-ink hover:bg-grimoire-border',
        ghost: 'text-grimoire-muted hover:bg-grimoire-hover hover:text-grimoire-ink',
        link: 'text-grimoire-gold underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded px-3 text-xs',
        lg: 'h-11 rounded px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
