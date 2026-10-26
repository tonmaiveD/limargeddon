/*
 * Medición de fluidez para "Copiar registro" (ADR 0045): guarda el tiempo entre cuadros de la pelea y lo resume en
 * percentiles, separando el calentamiento (los primeros segundos, cuando se hornean las imágenes) del resto. Los
 * cuadros después de una pausa o con la pestaña oculta no cuentan, porque miden la espera y no el dibujo.
 */

export const WARM_S = 3; // segundos de calentamiento
const MAX = 60 * 60 * 15; // hasta 15 minutos a 60 cuadros por segundo

export interface FrameStats { n: number; p50: number; p95: number; p99: number; max: number; over20: number; over33: number }
export interface FrameSummary { warm: FrameStats | null; play: FrameStats | null; device: string }

export class FrameMeter {
  private warm: number[] = [];
  private play = new Float32Array(MAX);
  private n = 0;
  private t = 0; // milisegundos medidos
  private skip = true;

  // tras una pausa, el primer intervalo incluye el tiempo detenido
  resume(): void { this.skip = true; }

  add(ms: number): void {
    if (this.skip || ms <= 0 || ms > 1000) { this.skip = false; return; }
    this.t += ms;
    if (this.t <= WARM_S * 1000) this.warm.push(ms);
    else if (this.n < MAX) this.play[this.n++] = ms;
  }

  summary(): FrameSummary {
    return { warm: stats(this.warm), play: stats(Array.from(this.play.subarray(0, this.n))), device: device() };
  }
}

const r1 = (x: number) => Math.round(x * 10) / 10;
export function stats(ms: number[]): FrameStats | null {
  if (!ms.length) return null;
  const s = [...ms].sort((a, b) => a - b), at = (p: number) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
  return {
    n: s.length, p50: r1(at(0.5)), p95: r1(at(0.95)), p99: r1(at(0.99)), max: r1(s[s.length - 1]),
    over20: s.filter((x) => x > 20).length, over33: s.filter((x) => x > 33.4).length,
  };
}

// navegador, pantalla y densidad de píxeles, para saber en qué equipo se jugó
function device(): string {
  try {
    const sc = globalThis.screen, dpr = globalThis.devicePixelRatio ?? 1;
    return `${sc?.width ?? 0}x${sc?.height ?? 0}@${dpr} · ${(globalThis.navigator?.userAgent ?? '').slice(0, 160)}`;
  } catch { return ''; }
}
