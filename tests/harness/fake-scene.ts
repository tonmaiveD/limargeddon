import type Phaser from 'phaser';

/*
 * Escena de Phaser de mentira para probar el dibujo de Gfx sin navegador: guarda cada figura con la profundidad de su
 * capa, cada imagen y cada texto, así una prueba puede medir dónde y en qué orden queda cada cosa en pantalla.
 */
export interface Pt { x: number; y: number }
export interface Shape { depth: number; pts: Pt[]; color: number }
export interface Placed { depth: number; key: string; x: number; y: number; visible: boolean }

export function fakeScene() {
  const shapes: Shape[] = [], lines: Shape[] = [], images: Placed[] = [], texts: (Placed & { text: string })[] = [];
  const graphics = () => {
    let depth = 0, color = 0;
    const g = {
      setDepth(d: number) { depth = d; return g; }, clear() { return g; }, lineStyle() { return g; },
      strokePoints(pts: Pt[]) { lines.push({ depth, color, pts: pts.map((q) => ({ ...q })) }); return g; },
      fillStyle(c: number) { color = c; return g; },
      fillRect(x: number, y: number, w: number, h: number) { shapes.push({ depth, color, pts: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }] }); return g; },
      fillPoints(pts: Pt[]) { shapes.push({ depth, color, pts: pts.map((q) => ({ ...q })) }); return g; },
    };
    return g;
  };
  const placed = <T extends Placed>(o: T) => {
    // los métodos que no importan para medir (origen, giro, escala, color) solo devuelven el mismo objeto
    const self: Record<string, unknown> = new Proxy({
      setDepth(d: number) { o.depth = d; return self; }, setPosition(x: number, y: number) { o.x = x; o.y = y; return self; },
      setVisible(v: boolean) { o.visible = v; return self; }, setTexture(k: string) { o.key = k; return self; },
      setText(t: string) { (o as unknown as { text: string }).text = t; return self; },
      texture: { get key() { return o.key; } }, style: { getTextMetrics: () => ({ ascent: 8, descent: 2 }) }, isTinted: false,
    } as Record<string, unknown>, { get: (t, k: string) => (k in t ? t[k] : () => self) });
    return self;
  };
  const scene = {
    add: {
      graphics,
      image: (_x: number, _y: number, key: string) => { const o = { depth: 0, key, x: 0, y: 0, visible: true }; images.push(o); return placed(o); },
      text: () => { const o = { depth: 0, key: '', x: 0, y: 0, visible: true, text: '' }; texts.push(o); return placed(o); },
    },
    textures: { exists: () => true, addCanvas: () => null },
  };
  return { scene: scene as unknown as Phaser.Scene, shapes, lines, images, texts };
}
