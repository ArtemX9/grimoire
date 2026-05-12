import { useGetUnmappedGames } from '@/api/unmappedGames';

import UnresolvedGamesBanner from './UnresolvedGamesBanner';

function UnresolvedGamesBannerContainer() {
  const { data = [] } = useGetUnmappedGames({});

  return <UnresolvedGamesBanner count={data.length} />;
}

export default UnresolvedGamesBannerContainer;
