import { UnmappedGame } from '@grimoire/shared';

import UnmappedGameRow from '../UnmappedGameRow/UnmappedGameRow';

interface IUnmappedXboxGameRow {
  game: UnmappedGame;
  onMapClick: (game: UnmappedGame) => void;
  onDeleteClick: (game: UnmappedGame) => void;
}

function UnmappedXboxGameRow({ game, onMapClick, onDeleteClick }: IUnmappedXboxGameRow) {
  return <UnmappedGameRow game={game} hoverImageClassName='h-40 w-40' onMapClick={onMapClick} onDeleteClick={onDeleteClick} />;
}

export default UnmappedXboxGameRow;
