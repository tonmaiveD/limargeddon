import Phaser from 'phaser';
import { W, H, ZOOM } from '../core/constants';
import { fitStage, showDeck } from '../core/layout';
import { installInput } from '../core/input';
import { ui } from '../core/render';
import { installSharing, sharing, track } from '../core/share';
import { pilotEvent, pilotSurveyEvent, type PilotVariant } from '../core/telemetry';
import { TEST_MODE } from '../stages';
import { PilotoBoot, PilotoStage, type RoundResult } from './scenes';
import { firstFor, freeVariant, letterFor, nextCount, roundStats, surveyStats, variantFor, type Pick3, type RoundStats, type SurveyAnswers } from './flujo';
import { ART_VERSION } from './skin';

/*
 * Demo del piloto de arte de la Costa Verde (ADR 0067). Página aparte del juego: no tiene menú, taller ni guardado, y
 * no toca el progreso ni el ranking. Cada persona juega la Costa Verde dos veces, una con el arte actual y otra con el
 * nuevo (V2.1.1 del paquete), en orden alternado, y al final contesta cuatro preguntas. Las partidas y la encuesta
 * salen como datos anónimos marcados "piloto", con el mismo permiso del juego. Con ?prueba no se envía nada.
 */

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const screens = ['pIntro', 'pBetween', 'pSurvey', 'pThanks', 'pFreeEnd'];
const show = (id: string | null) => { for (const s of screens) $(s).hidden = s !== id; };

ui.touch = matchMedia('(pointer: coarse)').matches;
installInput();
// la etiqueta de ?tester= queda en memoria: la demo no escribe el guardado del juego
installSharing(TEST_MODE, { keepTester: false });
fitStage();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  width: W * ZOOM,
  height: H * ZOOM,
  backgroundColor: '#15111d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
  input: { keyboard: false },
  disableContextMenu: true,
  scene: [PilotoBoot, PilotoStage],
});
game.events.once(Phaser.Core.Events.READY, () => fitStage(game));
addEventListener('resize', () => fitStage(game));
new ResizeObserver(() => fitStage(game)).observe($('app'));
addEventListener('orientationchange', () => fitStage(game));
document.fonts?.ready.then(() => fitStage(game));

/* ---------- la prueba ---------- */

// ?arte=nuevo abre directo una sola versión, fuera de la prueba: sin encuesta ni datos y sin mover el orden alternado
const FREE = typeof location !== 'undefined' ? freeVariant(location.search) : null;

const newSession = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const state = { session: '', first: 'actual' as PilotVariant, round: 0, hints: [] as string[], rounds: [] as RoundStats[] };

function dataNote(): string {
  if (FREE) return 'Esta partida no es parte de la prueba y no envía datos.';
  if (TEST_MODE) return 'Modo prueba. No se envía ningún dato.';
  return sharing(TEST_MODE)
    ? 'Se envían datos anónimos de tus dos partidas y de tus respuestas, sin tu nombre, para mejorar el dibujo del juego.'
    : 'El envío de datos anónimos está apagado en este aparato. La prueba funciona igual, pero no queda registrada.';
}

function startTest(): void {
  state.session = newSession();
  state.first = firstFor(nextCount(globalThis.localStorage ?? null));
  state.round = 0; state.hints = []; state.rounds = [];
  startRound();
}

function startRound(): void {
  state.round++;
  show(null);
  game.scene.start('PilotoStage', { variant: FREE ?? variantFor(state.round, state.first), hintKnown: state.hints });
}

const verdict = (r: RoundStats) => (r.end === 'abandono' ? 'La dejaste' : r.win ? 'Ganaste' : 'Perdiste');
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

game.events.on('ronda', (r: RoundResult) => {
  if (FREE) {
    state.hints = r.hints;
    game.scene.stop('PilotoStage');
    showDeck(game, false);
    $('pFreeTitle').textContent = `${r.end === 'abandono' ? 'La dejaste' : r.G.result?.win ? 'Ganaste' : 'Perdiste'} · ${clock(r.G.t)}`;
    show('pFreeEnd'); $('pFreeAgain').focus();
    return;
  }
  const stats = roundStats(r.G, { session: state.session, round: state.round, first: state.first, end: r.end, frames: r.frames });
  state.rounds.push(stats); state.hints = r.hints;
  track(TEST_MODE, (c) => pilotEvent(stats, c));
  game.scene.stop('PilotoStage');
  showDeck(game, false);
  if (state.round === 1) { $('pBetweenTitle').textContent = verdict(stats); show('pBetween'); $('pNext').focus(); }
  else { ($('pSurvey') as HTMLFormElement).reset(); show('pSurvey'); }
});

$('pNext').onclick = () => startRound();

$('pSurvey').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target as HTMLFormElement), v = (k: string) => String(f.get(k));
  const a: SurveyAnswers = { prefer: v('prefer') as Pick3, readable: v('readable') as Pick3, lima: v('lima') as 'si' | 'no', recognized: v('recognized') as 'si' | 'no' | 'nose' };
  track(TEST_MODE, (c) => pilotSurveyEvent(surveyStats(state.session, state.first, a), c));
  $('pSummary').innerHTML = state.rounds.map((r) => `<dt>Versión ${letterFor(r.round)}</dt><dd>${verdict(r)} · ${clock(r.t)}</dd>`).join('');
  $('pSent').textContent = TEST_MODE ? 'Modo prueba, no se envió nada.' : sharing(TEST_MODE) ? 'Tus partidas y respuestas quedaron anotadas y se envían de forma anónima.' : 'El envío está apagado, así que no se registró nada.';
  show('pThanks');
});

$('pAgain').onclick = () => startTest();
$('pFreeAgain').onclick = () => startRound();

if (FREE) {
  $('pIntroEyebrow').textContent = FREE === 'nuevo' ? 'Arte nuevo' : 'Arte actual';
  $('pIntroTip').textContent = FREE === 'nuevo'
    ? 'Juega la Costa Verde con el dibujo nuevo, hecho con un generador de imágenes. Puedes repetirla las veces que quieras.'
    : 'Juega la Costa Verde con el dibujo actual del juego. Puedes repetirla las veces que quieras.';
  $('quit').textContent = 'Terminar la partida';
}

game.events.once('arte-listo', () => {
  $('pData').innerHTML = `${dataNote()} <a class="link" href="../privacidad.html">Privacidad</a>`;
  const start = $<HTMLButtonElement>('pStart');
  start.disabled = false; start.textContent = FREE ? 'Jugar' : 'Jugar la versión A';
  start.onclick = FREE ? () => startRound() : () => startTest();
});
show('pIntro');

if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game; piloto: unknown }).game = game;
if (import.meta.env.DEV) (window as unknown as { piloto: unknown }).piloto = { state, arte: ART_VERSION };
