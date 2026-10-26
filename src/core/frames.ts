/*
 * Medición de fluidez para "Copiar registro" (ADR 0045 y 0046): guarda el tiempo entre cuadros de la pelea y lo
 * resume en percentiles, separando el calentamiento (los primeros segundos, cuando se hornean las imágenes) del resto.
 * Mide el intervalo crudo del navegador (`rawDelta`), no el suavizado que Phaser le pasa a la escena, que reparte un
 * tirón entre diez cuadros y lo esconde (sexta auditoría, S01). Los cuadros después de una pausa no cuentan, porque
 * miden la espera y no el dibujo. Los tirones largos con el juego en primer plano se guardan aparte, uno por uno.
 */

export const WARM_S = 3; // segundos de calentamiento
export const SLOW_MS = 20; // objetivo del percentil 95, en milisegundos
export const JANK_MS = 33.3; // objetivo del percentil 99 y umbral de cuadro perdido, en milisegundos
export const STALL_MS = 100; // desde aquí un cuadro es un bloqueo y se guarda su duración
const SUSPEND_MS = 5000; // más que esto es el equipo suspendido, no un bloqueo del juego
const MAX = 60 * 60 * 15; // hasta 15 minutos a 60 cuadros por segundo
const MAX_STALLS = 30;

// over20 y over33: cuántos cuadros pasan de SLOW_MS y de JANK_MS
export interface FrameStats { n: number; p50: number; p95: number; p99: number; max: number; over20: number; over33: number }
// stalls: duración en milisegundos de cada bloqueo de STALL_MS o más, en orden (hasta 30)
export interface FrameSummary { warm: FrameStats | null; play: FrameStats | null; stalls: number[]; device: string }

// El intervalo que se mide: el crudo del bucle de Phaser, no el suavizado que recibe update().
export const frameMs = (loop: { rawDelta: number }) => loop.rawDelta;

export class FrameMeter {
  private warm: number[] = [];
  private play = new Float32Array(MAX);
  private n = 0;
  private t = 0; // milisegundos medidos
  private skip = true;
  private stalls: number[] = [];

  // tras una pausa, el primer intervalo incluye el tiempo detenido
  resume(): void { this.skip = true; }

  add(ms: number): void {
    if (this.skip || ms <= 0 || ms > SUSPEND_MS) { this.skip = false; return; }
    this.t += ms;
    if (ms >= STALL_MS && this.stalls.length < MAX_STALLS) this.stalls.push(Math.round(ms));
    if (this.t <= WARM_S * 1000) this.warm.push(ms);
    else if (this.n < MAX) this.play[this.n++] = ms;
  }

  summary(): FrameSummary {
    return { warm: stats(this.warm), play: stats(Array.from(this.play.subarray(0, this.n))), stalls: [...this.stalls], device: device() };
  }
}

const r1 = (x: number) => Math.round(x * 10) / 10;
export function stats(ms: number[]): FrameStats | null {
  if (!ms.length) return null;
  const s = [...ms].sort((a, b) => a - b), at = (p: number) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
  return {
    n: s.length, p50: r1(at(0.5)), p95: r1(at(0.95)), p99: r1(at(0.99)), max: r1(s[s.length - 1]),
    over20: s.filter((x) => x > SLOW_MS).length, over33: s.filter((x) => x > JANK_MS).length,
  };
}

// navegador, pantalla y densidad de píxeles, para saber en qué equipo se jugó
function device(): string {
  try {
    const sc = globalThis.screen, dpr = globalThis.devicePixelRatio ?? 1;
    return `${sc?.width ?? 0}x${sc?.height ?? 0}@${dpr} · ${(globalThis.navigator?.userAgent ?? '').slice(0, 160)}`;
  } catch { return ''; }
}
