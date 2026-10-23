import type Phaser from 'phaser';

// Ajusta #stage a la mayor caja 9:16 que entra sobre el deck táctil; Phaser escala en modo FIT dentro de ella.
export function fitStage(game?: Phaser.Game): void {
  const app = document.getElementById('app')!;
  const stage = document.getElementById('stage')!;
  const deck = document.getElementById('deck');
  const deckH = !deck || getComputedStyle(deck).display === 'none' ? 0 : deck.offsetHeight + 10;
  const availH = app.clientHeight - 16 - deckH;
  const availW = app.clientWidth;
  const h = Math.max(200, Math.min(availH, (availW * 16) / 9));
  const w = (h * 9) / 16;
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  game?.scale.refresh();
}
