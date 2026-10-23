# 0001. Stack y resolución lógica 360x640 con backing 2x

**Estado:** aceptada, Hito 1.

## Contexto
CLAUDE.md fija Phaser 3 + Vite + TypeScript y escalado FIT a 360x640. El prototipo dibuja en un canvas de 720x1280 con `setTransform(2,...)`: coordenadas lógicas de 360x640 y backing al doble para que se vea nítido en pantallas de alta densidad. Phaser 3.60+ ya no tiene la opción `resolution` del juego.

## Decisión
- Versiones fijadas: Phaser 3.90.0, Vite 7.3.7, TypeScript 5.9.3, Vitest 3.2.7. Phaser 4 existe pero el stack pide Phaser 3.
- El juego se crea a 720x1280 (`W*ZOOM`, `H*ZOOM`) con `Scale.FIT`, y cada escena usa una cámara con `zoom = 2` centrada en (180, 320) (`src/core/camera.ts`). Toda la lógica, colisiones y dibujo trabajan en 360x640, igual que el prototipo.
- Los textos de Phaser llevan `resolution: 2` para no verse borrosos con el zoom.
- `#stage` se dimensiona con la misma función `fit()` del prototipo (caja 9:16 que entra sobre el deck táctil) y Phaser hace FIT dentro de ella. Así los botones DOM superpuestos (sonido) quedan alineados al canvas.

## Consecuencias
- Los números del prototipo se portan sin conversión de unidades.
- El sacudón de pantalla se implementa moviendo el centro de la cámara, no el contexto.
- Si más adelante se quiere 3x en móviles muy densos, basta con cambiar `ZOOM`.
