import Phaser from 'phaser';
import { W, H } from '../core/constants';
import { setupCamera } from '../core/camera';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(): void {
    setupCamera(this);
    const back = this.add.text(W / 2, H / 2, 'RESULTADOS · VOLVER', { fontFamily: 'Bungee', fontSize: '14px', color: '#ffe14d', resolution: 2 })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}
