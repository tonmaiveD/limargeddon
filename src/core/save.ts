import type { DiffKey, FireMode } from './config';
import type { FrameSummary } from './frames';

/*
 * Guardado local con versión de esquema. Por ahora solo registra cada pelea para calibrar el balance con
 * partidas reales; el Hito 5 agrega soles, mejoras y progreso sobre esta misma estructura.
 * Todo acceso va en try/catch: en modo privado o sin almacenamiento el juego sigue funcionando sin guardar.
 */

const KEY = 'limargeddon.save';
const VERSION = 1;
const MAX_FIGHTS = 300;

export interface FightRecord {
  stage: string; dk: DiffKey; win: boolean; t: number; at: string; fireMode?: FireMode; bestCombo?: number;
  // contexto para comparar peleas (opcionales: los registros viejos no los tienen)
  build?: string; test?: boolean; upgrades?: Record<string, number>; bossPct?: number;
  gross?: number; fines?: number; earned?: number; replay?: boolean; tolls?: number;
  // puntaje con su versión de fórmula, último golpe y daño recibido por fuente (ADR 0037, auditoría N09)
  points?: number; scoreV?: number; lastHit?: string; dmgBy?: Record<string, number>;
  // tiempo entre cuadros en milisegundos y equipo (ADR 0045)
  frames?: FrameSummary;
}
// Contexto de un récord (ADR 0037): con qué se hizo y cuánto aportó cada parte, para explicarlo aunque cambie el balance.
export interface ScoreCtx {
  points: number; v: number; mode?: FireMode; dk: DiffKey; upgrades: Record<string, number>; build?: string; at?: string;
  parts: Record<string, number>;
}
// hints: false si el jugador apagó las ayudas en el menú (ADR 0039); por defecto salen
// share: false si el jugador apagó el envío de datos anónimos (ADR 0051); dataNotice: ya vio el aviso; tester: etiqueta
// del equipo de pruebas puesta con ?tester=nombre
export interface Settings {
  fireMode?: FireMode; stageId?: string; dk?: DiffKey; playerName?: string; hints?: boolean; share?: boolean; dataNotice?: boolean; tester?: string;
}
// v1 admite `settings` y los campos opcionales de las peleas sin cambiar de versión: los datos viejos siguen siendo válidos
// progress.unlocked: número de la etapa más avanzada desbloqueada (las etapas se juegan en orden)
// garage: billetera en soles y nivel de cada mejora del taller (ADR 0018)
// scores: mejor puntaje de cada jugador en cada etapa, { nombre: { etapa: puntos } } (ADR 0029)
// scoreCtx: contexto de cada récord; medals: medallas de cada jugador por etapa (ADR 0037)
// hints: ayudas ya leídas, como "etapa|modo|texto" (ADR 0039; reemplaza a `tutorial`, que marcaba la etapa entera)
// credits: true cuando los créditos se vieron completos una vez (ADR 0049); desde ahí se pueden saltar
interface SaveV1 {
  v: 1; fights: FightRecord[]; settings?: Settings; progress?: { unlocked: number }; garage?: { wallet: number; levels: Record<string, number>; goal?: string };
  scores?: Record<string, Record<string, number>>; scoreCtx?: Record<string, Record<string, ScoreCtx>>;
  medals?: Record<string, Record<string, string[]>>; tutorial?: string[]; hints?: string[]; credits?: boolean;
}

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
  // se trunca igual que el tiempo de la pantalla de resultados, así la mediana no aparece un segundo arriba
  data.fights.push({ ...f, t: Math.floor(f.t * 10) / 10, at: new Date().toISOString() });
  if (data.fights.length > MAX_FIGHTS) data.fights.splice(0, data.fights.length - MAX_FIGHTS);
  store(data);
}

export interface FightStats { played: number; wins: number; median: number | null }

// Resumen de las peleas registradas en este dispositivo para una etapa y dificultad (y modo de disparo, si se indica).
export function fightStats(stage: string, dk: DiffKey, fireMode?: FireMode): FightStats {
  const all = load().fights.filter((f) => f.stage === stage && f.dk === dk && (!fireMode || f.fireMode === fireMode));
  const ts = all.filter((f) => f.win).map((f) => f.t).sort((a, b) => a - b);
  const mid = ts.length >> 1;
  const median = !ts.length ? null : ts.length % 2 ? ts[mid] : (ts[mid - 1] + ts[mid]) / 2;
  return { played: all.length, wins: ts.length, median };
}

