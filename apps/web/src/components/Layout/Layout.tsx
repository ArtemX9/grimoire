import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';

function Layout() {
  return (
    <div className='flex h-svh w-full overflow-hidden bg-grimoire-deep'>
      <Sidebar />
      {/* On mobile the fixed bottom nav is ~56px tall; add matching padding so content is never clipped */}
      <main className='flex-1 overflow-y-auto pb-14 sm:pb-0'>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
