import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useIsMobile } from '@/hooks/useMobile';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAiEnabled } from '@/store/state/auth/selectors';
import { toggleAIDrawer } from '@/store/state/ui/index';
import { selectIsAIDrawerOpen } from '@/store/state/ui/selectors';
import { selectUnmappedGamesCount } from '@/store/state/unmappedGames/selectors';
import { getUnmappedGames } from '@/store/thunks/unmappedGames/index';

import Sidebar from './Sidebar';

function SidebarContainer() {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const isAIDrawerOpen = useAppSelector(selectIsAIDrawerOpen);
  const aiEnabled = useAppSelector(selectAiEnabled);
  const unresolvedCount = useAppSelector(selectUnmappedGamesCount);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(function fetchUnmappedGamesOnMount() {
    dispatch(getUnmappedGames({}));
  }, []);

  function handleAIClick() {
    if (location.pathname !== ROUTES.DEFAULT) {
      navigate(ROUTES.DEFAULT);
    }
    dispatch(toggleAIDrawer());
  }

  return (
    <Sidebar
      isMobile={isMobile}
      isAIDrawerOpen={isAIDrawerOpen}
      aiEnabled={aiEnabled}
      unresolvedCount={unresolvedCount}
      onAIClick={handleAIClick}
    />
  );
}

export default SidebarContainer;
