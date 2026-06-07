import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsBootstrapped, selectMustChangePassword, selectSession } from '@/store/state/auth/selectors';
import { getSession } from '@/store/thunks/auth/index';

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const isBootstrapped = useAppSelector(selectIsBootstrapped);
  const session = useAppSelector(selectSession);
  const mustChangePassword = useAppSelector(selectMustChangePassword);
  const location = useLocation();

  useEffect(function bootstrapSession() {
    if (!isBootstrapped) {
      dispatch(getSession());
    }
  }, []);

  if (!isBootstrapped) {
    return renderLoadingSkeleton();
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (mustChangePassword && location.pathname !== ROUTES.CHANGE_PASSWORD) {
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
