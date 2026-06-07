import { useAppSelector } from '@/store/hooks';
import { selectUnmappedGamesCount } from '@/store/state/unmappedGames/selectors';

import UnresolvedGamesBanner from './UnresolvedGamesBanner';

function UnresolvedGamesBannerContainer() {
  const count = useAppSelector(selectUnmappedGamesCount);

  return <UnresolvedGamesBanner count={count} />;
}

export default UnresolvedGamesBannerContainer;
