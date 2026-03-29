import * as React from 'react'

import { cn } from '@/shared/utils/cn'

function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className='relative w-full overflow-auto'>
      <table
        className={cn('w-full caption-bottom font-sans text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-grimoire-border', className)} {...props} />
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-grimoire-border transition-colors hover:bg-grimoire-hover',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-3 text-left align-middle font-sans text-xs font-medium text-grimoire-muted',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-3 py-3 align-middle text-grimoire-ink', className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }