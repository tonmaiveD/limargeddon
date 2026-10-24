import Phaser from 'phaser';
import { ZOOM } from './constants';

/*
 * Adaptador con la API del contexto 2D de canvas sobre Phaser.Graphics + textos en pool.
 * Permite portar el dibujo procedural del prototipo casi línea por línea y que corra en WebGL.
 * Todo se rehace cada cuadro: begin() limpia, las primitivas se acumulan y end() oculta textos sobrantes.
 */

export interface FontSpec { fam: 'display' | 'body'; size: number; weight?: number }
export const FONT = (size: number): FontSpec => ({ fam: 'display', size });
export const BODY = (weight: number, size: number): FontSpec => ({ fam: 'body', size, weight });

const FAMILY = { display: "Bungee, Impact, 'Arial Black', sans-serif", body: 'Archivo, system-ui, sans-serif' };
const cssFont = (f: FontSpec) => `${f.weight ?? 400} ${f.size}px ${FAMILY[f.fam]}`;

interface Rgba { c: number; a: number }
const colorCache = new Map<string, Rgba>();
export function parseColor(css: string): Rgba {
  let v = colorCache.get(css);
  if (v) return v;
  if (css[0] === '#') {
    let h = css.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    v = { c: parseInt(h, 16), a: 1 };
  } else {
    const m = css.match(/rgba?\(([^)]+)\)/);
    const p = m ? m[1].split(',').map((s) => parseFloat(s)) : [0, 0, 0, 1];
    v = { c: (p[0] << 16) | (p[1] << 8) | p[2], a: p[3] ?? 1 };
  }
  colorCache.set(css, v);
  return v;
}

interface Pt { x: number; y: number }
interface SubPath { pts: Pt[]; closed: boolean }
interface PoolItem { t: Phaser.GameObjects.Text; text: string; col: string }
interface Pool { items: PoolItem[]; used: number; baseline: number }

let measureCtx: CanvasRenderingContext2D | null = null;

export class Gfx {
  readonly g: Phaser.GameObjects.Graphics;
  fillStyle = '#000';
  strokeStyle = '#000';
  lineWidth = 1;
  globalAlpha = 1;
  font: FontSpec = FONT(10);
  textAlign: 'left' | 'center' | 'right' = 'left';
  // pista curva (ADR 0026): corrimiento horizontal según la altura en pantalla; null en las etapas rectas
  warp: ((y: number) => number) | null = null;

  private m = [1, 0, 0, 1, 0, 0]; // a b c d e f
  private stack: { m: number[]; fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number; font: FontSpec; textAlign: Gfx['textAlign'] }[] = [];
  private path: SubPath[] = [];
  private cur: SubPath | null = null;
  private pools = new Map<string, Pool>();

  constructor(private scene: Phaser.Scene, private depth: number) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  begin(): void {
    this.g.clear();
    for (const p of this.pools.values()) p.used = 0;
    this.m = [1, 0, 0, 1, 0, 0]; this.stack.length = 0; this.globalAlpha = 1;
  }

  end(): void {
    for (const p of this.pools.values()) for (let i = p.used; i < p.items.length; i++) p.items[i].t.setVisible(false);
  }

  /* ---------- transformaciones ---------- */
  save(): void {
    this.stack.push({ m: this.m.slice(), fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, globalAlpha: this.globalAlpha, font: this.font, textAlign: this.textAlign });
  }
  restore(): void {
    const s = this.stack.pop(); if (!s) return;
    this.m = s.m; this.fillStyle = s.fillStyle; this.strokeStyle = s.strokeStyle; this.lineWidth = s.lineWidth;
    this.globalAlpha = s.globalAlpha; this.font = s.font; this.textAlign = s.textAlign;
  }
  translate(x: number, y: number): void { const m = this.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; }
  rotate(r: number): void {
    if (!r) return;
    const m = this.m, cs = Math.cos(r), sn = Math.sin(r), a = m[0], b = m[1], c = m[2], d = m[3];
    m[0] = a * cs + c * sn; m[1] = b * cs + d * sn; m[2] = c * cs - a * sn; m[3] = d * cs - b * sn;
  }
  private tx(x: number, y: number): Pt {
    const m = this.m, py = m[1] * x + m[3] * y + m[5];
    return { x: m[0] * x + m[2] * y + m[4] + (this.warp ? this.warp(py) : 0), y: py };
  }
  private get axisAligned(): boolean { const m = this.m; return m[1] === 0 && m[2] === 0 && m[0] === 1 && m[3] === 1; }

