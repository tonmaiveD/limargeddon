import type { DiffKey, FireMode } from './config';

/*
 * Guardado local con versión de esquema. Por ahora solo registra cada pelea para calibrar el balance con
 * partidas reales; el Hito 5 agrega soles, mejoras y progreso sobre esta misma estructura.
 * Todo acceso va en try/catch: en modo privado o sin almacenamiento el juego sigue funcionando sin guardar.
 */

const KEY = 'limargeddon.save';
const VERSION = 1;
const MAX_FIGHTS = 300;

export interface FightRecord { stage: string; dk: DiffKey; win: boolean; t: number; at: string; fireMode?: FireMode; bestCombo?: number }
export interface Settings { fireMode?: FireMode }
// v1 admite `settings` y los campos opcionales de las peleas sin cambiar de versión: los datos viejos siguen siendo válidos
interface SaveV1 { v: 1; fights: FightRecord[]; settings?: Settings }

function load(): SaveV1 {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.v === VERSION && Array.isArray(data.fights)) return data as SaveV1;
  } catch { /* almacenamiento no disponible o dañado */ }
  return { v: VERSION, fights: [] };
}

function store(data: SaveV1): void {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sin espacio o bloqueado */ }
}

export function recordFight(f: Omit<FightRecord, 'at'>): void {
  const data = load();
  data.fights.push({ ...f, t: Math.round(f.t * 10) / 10, at: new Date().toISOString() });
  if (data.fights.length > MAX_FIGHTS) data.fights.splice(0, data.fights.length - MAX_FIGHTS);
  store(data);
}

export interface FightStats { played: number; wins: number; median: number | null }

// Resumen de las peleas registradas en este dispositivo para una etapa y dificultad (y modo de disparo, si se indica).
export function fightStats(stage: string, dk: DiffKey, fireMode?: FireMode): FightStats {
  const all = load().fights.filter((f) => f.stage === stage && f.dk === dk && (!fireMode || f.fireMode === fireMode));
  const ts = all.filter((f) => f.win).map((f) => f.t).sort((a, b) => a - b);
  return { played: all.length, wins: ts.length, median: ts.length ? ts[ts.length >> 1] : null };
}

// Todo el registro, para copiarlo y compartirlo al calibrar.
export const exportFights = (): FightRecord[] => load().fights;

export function getSettings(): Settings { return load().settings ?? {}; }
export function setSettings(patch: Settings): void {
  const data = load(); data.settings = { ...data.settings, ...patch }; store(data);
}
