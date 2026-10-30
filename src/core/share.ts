import { getSettings, setSettings } from './save';
import { cleanTester, enqueue, flush, flushOnLeave, type Ctx, type DataEvent } from './telemetry';

/*
 * Cuándo se envían los datos anónimos de partidas (ADR 0051): salvo que el jugador lo apague en el menú, y nunca en el
 * modo prueba. Lo que se envía y cómo está en telemetry.ts.
 */

export const sharing = (test: boolean): boolean => !test && getSettings().share !== false;
const ctx = (): Ctx => ({ build: __BUILD__, tester: getSettings().tester });

// Anota un registro y prueba mandar lo pendiente.
export function track(test: boolean, make: (c: Ctx) => DataEvent): void {
  if (!sharing(test)) return;
  enqueue(make(ctx()));
  void flush();
}

// ?tester=nombre deja la etiqueta del equipo de pruebas en este teléfono; ?tester= la borra.
export function readTester(search: string): void {
  const q = new URLSearchParams(search);
  if (!q.has('tester')) return;
  const t = cleanTester(q.get('tester') ?? '');
  setSettings({ tester: t || undefined });
}

// Al abrir el juego manda lo que quedó pendiente; al esconder o cerrar la app, un último intento.
export function installSharing(test: boolean): void {
  if (typeof location !== 'undefined') readTester(location.search);
  if (!sharing(test)) return;
  void flush();
  addEventListener('pagehide', () => flushOnLeave());
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushOnLeave(); });
}
