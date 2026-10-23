import type Phaser from 'phaser';
import { W, H, ZOOM } from './constants';

// Cámara que muestra el mundo lógico de 360x640 sobre el canvas de backing 2x.
export function setupCamera(scene: Phaser.Scene, dx = 0, dy = 0): Phaser.Cameras.Scene2D.Camera {
  const cam = scene.cameras.main;
  cam.setZoom(ZOOM).centerOn(W / 2 + dx, H / 2 + dy);
  return cam;
}
