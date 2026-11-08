/* ============================================================
   UI — PLAYER SETTINGS  ( src/ui/ )
   Comfort settings that belong to this device, not to a save:
   motion and interface size (game-feel and game-ui-ux skills).
   ============================================================ */
export type MotionSetting = 'device' | 'reduce';
export type SizeSetting = 1 | 1.15 | 1.3;
export interface Settings { motion: MotionSetting; size: SizeSetting; }

const KEY = 'art-director:settings';
const DEFAULTS: Settings = { motion: 'device', size: 1 };

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      motion: raw.motion === 'reduce' ? 'reduce' : 'device',
      size: [1, 1.15, 1.3].includes(raw.size) ? raw.size : 1,
    };
  } catch { return { ...DEFAULTS }; }
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: settings last this session */ }
  applySettings(s);
}

/** reflect the settings on the page: a class for motion, a scale for size */
export function applySettings(s: Settings = loadSettings()): void {
  document.body.classList.toggle('reduce-motion', s.motion === 'reduce');
  document.documentElement.style.setProperty('--ui-scale', String(s.size));
}
