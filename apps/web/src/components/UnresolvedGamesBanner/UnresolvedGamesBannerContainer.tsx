import { useGetUnmappedGamesQuery } from '@/api/unmappedGamesApi';

import UnresolvedGamesBanner from './UnresolvedGamesBanner';

function UnresolvedGamesBannerContainer() {
  const { data = [] } = useGetUnmappedGamesQuery({});

  return <UnresolvedGamesBanner count={data.length} />;
}

export default UnresolvedGamesBannerContainer;
