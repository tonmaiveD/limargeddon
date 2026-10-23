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
  const b = document.getElementById('snd')!;
  b.setAttribute('aria-pressed', String(Sfx.on)); b.textContent = Sfx.on ? '♪ SONIDO' : '♪ SILENCIO';
}

export function installInput(): void {
  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') { Sfx.init(); Sfx.toggle(); setSnd(); return; }
    const k = KM[e.key];
    if (k) { keys[k] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { const k = KM[e.key]; if (k) keys[k] = false; });
  document.getElementById('snd')!.addEventListener('click', () => { Sfx.init(); Sfx.toggle(); setSnd(); });
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
 * Volante y acelerador para el pulgar izquierdo, en una sola zona con un solo puntero:
 * mitad superior acelera, mitad inferior gira a izquierda o derecha, y los bordes de la franja superior
 * aceleran y giran a la vez, así el pulgar se desliza en diagonal sin levantarse.
 */
function installStick(): void {
  const el = document.getElementById('stick');
  if (!el) return;
  const parts = { up: el.querySelector('[data-z="up"]'), left: el.querySelector('[data-z="left"]'), right: el.querySelector('[data-z="right"]') };
  let active: number | null = null, downAt = 0;
  const set = (up: boolean, left: boolean, right: boolean) => {
    keys.up = up; keys.left = left; keys.right = right;
    parts.up?.classList.toggle('on', up); parts.left?.classList.toggle('on', left); parts.right?.classList.toggle('on', right);
  };
  const read = (e: PointerEvent) => {
    const r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    const gas = ny < 0.5, edge = 0.22;
    const left = gas ? nx < edge : nx < 0.5, right = gas ? nx > 1 - edge : nx >= 0.5;
    set(gas, left, right);
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
    const release = () => { if (active === null && downAt === t0) set(false, false, false); };
    if (wait > 0) setTimeout(release, wait); else release();
  };
  (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((t) => el.addEventListener(t, end));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Sombra de cooldown sobre los botones de armas del deck (0 = listo, 1 = recién usado).
export function setDeckCooldowns(cd: Record<'cone' | 'oil' | 'horn', number>): void {
  for (const k of ['cone', 'oil', 'horn'] as const) document.getElementById('w-' + k)?.style.setProperty('--cd', String(cd[k]));
}
