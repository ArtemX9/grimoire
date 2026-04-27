import { AlertTriangle, BookOpen, Library, Settings, Sparkles } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useGetUnmappedGamesQuery } from '@/api/unmappedGamesApi';
import { ROUTES } from '@/constants/routes';
import { useIsMobile } from '@/hooks/useMobile';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleAIDrawer } from '@/store/uiSlice';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: ROUTES.LIBRARY, label: 'Library', icon: Library },
  { to: ROUTES.UNMAPPED_GAMES, label: 'Unresolved', icon: AlertTriangle },
  { to: ROUTES.USER_SETTINGS, label: 'Settings', icon: Settings },
] as const;

function Sidebar() {
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();
  const isAIDrawerOpen = useAppSelector((s) => s.ui.isAIDrawerOpen);
  const aiEnabled = useAppSelector((s) => s.auth.session?.user.aiEnabled ?? false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: unmappedGames } = useGetUnmappedGamesQuery({});
  const unresolvedCount = unmappedGames?.length ?? 0;
  const unresolvedBadgeLabel = unresolvedCount > 99 ? '99+' : String(unresolvedCount);

  function handleAIClick() {
    if (location.pathname !== ROUTES.LIBRARY) {
      navigate(ROUTES.LIBRARY);
    }
    dispatch(toggleAIDrawer());
  }

  if (isMobile) return renderMobileNav();

  return renderDesktopSidebar();

  function renderUnresolvedBadge() {
    if (unresolvedCount === 0) return null;

    return (
      <span className='absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 font-sans text-[9px] font-medium leading-none text-white'>
        {unresolvedBadgeLabel}
      </span>
    );
  }

  function renderMobileNav() {
    return (
      <nav className='fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-grimoire-border bg-grimoire-card px-2 pb-[env(safe-area-inset-bottom)]'>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 px-6 py-3 font-sans text-[10px] transition-colors',
                isActive
                  ? 'text-grimoire-gold'
                  : to === ROUTES.UNMAPPED_GAMES && unresolvedCount > 0
                    ? 'text-grimoire-status-wishlist-text'
                    : 'text-grimoire-muted',
              )
            }
          >
            <span className='relative'>
              <Icon className='h-6 w-6 shrink-0' />
              {to === ROUTES.UNMAPPED_GAMES && renderUnresolvedBadge()}
            </span>
            {label}
          </NavLink>
        ))}
        {aiEnabled && (
          <button
            onClick={handleAIClick}
            aria-label='Open AI recommendations'
            className={cn(
              'flex flex-col items-center gap-1 px-6 py-3 font-sans text-[10px] transition-colors',
              isAIDrawerOpen ? 'text-grimoire-gold' : 'text-grimoire-muted',
            )}
          >
            <Sparkles className='h-6 w-6 shrink-0' />
            AI Pick
          </button>
        )}
      </nav>
    );
  }

  function renderDesktopSidebar() {
    return (
      <aside className='flex h-full w-14 flex-col items-center border-r border-grimoire-border bg-grimoire-card py-4 sm:w-52 sm:items-start sm:px-3'>
        {renderLogo()}
        {renderDesktopNav()}
      </aside>
    );
  }

  function renderLogo() {
    return (
      <div className='mb-8 flex items-center gap-2 px-1'>
        <BookOpen className='h-5 w-5 text-grimoire-gold shrink-0' />
        <span className='hidden font-grimoire text-base text-grimoire-ink sm:block'>Grimoire</span>
      </div>
    );
  }

  function renderDesktopNav() {
    return (
      <nav className='flex flex-col gap-1 w-full'>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded px-2 py-2 font-sans text-sm transition-colors',
                isActive
                  ? 'bg-grimoire-hover text-grimoire-gold'
                  : to === ROUTES.UNMAPPED_GAMES && unresolvedCount > 0
                    ? 'text-grimoire-status-wishlist-text hover:bg-grimoire-hover hover:text-grimoire-status-wishlist-text'
                    : 'text-grimoire-muted hover:bg-grimoire-hover hover:text-grimoire-ink',
              )
            }
          >
            <span className='relative'>
              <Icon className='h-4 w-4 shrink-0' />
              {to === ROUTES.UNMAPPED_GAMES && renderUnresolvedBadge()}
            </span>
            <span className='hidden sm:block'>{label}</span>
          </NavLink>
        ))}
        {aiEnabled && (
          <button
            onClick={handleAIClick}
            aria-label='Open AI recommendations'
            className={cn(
              'flex lg:hidden items-center gap-3 rounded px-2 py-2 font-sans text-sm transition-colors',
              isAIDrawerOpen ? 'bg-grimoire-hover text-grimoire-gold' : 'text-grimoire-muted hover:bg-grimoire-hover hover:text-grimoire-ink',
            )}
          >
            <Sparkles className='h-4 w-4 shrink-0' />
            <span className='hidden sm:block'>AI Pick</span>
          </button>
        )}
      </nav>
    );
  }
}

export default Sidebar;
