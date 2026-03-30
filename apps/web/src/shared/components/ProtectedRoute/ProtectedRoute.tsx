import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useGetSessionQuery } from '@/features/auth/authApi';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function ProtectedRoute() {
  const { data: session, isLoading } = useGetSessionQuery();
  const location = useLocation();

  if (isLoading) {
    return renderLoadingSkeleton();
  }

  if (!session) {
    return <Navigate to='/login' replace />;
  }

  if (session.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to='/change-password' replace />;
  }

  return <Outlet />;

  function renderLoadingSkeleton() {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-grimoire-deep'>
        <div className='flex flex-col items-center gap-4'>
          <Skeleton className='h-8 w-48 rounded' />
          <Skeleton className='h-4 w-32 rounded' />
          <Skeleton className='h-4 w-40 rounded' />
        </div>
      </div>
    );
  }
}
