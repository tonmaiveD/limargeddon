import Phaser from 'phaser';
import type { DiffKey } from '../core/config';
import { Sfx } from '../core/audio/sfx';
import type { Summary } from '../core/world';
import { STAGES } from '../stages';
import { exportFights, fightStats } from '../core/save';

interface ResultsData { summary: Summary; stageId: string; dk: DiffKey }

/* Resultados: overlay DOM sobre la etapa, que sigue animando humo y partículas detrás. */
export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(data: ResultsData): void {
    const { summary: s, stageId, dk } = data, cfg = STAGES[stageId].cfg, R = cfg.rewards;
    const $ = (id: string) => document.getElementById(id)!;
    const bossName = cfg.boss.title;
    $('endEyebrow').textContent = s.win ? `Etapa ${cfg.number} completa` : `Etapa ${cfg.number} · fallida`;
    $('endTitle').textContent = s.win ? `${bossName} cayó` : `Te chocó ${bossName.replace(/^La /, "la ")}`;
    $('endStats').innerHTML = `<dt>Tiempo</dt><dd>${s.time}</dd><dt>Daño por la derecha</dt><dd>${s.rightPct}%</dd>
      <dt>Bonus recogidos</dt><dd>${s.powers}</dd><dt>Papeletas</dt><dd style="color:var(--pink)">-S/ ${s.fines}</dd>
      <dt>Pago neto</dt><dd style="color:var(--yellow)">S/ ${s.pay}</dd>${historyRow(stageId, dk, cfg.difficulties[dk].label)}`;
    $('endBadges').innerHTML = s.win ? `
      <div class="badge ${s.blind ? '' : 'off'}">Ni la vio venir · ${R.blindPct}% del daño por la derecha</div>
      <div class="badge ${s.clean ? '' : 'off'}">Sin rayones · cero daño en la fase 3 (+S/ ${R.clean})</div>
      <div class="badge ${s.honest ? '' : 'off'}">Vecino ejemplar · cero papeletas del serenazgo</div>
      <div class="badge">Bolso de Diseñador · anula una papeleta por etapa</div>`
      : `<div class="badge off">Consejo: el aceite la hace derrapar y deja expuesto su lado derecho. La Combi Kamikaze quita ${cfg.powers.combi.dmg ?? 80}.</div>`;
    const end = $('end'), again = $('again') as HTMLButtonElement, toMenu = $('toMenu') as HTMLButtonElement;
    const close = () => { end.hidden = true; again.onclick = null; toMenu.onclick = null; this.scene.stop(); };
    again.onclick = () => { close(); this.scene.get('Stage').scene.restart({ stageId, dk }); };
    toMenu.onclick = () => { close(); Sfx.engine(0); this.scene.stop('Stage'); this.scene.start('Menu'); };
    const copy = $('copyLog') as HTMLButtonElement;
    copy.textContent = 'Copiar registro';
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(exportFights())); copy.textContent = 'Registro copiado'; }
      catch { copy.textContent = 'No se pudo copiar'; }
    };
    end.hidden = false; again.focus();
  }
}

// Mediana de las victorias registradas en este dispositivo, para calibrar el balance con partidas reales.
function historyRow(stageId: string, dk: DiffKey, label: string): string {
  const h = fightStats(stageId, dk);
  if (!h.median) return '';
  const m = Math.floor(h.median / 60), sec = String(Math.floor(h.median % 60)).padStart(2, '0');
  return `<dt>Tus victorias en ${label}</dt><dd>${h.wins} de ${h.played} · mediana ${m}:${sec}</dd>`;
}
