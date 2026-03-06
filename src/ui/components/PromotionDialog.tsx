import type { Color, PurchasableRole } from '../../engine/types.ts';

const PROMOTION_CHOICES: { role: PurchasableRole; symbol: string; label: string }[] = [
  { role: 'queen',  symbol: '\u265B', label: 'Queen' },
  { role: 'rook',   symbol: '\u265C', label: 'Rook' },
  { role: 'bishop', symbol: '\u265D', label: 'Bishop' },
  { role: 'knight', symbol: '\u265E', label: 'Knight' },
];

interface Props {
  color: Color;
  onSelect: (role: PurchasableRole) => void;
  onCancel: () => void;
}

export function PromotionDialog({ color: _color, onSelect, onCancel }: Props) {
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={e => e.stopPropagation()}>
        <div className="promotion-title">Promote to:</div>
        <div className="promotion-choices">
          {PROMOTION_CHOICES.map(({ role, symbol, label }) => (
            <button
              key={role}
              className="promotion-choice"
              onClick={() => onSelect(role)}
              title={label}
            >
              <span className="promotion-symbol">{symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
