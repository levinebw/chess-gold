import goldCoinSvg from '../../assets/ui/gold-coin.svg';

export function GoldCoin({ size = 16 }: { size?: number }) {
  return <img src={goldCoinSvg} alt="gold" width={size} height={size} className="gold-coin-icon" />;
}