// Todo el registro, para copiarlo y compartirlo al calibrar.
export const exportFights = (): FightRecord[] => load().fights;

// Créditos vistos completos al menos una vez (ADR 0049). Empezar de nuevo no los borra.
export const creditsSeen = (): boolean => load().credits === true;
export function markCreditsSeen(): void { const data = load(); data.credits = true; store(data); }

export function getSettings(): Settings { return load().settings ?? {}; }
export function setSettings(patch: Settings): void {
  const data = load(); data.settings = { ...data.settings, ...patch }; store(data);
}

/*
 * Progreso: las etapas se juegan en orden (1, 2, 3...). Ganar la etapa n desbloquea la n+1.
 * Si no hay progreso guardado, se reconstruye con las victorias ya registradas en el dispositivo.
 */
export function unlockedStage(numberOf: (stageId: string) => number | undefined): number {
  const data = load();
  if (data.progress) return data.progress.unlocked;
  let won = 0;
  for (const f of data.fights) if (f.win) won = Math.max(won, numberOf(f.stage) ?? 0);
  return won + 1;
}

export function unlockNext(stageNumber: number, numberOf: (stageId: string) => number | undefined): number {
  const data = load();
  const current = data.progress?.unlocked ?? unlockedStage(numberOf);
  data.progress = { unlocked: Math.max(current, stageNumber + 1) };
  store(data);
  return data.progress.unlocked;
}

/* Taller: billetera y mejoras. */
// goal: mejora elegida como meta de ahorro (ADR 0033)
export interface Garage { wallet: number; levels: Record<string, number>; goal?: string }
export function getGarage(): Garage {
  const g = load().garage;
  return { wallet: g?.wallet ?? 0, levels: { ...(g?.levels ?? {}) }, goal: g?.goal };
}
export function setGoal(id: string | null): void {
  const data = load(), g = data.garage ?? { wallet: 0, levels: {} };
  if (id) g.goal = id; else delete g.goal;
  data.garage = g; store(data);
}

// Suma lo cobrado en una pelea. Repetir una etapa ya ganada paga la mitad, para que no convenga quedarse juntando plata.
export const REPLAY_PAY = 0.5;
export function addEarnings(amount: number): number {
  const data = load(), g = data.garage ?? { wallet: 0, levels: {} };
  g.wallet = Math.max(0, Math.round(g.wallet + amount)); data.garage = g; store(data);
  return g.wallet;
}

// Compra el siguiente nivel de una mejora si alcanza la plata. Devuelve el nuevo estado o null si no se pudo.
export function buyUpgrade(id: string, price: number, maxLevel: number): Garage | null {
  const data = load(), g = data.garage ?? { wallet: 0, levels: {} };
  const lvl = g.levels[id] ?? 0;
  if (lvl >= maxLevel || g.wallet < price) return null;
  g.wallet -= price; g.levels = { ...g.levels, [id]: lvl + 1 };
  if (g.goal === id) delete g.goal; // meta cumplida
  data.garage = g; store(data);
  return { wallet: g.wallet, levels: { ...g.levels }, goal: g.goal };
}

/*
 * Cierre de una pelea: decide si fue una etapa repetida (antes de registrarla, porque la victoria misma cuenta para
 * el desbloqueo), registra la pelea, cobra (50% si se repite) y, si ganó, desbloquea la siguiente.
 */
export function settleFight(f: Omit<FightRecord, 'at'>, stageNumber: number, pay: number, numberOf: (id: string) => number | undefined):
  { earned: number; replay: boolean; wallet: number } {
  const replay = stageNumber < unlockedStage(numberOf);
  const earned = Math.round(pay * (replay ? REPLAY_PAY : 1));
  recordFight({ ...f, earned, replay });
  const wallet = addEarnings(earned);
  if (f.win) unlockNext(stageNumber, numberOf);
  return { earned, replay, wallet };
}

/* Jugador y ranking local (ADR 0029). */
export const DEFAULT_NAME = 'JUGADOR';
export const NAME_MAX = 12;
export const RANKING_SIZE = 12;

