import { Navigate, Outlet } from 'react-router-dom'

import { useGetSessionQuery } from '@/features/auth/authApi'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function MustChangePasswordRoute() {
  const { data: session, isLoading } = useGetSessionQuery()

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-grimoire-deep'>
        <div className='flex flex-col items-center gap-4'>
          <Skeleton className='h-8 w-48 rounded' />
          <Skeleton className='h-4 w-32 rounded' />
          <Skeleton className='h-4 w-40 rounded' />
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to='/login' replace />
  }

  if (!session.user.mustChangePassword) {
    return <Navigate to='/' replace />
  }

  return <Outlet />
}