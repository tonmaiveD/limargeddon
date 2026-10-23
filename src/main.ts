import Phaser from 'phaser';
import { W, H, ZOOM } from './core/constants';
import { fitStage } from './core/layout';
import { installInput } from './core/input';
import { BootScene } from './scenes/Boot';
import { MenuScene } from './scenes/Menu';
import { StageScene } from './scenes/Stage';
import { ResultsScene } from './scenes/Results';

installInput();
fitStage();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  width: W * ZOOM,
  height: H * ZOOM,
  backgroundColor: '#15111d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { keyboard: false },
  disableContextMenu: true,
  scene: [BootScene, MenuScene, StageScene, ResultsScene],
});

game.events.once(Phaser.Core.Events.READY, () => fitStage(game));
addEventListener('resize', () => fitStage(game));
new ResizeObserver(() => fitStage(game)).observe(document.getElementById('app')!);
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