// Hasta 12 letras o números (con tildes y ñ); todo lo demás se descarta.
export function cleanName(raw: string): string {
  return Array.from(raw.normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '')).slice(0, NAME_MAX).join('');
}
export const getPlayerName = (): string | null => getSettings().playerName ?? null;
export function setPlayerName(raw: string): string {
  const name = cleanName(raw) || DEFAULT_NAME;
  setSettings({ playerName: name });
  return name;
}

// Guarda el puntaje si es el mejor de ese jugador en esa etapa, con su contexto. Repetir una pelea igual no suma.
export function recordScore(name: string, stageId: string, points: number, ctx?: ScoreCtx): { best: number; record: boolean } {
  const data = load(), all = data.scores ?? {}, mine = { ...(all[name] ?? {}) };
  const prev = mine[stageId] ?? 0, record = points > prev;
  if (record) {
    mine[stageId] = points; data.scores = { ...all, [name]: mine };
    if (ctx) { const cx = data.scoreCtx ?? {}; data.scoreCtx = { ...cx, [name]: { ...(cx[name] ?? {}), [stageId]: ctx } }; }
    else if (data.scoreCtx?.[name]?.[stageId]) delete data.scoreCtx[name][stageId]; // el contexto viejo ya no es de este récord
    store(data);
  }
  return { best: Math.max(prev, points), record };
}

// Récord de un jugador en una etapa, con su contexto si se guardó (los récords anteriores a la ADR 0037 no lo tienen).
export function getRecord(name: string, stageId: string): { points: number; ctx?: ScoreCtx } | null {
  const data = load(), points = data.scores?.[name]?.[stageId];
  return points ? { points, ctx: data.scoreCtx?.[name]?.[stageId] } : null;
}

/* Medallas (ADR 0037): se ganan una vez por jugador y etapa, y quedan. */
export function getMedals(name: string, stageId: string): string[] { return load().medals?.[name]?.[stageId] ?? []; }
export function addMedals(name: string, stageId: string, ids: string[]): string[] {
  const data = load(), had = data.medals?.[name]?.[stageId] ?? [], fresh = ids.filter((id) => !had.includes(id));
  if (fresh.length) {
    const all = data.medals ?? {};
    data.medals = { ...all, [name]: { ...(all[name] ?? {}), [stageId]: [...had, ...fresh] } };
    store(data);
  }
  return fresh;
}

/* Tutorial en contexto (ADR 0037 y 0039): cada ayuda se recuerda por etapa y modo de disparo una vez leída. */
const hintKey = (stageId: string, mode: string, text: string) => `${stageId}|${mode}|${text}`;
export function knownHints(stageId: string, mode: string): string[] {
  const pre = `${stageId}|${mode}|`;
  return (load().hints ?? []).filter((k) => k.startsWith(pre)).map((k) => k.slice(pre.length));
}
export function learnHints(stageId: string, mode: string, texts: string[]): void {
  const data = load(), have = new Set(data.hints ?? []), add = texts.map((t) => hintKey(stageId, mode, t)).filter((k) => !have.has(k));
  if (add.length) { data.hints = [...have, ...add]; store(data); }
}
// "Ver ayudas otra vez": la etapa vuelve a enseñar todo, en los dos modos. No toca billetera, mejoras ni medallas.
export function forgetHints(stageId: string): void {
  const data = load();
  if (!data.hints) return;
  data.hints = data.hints.filter((k) => !k.startsWith(`${stageId}|`)); store(data);
}

export interface RankRow { name: string; total: number; stages: number }
// Los 12 mejores del dispositivo: suma del mejor puntaje de cada etapa; a igual total, más etapas ganadas.
export function ranking(): RankRow[] {
  const all = load().scores ?? {};
  return Object.entries(all)
    .map(([name, st]) => ({ name, total: Object.values(st).reduce((a, b) => a + b, 0), stages: Object.keys(st).length }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || b.stages - a.stages)
    .slice(0, RANKING_SIZE);
}

// Empezar de nuevo: vuelve a la Etapa 1 con la billetera en cero y sin mejoras, y las ayudas vuelven a salir.
// Conserva nombre, ranking, medallas y registro de peleas.
export function resetProgress(): void {
  const data = load();
  delete data.tutorial; delete data.hints;
  data.progress = { unlocked: 1 }; // explícito: si faltara, el progreso se reconstruiría desde el registro de peleas
  data.garage = { wallet: 0, levels: {} };
  if (data.settings) delete data.settings.stageId;
  store(data);
}
