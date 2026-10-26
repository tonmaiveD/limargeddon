import type Phaser from 'phaser';

/*
 * Caché de texturas horneadas (ADR 0044). Las fijas (sprites de obstáculos y proyectiles) quedan siempre. Las de paisaje
 * se marcan como desechables: los tramos cambian sin parar con el scroll, así que se borran las que llevan un rato sin
 * dibujarse y la memoria no crece durante la pelea.
 */

const lastUse = new Map<string, number>();
let frame = 0;

export function ensure(tex: Phaser.Textures.TextureManager, key: string, bake: () => HTMLCanvasElement, disposable = false): string {
  if (!tex.exists(key)) tex.addCanvas(key, bake());
  if (disposable) lastUse.set(key, frame);
  return key;
}

// Una vez por cuadro: cada segundo borra los tramos que no se dibujan hace dos segundos.
export function sweep(tex: Phaser.Textures.TextureManager): void {
  frame++;
  if (frame % 60) return;
  for (const [key, f] of lastUse) if (frame - f > 120) { lastUse.delete(key); if (tex.exists(key)) tex.remove(key); }
}
