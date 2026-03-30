import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/shared/utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium transition-colors', {
  variants: {
    variant: {
      default: 'border-transparent bg-grimoire-gold text-grimoire-deep',
      secondary: 'border-grimoire-border bg-grimoire-hover text-grimoire-muted',
      destructive: 'border-transparent bg-grimoire-status-dropped-bg text-grimoire-status-dropped-text',
      outline: 'border-grimoire-border text-grimoire-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
