import Phaser from 'phaser';
import { W, H } from '../core/constants';
import { setupCamera } from '../core/camera';

export class StageScene extends Phaser.Scene {
  constructor() { super('Stage'); }

  create(): void {
    setupCamera(this);
    this.add.text(W / 2, H / 2, 'ETAPA', { fontFamily: 'Bungee', fontSize: '22px', color: '#f7f1ff', resolution: 2 }).setOrigin(0.5);
    this.time.delayedCall(1500, () => this.scene.start('Results'));
  }
}
