import Phaser from 'phaser';

// Espera las fuentes de Google (Bungee y Archivo) para que los textos no salten al cargar.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const fonts = document.fonts;
    const ready = fonts
      ? Promise.all([fonts.load('16px Bungee'), fonts.load('800 16px Archivo'), fonts.load('600 16px Archivo')]).catch(() => [])
      : Promise.resolve([]);
    const timeout = new Promise((r) => setTimeout(r, 2500));
    Promise.race([ready, timeout]).then(() => this.scene.start('Menu'));
  }
}
