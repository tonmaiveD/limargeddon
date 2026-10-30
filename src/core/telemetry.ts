import type { DiffKey, FireMode } from './config';
import type { FightRecord } from './save';
import type { FrameSummary } from './frames';

/*
 * Datos anónimos de partidas (ADR 0051). El juego envía solo, en grupos, el registro de cada pelea, los abandonos y las
 * compras del taller, para calibrar el balance con partidas reales sin depender de capturas.
 * - Anónimo de verdad: sin nombre del jugador, sin ranking, sin identificador del dispositivo ni del navegador
 *   completo, y el receptor no guarda la IP. Solo el tipo de equipo ("Android · Chrome · mediana") y el día.
 * - Cada registro lleva un número al azar para que el receptor no lo cuente dos veces.
 * - Se puede apagar en el menú. El modo prueba nunca envía.
 * - El equipo de pruebas se distingue con una etiqueta que pone una vez con ?tester=nombre (con su consentimiento).
 * - Sin conexión, los registros esperan en una cola del teléfono y salen después.
 */

export const SCHEMA = 1;
// Dirección del receptor (Cloudflare Workers, ADR 0051). Vacía hasta que el receptor esté publicado: no se envía nada.
export const TELEMETRY_URL = '';
const QUEUE_KEY = 'limargeddon.datos';
const MAX_QUEUE = 200; // si se acumulan más (mucho tiempo sin conexión), se pierden los más viejos
const BATCH = 50;

interface Base { id: string; v: number; build: string; day: string; device: string; tester?: string }
export interface FightEvent extends Base {
  kind: 'pelea'; stage: string; dk: DiffKey; win: boolean; t: number; fireMode?: FireMode; bestCombo?: number;
  upgrades?: Record<string, number>; bossPct?: number; gross?: number; fines?: number; earned?: number; replay?: boolean;
  tolls?: number; points?: number; lastHit?: string; dmgBy?: Record<string, number>; frames?: Omit<FrameSummary, 'device'>;
}
export interface AbandonEvent extends Base {
  kind: 'abandono'; stage: string; dk: DiffKey; fireMode?: FireMode; t: number; phase: number; bossPct: number; hpPct: number;
}
export interface BuyEvent extends Base { kind: 'compra'; upgrade: string; level: number; price: number; wallet: number; unlocked: number }
export type DataEvent = FightEvent | AbandonEvent | BuyEvent;

/* ---------- datos del equipo, sin identificarlo ---------- */

// Tipo de equipo en pocas palabras: sistema, navegador y tamaño de pantalla. Nunca el texto completo del navegador.
export function coarseDevice(ua: string, w: number, h: number, touch: boolean): string {
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && touch) ? 'iOS'
    : /Windows/i.test(ua) ? 'Windows' : /Macintosh|Mac OS/i.test(ua) ? 'Mac' : /Linux|CrOS/i.test(ua) ? 'Linux' : 'otro';
  const br = /SamsungBrowser/i.test(ua) ? 'Samsung' : /Edg\//i.test(ua) ? 'Edge' : /Firefox|FxiOS/i.test(ua) ? 'Firefox'
    : /CriOS|Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'otro';
  // pantalla grande y táctil es una tablet; grande sin toque, una computadora
  const side = Math.min(w, h), size = side <= 0 ? 'desconocida' : side < 360 ? 'chica' : side < 480 ? 'mediana' : touch ? 'tablet' : 'grande';
  return `${os} · ${br} · ${size}${touch ? ' · táctil' : ''}`;
}

function device(): string {
  try {
    const n = globalThis.navigator, s = globalThis.screen;
    return coarseDevice(n?.userAgent ?? '', s?.width ?? 0, s?.height ?? 0, (n?.maxTouchPoints ?? 0) > 0);
  } catch { return 'desconocido'; }
}

const day = () => new Date().toISOString().slice(0, 10);
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

// Etiqueta de probador: letras y números, hasta 16. Vacía la borra.
export const cleanTester = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

/* ---------- qué se envía de cada cosa ---------- */

export interface Ctx { build: string; tester?: string }
const base = (c: Ctx): Base => ({ id: newId(), v: SCHEMA, build: c.build, day: day(), device: device(), ...(c.tester ? { tester: c.tester } : {}) });

// Una pelea, desde el registro que ya se guarda en el teléfono, sin la descripción completa del equipo.
export function fightEvent(r: Omit<FightRecord, 'at'>, c: Ctx): FightEvent {
  let frames: FightEvent['frames'];
  if (r.frames) { const { device: _d, ...rest } = r.frames; frames = rest; }
  return {
    ...base(c), kind: 'pelea', stage: r.stage, dk: r.dk, win: r.win, t: Math.floor(r.t * 10) / 10, // truncado como el registro local fireMode: r.fireMode, bestCombo: r.bestCombo,
    upgrades: r.upgrades, bossPct: r.bossPct, gross: r.gross, fines: r.fines, earned: r.earned, replay: r.replay, tolls: r.tolls,
    points: r.points, lastHit: r.lastHit, dmgBy: r.dmgBy, frames,
  };
}
export const abandonEvent = (a: Omit<AbandonEvent, keyof Base | 'kind'>, c: Ctx): AbandonEvent => ({ ...base(c), kind: 'abandono', ...a });
export const buyEvent = (b: Omit<BuyEvent, keyof Base | 'kind'>, c: Ctx): BuyEvent => ({ ...base(c), kind: 'compra', ...b });

/* ---------- cola y envío ---------- */

function readQueue(): DataEvent[] {
  try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); return Array.isArray(q) ? q : []; } catch { return []; }
}
function writeQueue(q: DataEvent[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* sin espacio o bloqueado */ }
}
export const queued = (): DataEvent[] => readQueue();

export function enqueue(e: DataEvent): void { writeQueue([...readQueue(), e]); }

let sending = false;
// Manda el siguiente grupo. Lo enviado se quita de la cola solo si el receptor respondió bien; si no, queda para después.
export async function flush(url = TELEMETRY_URL, post: typeof fetch = globalThis.fetch): Promise<number> {
  if (!url || sending || !post) return 0;
  const batch = readQueue().slice(0, BATCH);
  if (!batch.length) return 0;
  sending = true;
  try {
    // text/plain evita la consulta previa del navegador; el receptor lee el cuerpo como JSON
    const res = await post(url, { method: 'POST', body: JSON.stringify({ v: SCHEMA, events: batch }), headers: { 'Content-Type': 'text/plain' }, keepalive: true });
    if (!res.ok) return 0;
    const sent = new Set(batch.map((e) => e.id));
    writeQueue(readQueue().filter((e) => !sent.has(e.id)));
    return batch.length;
  } catch { return 0; } finally { sending = false; }
}

// Al cerrar o esconder la app: un último intento que el navegador completa aunque la página se vaya. El receptor ignora
// los repetidos, así que la cola no se toca.
export function flushOnLeave(url = TELEMETRY_URL): void {
  if (!url) return;
  const batch = readQueue().slice(0, BATCH);
  if (!batch.length) return;
  try { globalThis.navigator?.sendBeacon?.(url, new Blob([JSON.stringify({ v: SCHEMA, events: batch })], { type: 'text/plain' })); } catch { /* sin envío */ }
}
