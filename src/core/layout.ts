import type Phaser from 'phaser';
import { H, MAX_VIEW_W, W, ZOOM, view } from './constants';

// Ajusta #stage al espacio sobre el deck táctil. El alto manda: si sobra ancho, la vista se ensancha
// (hasta MAX_VIEW_W unidades lógicas) en vez de dejar franjas vacías a los costados.
export function fitStage(game?: Phaser.Game): void {
  const app = document.getElementById('app')!;
  const stage = document.getElementById('stage')!;
  const deck = document.getElementById('deck');
  const deckH = !deck || getComputedStyle(deck).display === 'none' ? 0 : deck.offsetHeight + 10;
  const availH = app.clientHeight - 16 - deckH;
  const availW = app.clientWidth;
  const h = Math.max(200, Math.min(availH, (availW * H) / W));
  const viewW = Math.round(Math.min(MAX_VIEW_W, Math.max(W, (availW / h) * H)));
  view.w = viewW; view.extra = (viewW - W) / 2;
  stage.style.width = (h * viewW) / H + 'px';
  stage.style.height = h + 'px';
  if (game) {
    if (game.scale.width !== viewW * ZOOM) game.scale.resize(viewW * ZOOM, H * ZOOM);
    // Phaser mide el padre en el siguiente cuadro, cuando el layout ya aplicó el tamaño nuevo
    requestAnimationFrame(() => game.scale.refresh());
  }
}
