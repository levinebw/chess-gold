import type { Square } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';

export function LootBoxCounter() {
  const ctx = useGameContext();
  const { state } = ctx;

  if (!state.modeConfig.winConditions.includes('loot-boxes-collected')) return null;

  const target = CHESS_GOLD_CONFIG.lootBox.boxesToWin;

  const hittableLootBoxes = 'hittableLootBoxes' in ctx ? ctx.hittableLootBoxes as { lootBoxSquare: Square; pieceSquares: Square[] }[] : [];
  const selectingHitPiece = 'selectingHitPiece' in ctx ? ctx.selectingHitPiece as boolean : false;
  const hittingPieceSquare = 'hittingPieceSquare' in ctx ? ctx.hittingPieceSquare as Square | null : null;
  const startHitSelection = 'startHitSelection' in ctx ? ctx.startHitSelection as () => void : undefined;
  const cancelPlacement = ctx.cancelPlacement;
  const isBotTurn = 'isBotTurn' in ctx ? ctx.isBotTurn : false;

  const isGameOver = state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw';
  const canHit = hittableLootBoxes.length > 0 && !isGameOver && !isBotTurn;
  const isInHitMode = selectingHitPiece || hittingPieceSquare !== null;

  return (
    <div className="loot-counter">
      <div className="loot-counter-row">
        <span className="loot-counter-label">Loot Boxes</span>
        <span className="loot-counter-scores">
          <span className="loot-counter-white">
            W {state.lootBoxesCollected.white}/{target}
          </span>
          <span className="loot-counter-sep">{'\u2014'}</span>
          <span className="loot-counter-black">
            B {state.lootBoxesCollected.black}/{target}
          </span>
        </span>
      </div>
      {state.lootBoxes.length > 0 && (
        <div className="loot-hit-controls">
          {isInHitMode ? (
            <button className="hit-button cancel" onClick={cancelPlacement}>
              Cancel
            </button>
          ) : (
            <button
              className="hit-button"
              disabled={!canHit}
              onClick={startHitSelection}
              title={canHit ? 'Select a piece to hit an adjacent loot box' : 'No pieces adjacent to a loot box'}
            >
              Hit Loot Box
            </button>
          )}
          {selectingHitPiece && (
            <div className="placement-hint">Click a highlighted piece to hit with.</div>
          )}
          {hittingPieceSquare !== null && (
            <div className="placement-hint">Click a yellow loot box to hit it.</div>
          )}
        </div>
      )}
    </div>
  );
}
