import type { PurchasableRole, ItemType, Role } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';
import { GoldCoin } from './GoldCoin.tsx';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';

const PIECE_SYMBOLS: Record<string, string> = {
  pawn: '\u265F',
  knight: '\u265E',
  bishop: '\u265D',
  rook: '\u265C',
  queen: '\u265B',
};

const ITEM_DISPLAY: Record<ItemType, { label: string; icon: string }> = {
  crossbow: { label: 'Crossbow', icon: '\uD83C\uDFF9' },
  'turtle-shell': { label: 'Shell', icon: '\uD83D\uDEE1\uFE0F' },
  crown: { label: 'Crown', icon: '\uD83D\uDC51' },
};

export function InventoryPanel() {
  const ctx = useGameContext();
  const { state, dispatch } = ctx;

  const startInventoryPlacement = 'startInventoryPlacement' in ctx ? ctx.startInventoryPlacement as (piece: PurchasableRole) => void : undefined;
  const startEquip = 'startEquip' in ctx ? ctx.startEquip as (item: ItemType) => void : undefined;
  const equippingItem = 'equippingItem' in ctx ? ctx.equippingItem as ItemType | null : null;
  const placingFromInventory = 'placingFromInventory' in ctx ? ctx.placingFromInventory as boolean : false;
  const isBotTurn = 'isBotTurn' in ctx ? ctx.isBotTurn : false;

  const player = state.turn;
  const inventory = state.inventory[player];
  const isGameOver = state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw';

  // Count pieces in inventory by type
  const pieceCounts: Partial<Record<Role, number>> = {};
  const itemCounts: Partial<Record<ItemType, number>> = {};

  for (const inv of inventory) {
    if (inv.type === 'piece' && inv.pieceType) {
      pieceCounts[inv.pieceType] = (pieceCounts[inv.pieceType] || 0) + 1;
    } else if (inv.type === 'item' && inv.itemType) {
      itemCounts[inv.itemType] = (itemCounts[inv.itemType] || 0) + 1;
    }
  }

  const hasPieces = Object.keys(pieceCounts).length > 0;
  const hasItems = Object.keys(itemCounts).length > 0;

  if (!hasPieces && !hasItems) return null;

  return (
    <div className="inventory-panel">
      <h3>Inventory</h3>

      {hasPieces && (
        <div className="inventory-section">
          <div className="inventory-pieces">
            {Object.entries(pieceCounts).map(([role, count]) => {
              const isSelected = ctx.placingPiece === role && placingFromInventory;
              return (
                <button
                  key={role}
                  className={`inventory-piece ${isSelected ? 'selected' : ''}`}
                  disabled={isGameOver || isBotTurn}
                  onClick={() => startInventoryPlacement?.(role as PurchasableRole)}
                  title={`Place ${role} from inventory (free)`}
                >
                  <span className="piece-symbol">{PIECE_SYMBOLS[role] || role}</span>
                  {count! > 1 && <span className="inventory-count">x{count}</span>}
                  <span className="inventory-free">FREE</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasItems && (
        <div className="inventory-section">
          <div className="inventory-items">
            {(Object.entries(itemCounts) as [ItemType, number][]).map(([itemType, count]) => {
              const display = ITEM_DISPLAY[itemType];
              const cost = CHESS_GOLD_CONFIG.lootBox.equipCosts[itemType];
              const isSelected = equippingItem === itemType;
              return (
                <button
                  key={itemType}
                  className={`inventory-item ${isSelected ? 'selected' : ''}`}
                  disabled={isGameOver || isBotTurn}
                  onClick={() => startEquip?.(itemType)}
                  title={`Equip ${display.label} (${cost}g)`}
                >
                  <span className="item-icon">{display.icon}</span>
                  {count > 1 && <span className="inventory-count">x{count}</span>}
                  <span className="item-label">{display.label}</span>
                  <span className="item-cost">{cost}<GoldCoin size={12} /></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(placingFromInventory && ctx.placingPiece) && (
        <div className="placement-hint">
          Click a highlighted square to place. Esc to cancel.
        </div>
      )}
      {equippingItem && (
        <div className="placement-hint">
          Click a highlighted piece to equip. Esc to cancel.
        </div>
      )}
    </div>
  );
}
