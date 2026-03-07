import { GoldCoin } from './GoldCoin.tsx';

interface Props {
  onClose: () => void;
}

export function RulesDialog({ onClose }: Props) {
  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-dialog" onClick={e => e.stopPropagation()}>
        <h2>How to Play Chess Gold</h2>

        <div className="rules-content">
          <section>
            <h3>Goal</h3>
            <p>Checkmate your opponent's king.</p>
          </section>

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
        </div>

        <button className="rules-close-button" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
