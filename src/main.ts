import Phaser from 'phaser';
import { W, H, ZOOM } from './core/constants';
import { fitStage } from './core/layout';
import { installInput } from './core/input';
import { ui } from './core/render';
import { BootScene } from './scenes/Boot';
import { MenuScene } from './scenes/Menu';
import { StageScene } from './scenes/Stage';
import { ResultsScene } from './scenes/Results';
import { GarageScene } from './scenes/Garage';

ui.touch = matchMedia('(pointer: coarse)').matches;
installInput();
fitStage();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  width: W * ZOOM,
  height: H * ZOOM,
  backgroundColor: '#15111d',
  // #stage ya tiene la caja 9:16 exacta (fitStage); el canvas la llena por CSS, así no depende de que Phaser
  // mida bien el contenedor al arrancar (en iOS medía antes de que la barra del navegador se acomodara)
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
  input: { keyboard: false },
  disableContextMenu: true,
  scene: [BootScene, MenuScene, StageScene, ResultsScene, GarageScene],
});

game.events.once(Phaser.Core.Events.READY, () => fitStage(game));
addEventListener('resize', () => fitStage(game));
new ResizeObserver(() => fitStage(game)).observe(document.getElementById('app')!);
addEventListener('orientationchange', () => fitStage(game));
document.fonts?.ready.then(() => fitStage(game));
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
