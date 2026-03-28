import { cn } from '@/shared/utils/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-grimoire-hover', className)}
      {...props}
    />
  )
}

export { Skeleton }