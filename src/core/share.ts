import { getSettings, setSettings } from './save';
import { TELEMETRY_URL, cleanTester, clearQueue, enqueue, flush, flushOnLeave, type Ctx, type DataEvent } from './telemetry';

/*
 * Cuándo se envían los datos anónimos de partidas (ADR 0051): salvo que el jugador lo apague en el menú, y nunca en el
 * modo prueba. Lo que se envía y cómo está en telemetry.ts. La preferencia se consulta en cada envío, no solo al abrir
 * el juego: apagarla corta los grupos siguientes y los envíos al cerrar, y borra lo pendiente (novena auditoría, V01).
 */

export const sharing = (test: boolean): boolean => !test && getSettings().share !== false;
const ctx = (): Ctx => ({ build: __BUILD__, tester: getSettings().tester });

// Anota un registro y prueba mandar lo pendiente.
export function track(test: boolean, make: (c: Ctx) => DataEvent): void {
  if (!sharing(test)) return;
  enqueue(make(ctx()));
  void flush(TELEMETRY_URL, globalThis.fetch, () => sharing(test));
}

// El interruptor del menú: apagarlo borra lo que esperaba en el teléfono, así no sale nada más.
export function setSharing(on: boolean): void {
  setSettings({ share: on, dataNotice: true });
  if (!on) clearQueue();
}

// Último intento al esconder o cerrar la app, solo si el envío sigue encendido en ese momento.
export const leave = (test: boolean) => (): void => flushOnLeave(TELEMETRY_URL, () => sharing(test));

// ?tester=nombre deja la etiqueta del equipo de pruebas en este teléfono; ?tester= la borra.
export function readTester(search: string): void {
  const q = new URLSearchParams(search);
  if (!q.has('tester')) return;
  const t = cleanTester(q.get('tester') ?? '');
  setSettings({ tester: t || undefined });
}

// Al abrir el juego manda lo que quedó pendiente; al esconder o cerrar la app, un último intento.
// Los manejadores quedan instalados siempre y miran la preferencia en el momento, así respetan un cambio posterior.
export function installSharing(test: boolean): void {
  if (typeof location !== 'undefined') readTester(location.search);
  void flush(TELEMETRY_URL, globalThis.fetch, () => sharing(test));
  const onLeave = leave(test);
  addEventListener('pagehide', onLeave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) onLeave(); });
}
