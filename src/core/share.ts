import { getSettings, setSettings } from './save';
import { TELEMETRY_URL, cleanTester, clearQueue, creditsEvent, enqueue, flush, flushOnLeave, type Ctx, type CreditsEnd, type CreditsEvent, type DataEvent } from './telemetry';

/*
 * Cuándo se envían los datos anónimos de partidas (ADR 0051): salvo que el jugador lo apague en el menú, y nunca en el
 * modo prueba. Lo que se envía y cómo está en telemetry.ts. La preferencia se consulta en cada envío, no solo al abrir
 * el juego: apagarla corta los grupos siguientes y los envíos al cerrar, y borra lo pendiente (novena auditoría, V01).
 */

export const sharing = (test: boolean): boolean => !test && getSettings().share !== false;
// Lo que se juega en el servidor de desarrollo va marcado como equipo de pruebas aunque no tenga etiqueta, para que las
// pruebas de quien programa no se mezclen con el público en el informe.
export const DEV_TESTER = 'dev';
export const testerTag = (tester: string | undefined, dev: boolean): string | undefined => tester ?? (dev ? DEV_TESTER : undefined);
const ctx = (): Ctx => ({ build: __BUILD__, tester: testerTag(getSettings().tester, import.meta.env.DEV) });

// Anota un registro y prueba mandar lo pendiente.
export function track(test: boolean, make: (c: Ctx) => DataEvent): void {
  if (!sharing(test)) return;
  enqueue(make(ctx()));
  void flush(TELEMETRY_URL, globalThis.fetch, () => sharing(test));
}

/*
 * Créditos (ADR 0060). El registro se arma al entrar y se guarda como borrador en el teléfono mientras corren, con
 * "salida" como final. Al terminar se borra el borrador y sale el registro con su final de verdad. Si la página se
 * cierra o se recarga a mitad, el borrador queda y sale la próxima vez que se abre el juego. Así llegan también los
 * cuelgues que terminan con el jugador cerrando la app, que son los que más importan.
 */
export const CREDITS_DRAFT_KEY = 'limargeddon.creditos';
export type CreditsFields = Omit<CreditsEvent, 'id' | 'v' | 'build' | 'day' | 'device' | 'tester' | 'kind' | 'end'>;
function writeDraft(e: CreditsEvent | null): void {
  try { if (e) localStorage.setItem(CREDITS_DRAFT_KEY, JSON.stringify(e)); else localStorage.removeItem(CREDITS_DRAFT_KEY); } catch { /* bloqueado */ }
}
// Al entrar a los créditos. Con el envío apagado o en el modo prueba no se arma nada.
export function creditsStart(test: boolean, f: CreditsFields): CreditsEvent | null {
  if (!sharing(test)) return null;
  const e = creditsEvent({ ...f, end: 'salida' }, ctx());
  writeDraft(e);
  return e;
}
// Mientras corren: el borrador se pone al día (hasta dónde llegaron y el mayor rato quieto)
export function creditsProgress(e: CreditsEvent | null, f: Partial<CreditsFields>): CreditsEvent | null {
  if (!e) return null;
  const next = { ...e, ...f };
  writeDraft(next);
  return next;
}
// Al terminar: sale el registro con su final y se borra el borrador
export function creditsEnd(test: boolean, e: CreditsEvent | null, end: CreditsEnd, f: Partial<CreditsFields> = {}): void {
  writeDraft(null);
  if (!e) return;
  track(test, () => ({ ...e, ...f, end }));
}
// Al abrir el juego: un borrador que quedó es de unos créditos que se cerraron a mitad
export function recoverCredits(test: boolean): void {
  let d: unknown = null;
  try { d = JSON.parse(localStorage.getItem(CREDITS_DRAFT_KEY) ?? 'null'); } catch { /* roto: se descarta */ }
  writeDraft(null);
  if (d && typeof d === 'object' && (d as DataEvent).kind === 'creditos' && sharing(test)) enqueue({ ...(d as CreditsEvent), end: 'salida' });
}

// El interruptor del menú: apagarlo borra lo que esperaba en el teléfono, así no sale nada más.
export function setSharing(on: boolean): void {
  setSettings({ share: on, dataNotice: true });
  if (!on) { clearQueue(); writeDraft(null); }
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
  recoverCredits(test);
  void flush(TELEMETRY_URL, globalThis.fetch, () => sharing(test));
  const onLeave = leave(test);
  addEventListener('pagehide', onLeave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) onLeave(); });
}
