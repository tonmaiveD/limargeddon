import { Sfx } from './audio/sfx';
import { newKeys, type Keys } from './state';

/* Entrada unificada: teclado y deck táctil DOM (pointer events con captura) escriben el mismo objeto `keys`. */

export const keys: Keys = newKeys();

const KM: Record<string, keyof Keys> = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  z: 'cone', Z: 'cone', j: 'cone', x: 'oil', X: 'oil', k: 'oil', c: 'horn', C: 'horn', l: 'horn', ' ': 'horn',
};

const MIN_HOLD = 60;

function setSnd(): void {
  document.querySelectorAll<HTMLButtonElement>('.snd-toggle').forEach((b) => {
    b.setAttribute('aria-pressed', String(Sfx.on)); b.textContent = Sfx.on ? '♪ Sonido: sí' : '♪ Sonido: no';
  });
}

// La escena activa registra aquí qué hacer con la tecla de pausa (P o Escape).
export const pauseHook: { toggle: (() => void) | null } = { toggle: null };

export function installInput(): void {
  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') { Sfx.init(); Sfx.toggle(); setSnd(); return; }
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && pauseHook.toggle) { e.preventDefault(); pauseHook.toggle(); return; }
    const k = KM[e.key];
    if (k) { keys[k] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { const k = KM[e.key]; if (k) keys[k] = false; });
  document.querySelectorAll('.snd-toggle').forEach((b) => b.addEventListener('click', () => { Sfx.init(); Sfx.toggle(); setSnd(); }));
  document.querySelectorAll<HTMLButtonElement>('#deck button').forEach((b) => {
    const k = b.dataset.k as keyof Keys;
    let downAt = 0;
    const on = (e: PointerEvent) => { e.preventDefault(); Sfx.init(); downAt = performance.now(); keys[k] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
    // un toque muy corto se mantiene al menos MIN_HOLD ms para que algún cuadro de simulación lo lea
    const off = () => {
      b.classList.remove('on');
      const wait = MIN_HOLD - (performance.now() - downAt), t0 = downAt;
      const release = () => { if (downAt === t0) keys[k] = false; };
      if (wait > 0) setTimeout(release, wait); else release();
    };
    b.addEventListener('pointerdown', on);
    (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((t) => b.addEventListener(t, off));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  installStick();
}

/*
 * Volante para el pulgar izquierdo, en una sola zona con un solo puntero: la mitad izquierda gira a la izquierda
 * y la derecha a la derecha. Deslizar el pulgar cambia de lado sin levantarlo. El acelerador es un botón del deck.
 */
function installStick(): void {
  const el = document.getElementById('stick');
  if (!el) return;
  const parts = { left: el.querySelector('[data-z="left"]'), right: el.querySelector('[data-z="right"]') };
  let active: number | null = null, downAt = 0;
  const set = (left: boolean, right: boolean) => {
    keys.left = left; keys.right = right;
    parts.left?.classList.toggle('on', left); parts.right?.classList.toggle('on', right);
  };
  const read = (e: PointerEvent) => {
    const r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width;
    set(nx < 0.5, nx >= 0.5);
  };
  el.addEventListener('pointerdown', (e) => {
    if (active !== null) return;
    e.preventDefault(); Sfx.init(); active = e.pointerId; downAt = performance.now();
    try { el.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    read(e);
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === active) read(e); });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    active = null;
    const wait = MIN_HOLD - (performance.now() - downAt), t0 = downAt;
    const release = () => { if (active === null && downAt === t0) set(false, false); };
    if (wait > 0) setTimeout(release, wait); else release();
  };
  (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((t) => el.addEventListener(t, end));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Sombra de cooldown sobre los botones de armas del deck (0 = listo, 1 = recién usado).
export function setDeckCooldowns(cd: Record<'cone' | 'oil' | 'horn', number>): void {
  for (const k of ['cone', 'oil', 'horn'] as const) document.getElementById('w-' + k)?.style.setProperty('--cd', String(cd[k]));
}

// Puntos de la reserva de conos sobre el botón CONOS (modo por toque).
let lastAmmo = '';
export function setDeckAmmo(n: number, max: number): void {
  const key = n + '/' + max;
  if (key === lastAmmo) return;
  lastAmmo = key;
  const el = document.getElementById('ammo');
  if (el) el.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < n ? '' : 'off'}"></i>`).join('');
}

// El deck se adapta al modo de disparo: en "acelerar es atacar" no hay botón de conos.
export function setDeckMode(mode: string): void {
  document.getElementById('deck')?.classList.toggle('mode-acelerar', mode === 'acelerar');
}
