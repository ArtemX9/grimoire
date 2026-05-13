import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSession } from '@/api/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';

export function ProtectedRoute() {
  const sessionQuery = useSession();
  const location = useLocation();

  const isBootstrapped = sessionQuery.status !== 'pending';
  const session = sessionQuery.data;

  if (!isBootstrapped) {
    return renderLoadingSkeleton();
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (session.user.mustChangePassword && location.pathname !== ROUTES.CHANGE_PASSWORD) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
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
