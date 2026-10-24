import { DEFAULT_NAME, NAME_MAX, cleanName, getPlayerName, ranking, resetProgress, setPlayerName } from '../core/save';

/*
 * Diálogos del jugador (ADR 0029): nombre, ranking local y empezar de nuevo. Son overlays DOM encima del menú.
 * Los textos siguen la regla del juego: sin dos puntos, punto y coma ni guiones largos.
 */

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const pts = (n: number) => n.toLocaleString('es-PE');

// Pide el nombre. Si `required`, no hay botón para volver (primera vez). Vacío queda como TAXISTA.
export function openName(required: boolean, done: (name: string) => void): void {
  const dlg = $<HTMLFormElement>('nameDlg'), input = $<HTMLInputElement>('nameInput'), cancel = $('nameCancel');
  input.value = getPlayerName() ?? ''; input.placeholder = DEFAULT_NAME; input.maxLength = NAME_MAX;
  cancel.hidden = required;
  // se limpia mientras escribe, así nunca ve un nombre distinto al que se guardará
  input.oninput = () => { const c = cleanName(input.value); if (c !== input.value) input.value = c; };
  dlg.onsubmit = (e) => { e.preventDefault(); dlg.hidden = true; done(setPlayerName(input.value)); };
  cancel.onclick = () => { dlg.hidden = true; };
  dlg.hidden = false; input.focus();
}

export function openRanking(): void {
  const list = $('rankList'), me = getPlayerName(), rows = ranking();
  list.innerHTML = rows.length
    ? rows.map((r, i) => `<li class="${r.name === me ? 'me' : ''}"><b>${i + 1}</b><span>${r.name} · ${r.stages} ${r.stages === 1 ? 'etapa' : 'etapas'}</span><span>${pts(r.total)}</span></li>`).join('')
    : '<li class="empty">Todavía no hay puntajes. Gana una etapa para aparecer.</li>';
  $('rankClose').onclick = () => { $('rankDlg').hidden = true; };
  $('rankDlg').hidden = false;
}

// Empezar de nuevo, con advertencia y una segunda confirmación.
export function openReset(done: () => void): void {
  const dlg = $('resetDlg'), title = $('resetTitle'), text = $('resetText'), yes = $<HTMLButtonElement>('resetYes'), no = $('resetNo');
  let step = 1;
  const show = () => {
    title.textContent = step === 1 ? 'Empezar de nuevo' : '¿Seguro?';
    text.textContent = step === 1
      ? 'Vuelves a la Etapa 1 con la billetera en cero, sin mejoras ni objetos. Tu nombre y el ranking se conservan.'
      : 'Esto no se puede deshacer. Pierdes el avance y todo lo comprado en el taller.';
    yes.textContent = step === 1 ? 'Continuar' : 'Sí, empezar de nuevo';
  };
  yes.onclick = () => {
    if (step === 1) { step = 2; show(); return; }
    resetProgress(); dlg.hidden = true; done();
  };
  no.onclick = () => { dlg.hidden = true; };
  show(); dlg.hidden = false; no.focus();
}
