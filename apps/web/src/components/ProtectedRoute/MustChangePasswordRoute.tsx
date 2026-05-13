import { Navigate, Outlet } from 'react-router-dom';

import { useSession } from '@/api/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';

export function MustChangePasswordRoute() {
  const sessionQuery = useSession();

  const isBootstrapped = sessionQuery.status !== 'pending';
  const session = sessionQuery.data;

  if (!isBootstrapped) {
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

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!session.user.mustChangePassword) {
    return <Navigate to={ROUTES.DEFAULT} replace />;
  }

  return <Outlet />;
}
