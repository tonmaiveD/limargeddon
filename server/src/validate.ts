/*
 * Revisión de lo que llega al receptor (ADR 0051). Es estricta a propósito: el repositorio es público y cualquiera puede
 * ver la dirección, así que solo se guarda lo que tiene exactamente la forma que manda el juego. Cada campo tiene su
 * tipo y su rango, y el registro se rehace con los campos permitidos, también por dentro de los objetos (novena
 * auditoría, V03): lo que sobra se descarta y lo que tiene un tipo equivocado invalida el registro. Sin dependencias
 * de Cloudflare, para probarla con las pruebas del juego.
 */

export const MAX_BODY = 64 * 1024; // bytes por envío
export const MAX_ROW = 8 * 1024; // bytes por registro guardado
export const MAX_EVENTS = 50; // registros por envío (el juego manda grupos de 50)

export interface Row { id: string; v: number; kind: string; build: string; day: string; device: string; tester: string | null; stage: string | null; payload: string }

// Un campo: devuelve el valor saneado, o INVALID si no calza.
const INVALID = Symbol('inválido');
type Field = (x: unknown) => unknown;
type Schema = Record<string, { f: Field; required?: boolean }>;

const bytes = (s: string) => new TextEncoder().encode(s).length;
const str = (max: number, re?: RegExp): Field => (x) => typeof x === 'string' && x.length > 0 && x.length <= max && (!re || re.test(x)) ? x : INVALID;
const num = (min: number, max: number): Field => (x) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : INVALID;
const bool: Field = (x) => typeof x === 'boolean' ? x : INVALID;
const oneOf = (...vals: string[]): Field => (x) => typeof x === 'string' && vals.includes(x) ? x : INVALID;
// rótulos del juego (fuentes de daño, último golpe), como "DESVÍO · SANEAMIENTO": cualquier texto salvo caracteres de
// código (< > " ` \ &) o de control
const LABEL = /^[^<>"`\\&\p{C}]+$/u;
const numMap = (maxKeys: number, keyRe: RegExp): Field => (x) => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return INVALID;
  const e = Object.entries(x as Record<string, unknown>);
  if (e.length > maxKeys) return INVALID;
  const out: Record<string, number> = {};
  for (const [k, n] of e) { if (k.length > 32 || !keyRe.test(k) || num(0, 1e6)(n) === INVALID) return INVALID; out[k] = n as number; }
  return out;
};
const numList = (max: number, lo: number, hi: number): Field => (x) =>
  Array.isArray(x) && x.length <= max && x.every((n) => num(lo, hi)(n) !== INVALID) ? [...x] : INVALID;
const obj = (schema: Schema): Field => (x) => (x && typeof x === 'object' && !Array.isArray(x) ? pick(x as Record<string, unknown>, schema) : INVALID);
const nullOr = (f: Field): Field => (x) => (x === null ? null : f(x));

// Rehace un objeto con los campos del esquema; INVALID si falta uno obligatorio o alguno tiene un tipo equivocado.
function pick(o: Record<string, unknown>, schema: Schema): Record<string, unknown> | typeof INVALID {
  const out: Record<string, unknown> = {};
  for (const [k, { f, required }] of Object.entries(schema)) {
    if (o[k] === undefined) { if (required) return INVALID; continue; }
    const v = f(o[k]);
    if (v === INVALID) return INVALID;
    out[k] = v;
  }
  return out;
}

const DK = oneOf('facil', 'normal', 'dificil');
const MODE = oneOf('toque', 'acelerar', 'mantener');
const STAGE = str(32, /^[a-z-]+$/);
const STATS: Schema = Object.fromEntries(['n', 'p50', 'p95', 'p99', 'max', 'over20', 'over33'].map((k) => [k, { f: num(0, 1e6), required: true }]));
const FRAMES: Schema = {
  warm: { f: nullOr(obj(STATS)) }, play: { f: nullOr(obj(STATS)) },
  stalls: { f: numList(30, 0, 1e6) }, stallCount: { f: num(0, 1e6) }, stallsCut: { f: bool }, anomalies: { f: numList(30, 0, 1e9) },
};
const COMMON: Schema = {
  id: { f: str(64, /^[A-Za-z0-9-]+$/), required: true }, v: { f: (x) => (x === 1 ? 1 : INVALID), required: true },
  kind: { f: oneOf('pelea', 'abandono', 'compra'), required: true }, build: { f: str(40), required: true },
  day: { f: str(10, /^\d{4}-\d{2}-\d{2}$/), required: true }, device: { f: str(80), required: true }, tester: { f: str(16, /^[a-z0-9]+$/) },
};
const SCHEMAS: Record<string, Schema> = {
  pelea: {
    ...COMMON, stage: { f: STAGE, required: true }, dk: { f: DK, required: true }, win: { f: bool, required: true }, t: { f: num(0, 3600), required: true },
    fireMode: { f: MODE }, bestCombo: { f: num(0, 1e6) }, upgrades: { f: numMap(40, /^[a-z0-9_-]+$/i) }, bossPct: { f: num(0, 100) },
    gross: { f: num(0, 1e6) }, fines: { f: num(0, 1e6) }, earned: { f: num(0, 1e6) }, replay: { f: bool }, tolls: { f: num(0, 1e6) },
    points: { f: num(0, 1e6) }, lastHit: { f: str(32, LABEL) }, dmgBy: { f: numMap(40, LABEL) }, frames: { f: obj(FRAMES) },
  },
  abandono: {
    ...COMMON, stage: { f: STAGE, required: true }, dk: { f: DK, required: true }, fireMode: { f: MODE }, t: { f: num(0, 3600), required: true },
    phase: { f: num(0, 10), required: true }, bossPct: { f: num(0, 100), required: true }, hpPct: { f: num(0, 100), required: true },
  },
  compra: {
    ...COMMON, upgrade: { f: str(32, /^[a-z0-9_-]+$/i), required: true }, level: { f: num(0, 20), required: true },
    price: { f: num(0, 1e6), required: true }, wallet: { f: num(0, 1e7), required: true }, unlocked: { f: num(0, 20), required: true },
  },
};

// Un registro válido como fila de la base (rehecho con los campos permitidos), o null si algo no calza.
export function toRow(e: unknown): Row | null {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const o = e as Record<string, unknown>;
  const schema = typeof o.kind === 'string' ? SCHEMAS[o.kind] : undefined;
  if (!schema) return null;
  const clean = pick(o, schema);
  if (clean === INVALID) return null;
  const payload = JSON.stringify(clean);
  if (bytes(payload) > MAX_ROW) return null;
  return { id: clean.id as string, v: 1, kind: clean.kind as string, build: clean.build as string, day: clean.day as string, device: clean.device as string,
    tester: (clean.tester as string | undefined) ?? null, stage: (clean.stage as string | undefined) ?? null, payload };
}

// Lo que se guarda de un envío: los registros válidos (los demás se descartan uno por uno). null si el envío entero no sirve.
export function parseBatch(text: string): Row[] | null {
  if (bytes(text) > MAX_BODY) return null;
  let body: unknown;
  try { body = JSON.parse(text); } catch { return null; }
  const b = body as { v?: unknown; events?: unknown };
  if (!b || b.v !== 1 || !Array.isArray(b.events) || b.events.length === 0 || b.events.length > MAX_EVENTS) return null;
  return b.events.map(toRow).filter((r): r is Row => r !== null);
}

// Orígenes que pueden enviar: el juego publicado y el servidor de desarrollo.
export const ORIGINS = ['https://tonmaived.github.io', 'http://localhost:5173'];
export const originOk = (o: string | null) => !!o && ORIGINS.includes(o);
