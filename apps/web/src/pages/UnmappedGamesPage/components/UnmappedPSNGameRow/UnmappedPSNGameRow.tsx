import { UnmappedGame } from '@grimoire/shared';

import UnmappedGameRow from '../UnmappedGameRow/UnmappedGameRow';

interface IUnmappedPSNGameRow {
  game: UnmappedGame;
  onMapClick: (game: UnmappedGame) => void;
  onDeleteClick: (game: UnmappedGame) => void;
}

function UnmappedPSNGameRow({ game, onMapClick, onDeleteClick }: IUnmappedPSNGameRow) {
  return <UnmappedGameRow game={game} hoverImageClassName='h-44 w-32' onMapClick={onMapClick} onDeleteClick={onDeleteClick} />;
}

export default UnmappedPSNGameRow;
