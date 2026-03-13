type SoundName = 'move' | 'capture' | 'place' | 'check' | 'gameOver' | 'purchase' | 'lootBoxHit' | 'lootBoxOpen' | 'equip';

const MUTE_KEY = 'chess-gold-muted';

let muted = localStorage.getItem(MUTE_KEY) === 'true';

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  localStorage.setItem(MUTE_KEY, String(value));
}

export function playSound(name: SoundName): void {
  if (muted) return;
  const base = import.meta.env.BASE_URL;
  const audio = new Audio(`${base}sounds/${name}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}
