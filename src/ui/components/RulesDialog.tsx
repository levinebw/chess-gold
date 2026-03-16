import { useGameContext } from '../context/GameContext.tsx';
import { GoldCoin } from './GoldCoin.tsx';

interface Props {
  onClose: () => void;
}

export function RulesDialog({ onClose }: Props) {
  const { state } = useGameContext();
  const hasGold = state.modeConfig.goldEconomy;
  const hasLootBoxes = state.modeConfig.lootBoxes;

  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-dialog" onClick={e => e.stopPropagation()}>
        <h2>How to Play Chess Gold</h2>

        <div className="rules-content">
          <section>
            <h3>Goal</h3>
            <p>
              {hasLootBoxes
                ? 'Collect 6 loot boxes to win, or checkmate your opponent.'
                : 'Checkmate your opponent\'s king.'}
            </p>
          </section>

          {hasGold && (
            <>
              <section>
                <h3>Starting Position</h3>
                <p>Both players start with only a king and 3<GoldCoin/>.</p>
              </section>

              <section>
                <h3>On Your Turn</h3>
                <p><strong>Move</strong> a piece on the board (free), OR <strong>place</strong> a new piece from the shop (costs gold). You get <strong>+1<GoldCoin/></strong> at the start of each turn.</p>
              </section>

              <section>
                <h3>Placement</h3>
                <p>Pieces can be placed on your first 3 rows. Pawns only on rows 2-3 (no back rank).</p>
              </section>

              <section>
                <h3>Captures &amp; Promotion</h3>
                <p>Capturing earns gold (half the piece's price). Promoting a pawn costs 3<GoldCoin/>.</p>
              </section>

              <section>
                <h3>Piece Prices</h3>
                <table className="rules-price-table">
                  <tbody>
                    <tr><td>Pawn</td><td>1<GoldCoin/></td></tr>
                    <tr><td>Knight</td><td>3<GoldCoin/></td></tr>
                    <tr><td>Bishop</td><td>3<GoldCoin/></td></tr>
                    <tr><td>Rook</td><td>5<GoldCoin/></td></tr>
                    <tr><td>Queen</td><td>8<GoldCoin/></td></tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {hasLootBoxes && (
            <>
              <section>
                <h3>Loot Boxes</h3>
                <p>Treasure chests spawn on ranks 4-5 every 4 turns. Move a piece adjacent and use <strong>Hit Loot Box</strong> to strike it. Most pieces need 3 hits to open a box; a queen opens it in 1 hit.</p>
                <p>Pawns can hit without consuming your turn. Other pieces use their turn to hit. If a piece was already attacking the box's square and moves adjacent, the hit is automatic.</p>
                <p>Collect <strong>6 loot boxes</strong> to win!</p>
              </section>

              <section>
                <h3>Loot Box Rewards</h3>
                <table className="rules-price-table">
                  <tbody>
                    <tr><td><strong>Gold</strong></td><td>3-6<GoldCoin/></td></tr>
                    <tr><td><strong>Piece</strong></td><td>A free piece added to your inventory</td></tr>
                    <tr><td><strong>Crossbow</strong> 🏹</td><td>Equip to a piece (2<GoldCoin/>). Capture an adjacent enemy without moving.</td></tr>
                    <tr><td><strong>Turtle Shell</strong> 🛡️</td><td>Equip to a piece (2<GoldCoin/>). Absorbs one capture — attacker bounces back.</td></tr>
                    <tr><td><strong>Crown</strong> 👑</td><td>Equip to a piece (3.5<GoldCoin/>). Instantly promotes it to a Queen.</td></tr>
                  </tbody>
                </table>
              </section>
            </>
          )}
        </div>

        <button className="rules-close-button" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
