// Resolución lógica del juego: todo se diseña y simula en 360x640.
export const W = 360;
export const H = 640;
// Factor de backing del canvas: 2x como el prototipo, 3x en pantallas muy densas (iPhone y la mayoría de Android)
// para que el juego se vea nítido al ocupar todo el ancho del teléfono.
const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 2;
export const ZOOM = Math.min(3, Math.max(2, Math.round(dpr)));
