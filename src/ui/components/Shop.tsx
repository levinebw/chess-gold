import type { PurchasableRole } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';
import { GoldCoin } from './GoldCoin.tsx';

const PIECE_DISPLAY: { role: PurchasableRole; label: string; symbol: string }[] = [
  { role: 'pawn', label: 'Pawn', symbol: '♟' },
  { role: 'knight', label: 'Knight', symbol: '♞' },
  { role: 'bishop', label: 'Bishop', symbol: '♝' },
  { role: 'rook', label: 'Rook', symbol: '♜' },
  { role: 'queen', label: 'Queen', symbol: '♛' },
];

export function Shop() {
  const { state, config, canAfford, placingPiece, startPlacement } = useGameContext();

  const isGameOver = state.status === 'checkmate' || state.status === 'stalemate';

  return (
    <div className="shop">
      <h3>Shop</h3>
      <div className="shop-pieces">
        {PIECE_DISPLAY.map(({ role, label, symbol }) => {
          const price = config.piecePrices[role];
          const affordable = canAfford(role);
          const isSelected = placingPiece === role;

          return (
            <button
              key={role}
              className={`shop-piece ${isSelected ? 'selected' : ''} ${!affordable ? 'disabled' : ''}`}
              disabled={!affordable || isGameOver}
              onClick={() => startPlacement(role)}
            >
              <span className="piece-symbol">{symbol}</span>
              <span className="piece-label">{label}</span>
              <span className="piece-price">{price}<GoldCoin size={14}/></span>
            </button>
          );
        })}
      </div>
      {placingPiece && (
        <div className="placement-hint">
          Click a highlighted square to place. Esc to cancel.
        </div>
      )}
    </div>
  );
}
