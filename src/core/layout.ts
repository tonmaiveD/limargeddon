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

/*
 * Los controles táctiles solo se muestran donde se maneja: el combate y el desfile de los créditos (auditoría UX en
 * iPhone 15, ADR 0054). En el menú, el taller y los resultados ese espacio pasa a la pantalla. Al cambiar, la escena
 * se vuelve a medir para que el canvas y los toques coincidan.
 */
export function showDeck(game: Phaser.Game, on: boolean): void {
  if (document.body.classList.contains('sin-deck') === !on) return;
  document.body.classList.toggle('sin-deck', !on);
  fitStage(game);
}
