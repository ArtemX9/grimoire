import { Outlet } from 'react-router-dom';

import SidebarContainer from './SidebarContainer';

function Layout() {
  return (
    <div className='flex h-svh w-full overflow-hidden bg-grimoire-deep pt-[env(safe-area-inset-top)]'>
      <SidebarContainer />
      {/* Mobile bottom nav is ~56px + home-indicator inset; pad main by the same so content is never clipped */}
      <main className='flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0'>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
