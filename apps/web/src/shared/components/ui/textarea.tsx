import * as React from 'react';

import { cn } from '@/shared/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded border border-grimoire-border bg-grimoire-input px-3 py-2 font-sans text-sm text-grimoire-ink placeholder:text-grimoire-muted focus:outline-none focus:ring-2 focus:ring-grimoire-gold focus:border-grimoire-border-lg disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