  /* ---------- relleno directo ---------- */
  private setFill(): boolean {
    const c = parseColor(this.fillStyle), a = c.a * this.globalAlpha;
    if (a <= 0) return false;
    this.g.fillStyle(c.c, Math.min(1, a)); return true;
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    if (!this.setFill()) return;
    if (this.axisAligned && !this.warp) { this.g.fillRect(x + this.m[4], y + this.m[5], w, h); return; }
    // con curva, los rectángulos altos se cortan en franjas para que sigan la pista
    const n = this.warp ? Math.max(1, Math.ceil(Math.abs(h) / 16)) : 1, sh = h / n;
    for (let i = 0; i < n; i++) {
      const y0 = y + i * sh, y1 = y0 + sh;
      this.g.fillPoints([this.tx(x, y0), this.tx(x + w, y0), this.tx(x + w, y1), this.tx(x, y1)], true);
    }
  }

  /* ---------- trazados ---------- */
  beginPath(): void { this.path = []; this.cur = null; }
  moveTo(x: number, y: number): void { this.cur = { pts: [this.tx(x, y)], closed: false }; this.path.push(this.cur); }
  lineTo(x: number, y: number): void { if (!this.cur) this.moveTo(x, y); else this.cur.pts.push(this.tx(x, y)); }
  closePath(): void { if (this.cur) { this.cur.closed = true; this.cur = null; } }
  arc(x: number, y: number, r: number, a0: number, a1: number): void { this.ellipse(x, y, r, r, 0, a0, a1); }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number): void {
    const span = Math.min(a1 - a0, Math.PI * 2), full = span >= Math.PI * 2 - 1e-6;
    const n = Math.max(8, Math.ceil(Math.max(rx, ry) * 1.6 * (span / (Math.PI * 2)) + 4));
    if (!this.cur) { this.cur = { pts: [], closed: false }; this.path.push(this.cur); }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (let i = 0; i <= (full ? n - 1 : n); i++) {
      const a = a0 + (span * i) / n, px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      this.cur.pts.push(this.tx(x + px * cs - py * sn, y + px * sn + py * cs));
    }
  }
  fill(): void {
    if (!this.setFill()) return;
    for (const s of this.path) if (s.pts.length >= 3) this.g.fillPoints(s.pts, true);
  }
  stroke(): void {
    const c = parseColor(this.strokeStyle), a = c.a * this.globalAlpha;
    if (a <= 0) return;
    this.g.lineStyle(this.lineWidth, c.c, Math.min(1, a));
    for (const s of this.path) if (s.pts.length >= 2) this.g.strokePoints(s.pts, s.closed, s.closed);
  }
  // rectángulo redondeado como trazado, igual que rr() del prototipo
  roundRect(x: number, y: number, w: number, h: number, r: number): void {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    this.beginPath();
    this.ellipse(x + w - r, y + r, r, r, 0, -Math.PI / 2, 0);
    this.ellipse(x + w - r, y + h - r, r, r, 0, 0, Math.PI / 2);
    this.ellipse(x + r, y + h - r, r, r, 0, Math.PI / 2, Math.PI);
    this.ellipse(x + r, y + r, r, r, 0, Math.PI, Math.PI * 1.5);
    this.closePath();
  }

  /* ---------- texto ---------- */
  private pool(f: FontSpec): Pool {
    const key = cssFont(f);
    let p = this.pools.get(key);
    if (!p) {
      const probe = this.makeText(f);
      const met = probe.style.getTextMetrics();
      p = { items: [{ t: probe, text: '', col: '' }], used: 0, baseline: met.ascent / (met.ascent + met.descent) };
      probe.setVisible(false);
      this.pools.set(key, p);
    }
    return p;
  }
  private makeText(f: FontSpec): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, '', {
      fontFamily: FAMILY[f.fam], fontSize: f.size + 'px', fontStyle: String(f.weight ?? 400), color: '#ffffff', resolution: ZOOM,
    }).setDepth(this.depth + 1);
  }
  fillText(text: string, x: number, y: number): void {
    const p = this.pool(this.font);
    let it = p.items[p.used];
    if (!it) { it = { t: this.makeText(this.font), text: '', col: '' }; p.items.push(it); }
    p.used++;
    const t = it.t, c = parseColor(this.fillStyle), pos = this.tx(x, y);
    if (it.text !== text) { t.setText(text); it.text = text; }
    if (it.col !== this.fillStyle) { t.setColor('#' + c.c.toString(16).padStart(6, '0')); it.col = this.fillStyle; }
    t.setOrigin(this.textAlign === 'left' ? 0 : this.textAlign === 'center' ? 0.5 : 1, p.baseline)
      .setPosition(pos.x, pos.y).setRotation(Math.atan2(this.m[1], this.m[0])).setAlpha(Math.min(1, c.a * this.globalAlpha)).setVisible(true);
  }
  measureText(text: string): { width: number } {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    if (!measureCtx) return { width: text.length * this.font.size * 0.6 };
    measureCtx.font = cssFont(this.font);
    return measureCtx.measureText(text);
  }
}
