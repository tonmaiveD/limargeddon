import Phaser from 'phaser';
import { W, H } from '../core/constants';
import { setupCamera } from '../core/camera';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    setupCamera(this);
    this.add.text(W / 2, H / 2 - 40, 'LIMARGEDDON', { fontFamily: 'Bungee', fontSize: '36px', color: '#ffe14d', resolution: 2 }).setOrigin(0.5);
    const go = this.add.text(W / 2, H / 2 + 30, 'JUGAR', { fontFamily: 'Bungee', fontSize: '16px', color: '#0e0a16', backgroundColor: '#ffe14d', padding: { x: 14, y: 10 }, resolution: 2 })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start('Stage'));
  }
}
