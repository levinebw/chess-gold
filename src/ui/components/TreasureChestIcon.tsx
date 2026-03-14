export function TreasureChestIcon({ size = '1em' }: { size?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <defs>
        <linearGradient id="icWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5e3c"/>
          <stop offset="100%" stopColor="#6b3a1f"/>
        </linearGradient>
        <linearGradient id="icLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5e3c"/>
          <stop offset="60%" stopColor="#4a2810"/>
        </linearGradient>
      </defs>
      <rect x="15" y="52" width="62" height="30" rx="3" fill="url(#icWood)" stroke="#4a2810" strokeWidth="1.5"/>
      <rect x="13" y="79" width="66" height="5" rx="1" fill="#d4a843" stroke="#a07828" strokeWidth="0.8"/>
      <rect x="13" y="52" width="66" height="5" rx="1" fill="#d4a843" stroke="#a07828" strokeWidth="0.8"/>
      <path d="M15,52 Q15,34 46,32 Q77,34 77,52 Z" fill="url(#icLid)" stroke="#4a2810" strokeWidth="1.5"/>
      <path d="M18,52 Q18,37 46,35 Q74,37 74,52" fill="none" stroke="#d4a843" strokeWidth="3" opacity="0.8"/>
      <rect x="40" y="50" width="12" height="10" rx="2" fill="#d4a843" stroke="#a07828" strokeWidth="1"/>
      <circle cx="46" cy="57" r="2.5" fill="#4a2810"/>
      <circle cx="19" cy="55" r="2" fill="#d4a843" stroke="#a07828" strokeWidth="0.5"/>
      <circle cx="73" cy="55" r="2" fill="#d4a843" stroke="#a07828" strokeWidth="0.5"/>
      <circle cx="19" cy="78" r="2" fill="#d4a843" stroke="#a07828" strokeWidth="0.5"/>
      <circle cx="73" cy="78" r="2" fill="#d4a843" stroke="#a07828" strokeWidth="0.5"/>
    </svg>
  );
}
