import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className='flex h-svh w-full overflow-hidden bg-grimoire-deep'>
      <Sidebar />
      <main className='flex-1 overflow-y-auto'>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
