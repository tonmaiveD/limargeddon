import Phaser from 'phaser';
import type { DiffKey, FireMode } from '../core/config';
import { Sfx } from '../core/audio/sfx';
import type { Summary } from '../core/world';
import { STAGES, nextStage } from '../stages';
import { exportFights, fightStats } from '../core/save';

const FIRE_LABEL: Record<FireMode, string> = { toque: 'Por toque', acelerar: 'Acelerar es atacar', mantener: 'Mantener' };
const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE');

interface ResultsData {
  summary: Summary; stageId: string; dk: DiffKey; earned: number; replay: boolean; wallet: number;
  score: { points: number; best: number; record: boolean; test: boolean } | null;
}

/* Resultados: overlay DOM sobre la etapa, que sigue animando humo y partículas detrás. */
export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(data: ResultsData): void {
    const { summary: s, stageId, dk, earned, replay, wallet, score } = data, cfg = STAGES[stageId].cfg, R = cfg.rewards;
    const $ = (id: string) => document.getElementById(id)!;
    const bossName = cfg.boss.title;
    const name = cfg.secret ? 'Etapa secreta' : `Etapa ${cfg.number}`;
    $('endEyebrow').textContent = s.win ? `${name} completa` : `${name} · fallida`;
    $('endTitle').textContent = cfg.route ? (s.win ? '¡Subiste al carguero!' : 'Te quedaste en tierra')
      : s.win ? `${bossName} cayó` : `Te ganó ${bossName.replace(/^(La|El) /, (m) => m.toLowerCase())}`;
    $('endStats').innerHTML = `${s.fireMode !== 'mantener' ? `<dt>Disparo</dt><dd>${FIRE_LABEL[s.fireMode]}</dd>` : ''}${score ? `<dt>Puntaje${score.test ? ' (modo prueba)' : ''}</dt><dd style="color:var(--yellow)">${score.points.toLocaleString('es-PE')}</dd>` : ''}<dt>Tiempo</dt><dd>${s.time}</dd>${s.win ? '' : (cfg.route ? `<dt>Recorrido</dt><dd>${100 - s.bossPct}%</dd>` : `<dt>Vida que le quedó al jefe</dt><dd>${s.bossPct}%</dd>`) + (s.lastHit ? `<dt>Último golpe</dt><dd style="color:var(--pink)">${s.lastHit}</dd>` : '')}<dt>Daño por la derecha</dt><dd>${s.rightPct}%</dd>
      ${s.fireMode !== 'mantener' ? `<dt>Mejor racha</dt><dd style="color:var(--green)">${s.bestCombo}</dd>` : ''}<dt>Bonus recogidos</dt><dd>${s.powers}</dd><dt>Papeletas</dt><dd style="color:var(--pink)">-S/ ${s.fines}</dd>
      <dt>Cobrado${replay ? ' (etapa repetida: 50%)' : ''}</dt><dd style="color:var(--yellow)">${money(earned)}</dd>
      <dt>Billetera</dt><dd style="color:var(--yellow)">${money(wallet)}</dd>${historyRow(stageId, dk, cfg.difficulties[dk].label, s.fireMode)}`;
    $('endBadges').innerHTML = s.win ? `${R.winLine ? `<div class="badge">${R.winLine}</div>` : ''}
      ${score?.record ? `<div class="badge">¡Récord personal en esta etapa! · ${score.points.toLocaleString('es-PE')} puntos</div>` : ''}
      ${cfg.route ? '' : `<div class="badge ${s.blind ? '' : 'off'}">Ni la vio venir · ${R.blindPct}% del daño por la derecha</div>`}
      <div class="badge ${s.clean ? '' : 'off'}">Sin rayones · cero daño en la fase 3 (+S/ ${R.clean})</div>
      <div class="badge ${s.honest ? '' : 'off'}">Vecino ejemplar · cero papeletas</div>
      ${cfg.hazards?.cart ? `<div class="badge ${s.cartHits ? 'off' : ''}">Don Frío intacto · nunca tocaste la carretilla (+S/ ${cfg.hazards.cart.bonus})</div>` : ''}
      ${R.item ? `<div class="badge">${R.item.name} · ${R.item.desc}</div>` : ''}`
      : `<div class="badge off">${R.defeatTip ?? `El punto ciego está a la derecha. La Combi Kamikaze quita ${cfg.powers.combi.dmg ?? 80}.`}</div>`;
    const end = $('end'), again = $('again') as HTMLButtonElement, toMenu = $('toMenu') as HTMLButtonElement, next = $('next') as HTMLButtonElement;
    const close = () => { end.hidden = true; again.onclick = null; toMenu.onclick = null; next.onclick = null; this.scene.stop(); };
    again.onclick = () => { close(); this.scene.get('Stage').scene.restart({ stageId, dk }); };
    // al ganar, el botón principal lleva al taller y de ahí a la etapa siguiente (ya desbloqueada);
    // al perder, la revancha es lo principal y el taller queda como opción
    const nxt = s.win ? nextStage(stageId) : null, target = nxt ?? stageId;
    next.hidden = false; next.textContent = s.win ? 'Al taller' : 'Taller';
    next.className = s.win ? 'pick' : 'pick alt'; again.className = s.win ? 'pick alt' : 'pick';
    next.onclick = () => { close(); this.scene.stop('Stage'); this.scene.start('Garage', { stageId: target, dk }); };
    if (s.win && nxt && STAGES[nxt].cfg.secret) $('endBadges').insertAdjacentHTML('beforeend', '<div class="badge">Una línea amarilla aparece en el mapa. Algo te espera más allá del recorrido.</div>');
    if (s.win && !nxt) $('endBadges').insertAdjacentHTML('beforeend', '<div class="badge">¡Completaste todas las etapas disponibles! Pronto llegan más distritos.</div>');
    toMenu.onclick = () => { close(); Sfx.engine(0); this.scene.stop('Stage'); this.scene.start('Menu'); };
    const copy = $('copyLog') as HTMLButtonElement;
    copy.textContent = 'Copiar registro';
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(exportFights())); copy.textContent = 'Registro copiado'; }
      catch { copy.textContent = 'No se pudo copiar'; }
    };
    end.hidden = false; (s.win ? next : again).focus();
  }
}

// Mediana de las victorias registradas en este dispositivo, para calibrar el balance con partidas reales.
function historyRow(stageId: string, dk: DiffKey, label: string, mode: FireMode): string {
  const h = fightStats(stageId, dk, mode === 'mantener' ? undefined : mode);
  if (!h.median) return '';
  const m = Math.floor(h.median / 60), sec = String(Math.floor(h.median % 60)).padStart(2, '0');
  // etiqueta corta para que la fila no se parta en pantallas angostas
  const modeLabel = mode === 'toque' ? ' (por toque)' : mode === 'acelerar' ? ' (acelerando)' : '';
  return `<dt>Tus victorias en ${label}${modeLabel}</dt><dd>${h.wins} de ${h.played} · mediana ${m}:${sec}</dd>`;
}
