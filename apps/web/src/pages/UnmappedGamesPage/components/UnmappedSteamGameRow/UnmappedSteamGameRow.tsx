import { UnmappedGame } from '@grimoire/shared';

import UnmappedGameRow from '@/pages/UnmappedGamesPage/components/UnmappedGameRow/UnmappedGameRow';

interface IUnmappedSteamGameRow {
  game: UnmappedGame;
  onMapClick: (game: UnmappedGame) => void;
  onDeleteClick: (game: UnmappedGame) => void;
}

function UnmappedSteamGameRow({ game, onMapClick, onDeleteClick }: IUnmappedSteamGameRow) {
  return <UnmappedGameRow game={game} hoverImageClassName='h-44 w-32' onMapClick={onMapClick} onDeleteClick={onDeleteClick} />;
}

export default UnmappedSteamGameRow;
