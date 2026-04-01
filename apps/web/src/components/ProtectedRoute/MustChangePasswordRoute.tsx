import { Navigate, Outlet } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/store/hooks';

export function MustChangePasswordRoute() {
  const { session, isBootstrapped } = useAppSelector((s) => s.auth);

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
