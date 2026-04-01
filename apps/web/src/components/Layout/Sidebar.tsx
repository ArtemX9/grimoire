import { BookOpen, Library, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

function Sidebar() {
  return (
    <aside className='flex h-full w-14 flex-col items-center border-r border-grimoire-border bg-grimoire-card py-4 sm:w-52 sm:items-start sm:px-3'>
      <div className='mb-8 flex items-center gap-2 px-1'>
        <BookOpen className='h-5 w-5 text-grimoire-gold shrink-0' />
        <span className='hidden font-grimoire text-base text-grimoire-ink sm:block'>Grimoire</span>
      </div>

      <nav className='flex flex-col gap-1 w-full'>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded px-2 py-2 font-sans text-sm transition-colors',
                isActive ? 'bg-grimoire-hover text-grimoire-gold' : 'text-grimoire-muted hover:bg-grimoire-hover hover:text-grimoire-ink',
              )
            }
          >
            <Icon className='h-4 w-4 shrink-0' />
            <span className='hidden sm:block'>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
