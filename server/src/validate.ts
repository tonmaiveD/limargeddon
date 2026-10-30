/*
 * Revisión de lo que llega al receptor (ADR 0051). Es estricta a propósito: el repositorio es público y cualquiera puede
 * ver la dirección, así que solo se guarda lo que tiene exactamente la forma que manda el juego. Sin dependencias de
 * Cloudflare, para probarla con las pruebas del juego.
 */

export const MAX_BODY = 64 * 1024; // bytes por envío
export const MAX_EVENTS = 50; // registros por envío (el juego manda grupos de 50)
const KINDS = ['pelea', 'abandono', 'compra'] as const;
type Kind = (typeof KINDS)[number];
const COMMON = ['id', 'v', 'kind', 'build', 'day', 'device', 'tester'];
const FIELDS: Record<Kind, string[]> = {
  pelea: ['stage', 'dk', 'win', 't', 'fireMode', 'bestCombo', 'upgrades', 'bossPct', 'gross', 'fines', 'earned', 'replay', 'tolls', 'points', 'lastHit', 'dmgBy', 'frames'],
  abandono: ['stage', 'dk', 'fireMode', 't', 'phase', 'bossPct', 'hpPct'],
  compra: ['upgrade', 'level', 'price', 'wallet', 'unlocked'],
};
const DK = ['facil', 'normal', 'dificil'];

export interface Row { id: string; v: number; kind: string; build: string; day: string; device: string; tester: string | null; stage: string | null; payload: string }

const str = (x: unknown, max: number, re?: RegExp): x is string => typeof x === 'string' && x.length > 0 && x.length <= max && (!re || re.test(x));
const num = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const opt = (x: unknown, ok: (y: unknown) => boolean) => x === undefined || ok(x);
const numMap = (x: unknown, maxKeys: number) => !!x && typeof x === 'object' && !Array.isArray(x)
  && Object.keys(x).length <= maxKeys && Object.entries(x as Record<string, unknown>).every(([k, n]) => k.length <= 24 && num(n, 0, 1e6));

// Un registro válido como fila de la base, o null si algo no calza.
export function toRow(e: unknown): Row | null {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const o = e as Record<string, unknown>;
  if (!str(o.id, 64, /^[A-Za-z0-9-]+$/) || o.v !== 1 || !KINDS.includes(o.kind as never)) return null;
  if (!str(o.build, 40) || !str(o.day, 10, /^\d{4}-\d{2}-\d{2}$/) || !str(o.device, 80)) return null;
  if (!opt(o.tester, (t) => str(t, 16, /^[a-z0-9]+$/))) return null;
  const stageOk = (s: unknown) => str(s, 32, /^[a-z-]+$/);
  if (o.kind === 'pelea') {
    if (!stageOk(o.stage) || !DK.includes(o.dk as string) || typeof o.win !== 'boolean' || !num(o.t, 0, 3600)) return null;
    if (!opt(o.upgrades, (u) => numMap(u, 40)) || !opt(o.dmgBy, (d) => numMap(d, 40))) return null;
    for (const k of ['bossPct', 'bestCombo', 'gross', 'fines', 'earned', 'tolls', 'points']) if (!opt(o[k], (n) => num(n, 0, 1e6))) return null;
  } else if (o.kind === 'abandono') {
    if (!stageOk(o.stage) || !DK.includes(o.dk as string) || !num(o.t, 0, 3600) || !num(o.phase, 0, 10) || !num(o.bossPct, 0, 100) || !num(o.hpPct, 0, 100)) return null;
  } else {
    if (!str(o.upgrade, 32, /^[a-z0-9_-]+$/i) || !num(o.level, 0, 20) || !num(o.price, 0, 1e6) || !num(o.wallet, 0, 1e7) || !num(o.unlocked, 0, 20)) return null;
  }
  // solo los campos conocidos: si alguien agrega otros (un nombre, por ejemplo), no se guardan
  const pick: Record<string, unknown> = {};
  for (const k of [...COMMON, ...FIELDS[o.kind as Kind]]) if (o[k] !== undefined) pick[k] = o[k];
  const payload = JSON.stringify(pick);
  if (payload.length > 8 * 1024) return null;
  return { id: o.id as string, v: 1, kind: o.kind as string, build: o.build as string, day: o.day as string, device: o.device as string,
    tester: (o.tester as string | undefined) ?? null, stage: (o.stage as string | undefined) ?? null, payload };
}

// Lo que se guarda de un envío: los registros válidos (los demás se descartan uno por uno). null si el envío entero no sirve.
export function parseBatch(text: string): Row[] | null {
  if (text.length > MAX_BODY) return null;
  let body: unknown;
  try { body = JSON.parse(text); } catch { return null; }
  const b = body as { v?: unknown; events?: unknown };
  if (!b || b.v !== 1 || !Array.isArray(b.events) || b.events.length === 0 || b.events.length > MAX_EVENTS) return null;
  return b.events.map(toRow).filter((r): r is Row => r !== null);
}

// Orígenes que pueden enviar: el juego publicado y el servidor de desarrollo.
export const ORIGINS = ['https://tonmaived.github.io', 'http://localhost:5173'];
export const originOk = (o: string | null) => !!o && ORIGINS.includes(o);
