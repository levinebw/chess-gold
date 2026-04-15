type SoundName = 'move' | 'capture' | 'place' | 'check' | 'gameOver' | 'purchase' | 'lootBoxHit' | 'lootBoxOpen' | 'equip';

const MUTE_KEY = 'chess-gold-muted';
const VOLUME_KEY = 'chess-gold-volume';

let muted = localStorage.getItem(MUTE_KEY) === 'true';
let volume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '0.5');

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  localStorage.setItem(MUTE_KEY, String(value));
}

export function getVolume(): number {
  return volume;
}

export function setVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  localStorage.setItem(VOLUME_KEY, String(volume));
}

export function playSound(name: SoundName): void {
  if (muted) return;
  const base = import.meta.env.BASE_URL;
  const audio = new Audio(`${base}sounds/${name}.mp3`);
  audio.volume = volume;
  audio.play().catch(() => {});
}
