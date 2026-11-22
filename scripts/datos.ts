/*
 * Informe de los datos anónimos de partidas (ADR 0051, PR C). `npm run datos` descarga del receptor con la clave de
 * `.env.datos` (fuera del repositorio), guarda la descarga en `datos/` y arma ahí un informe en Markdown.
 * - El público y el equipo de pruebas van en secciones separadas, y dentro de cada una se separa por etapa, dificultad y
 *   modo de disparo. Las peleas sin modo (las que llegaron antes del PR #54) van como "desconocido", sin suponer ninguno.
 * - "Salidas al menú" son los abandonos: volver al menú a mitad de pelea. Cerrar la app no se registra.
 * - Las victorias en menos de 10 s son pruebas forzadas y quedan fuera, contadas aparte.
 * - Créditos (ADR 0060): cómo terminaron y el mayor rato con la imagen quieta, por origen y por si era la primera vez.
 * - Prueba de arte de la Costa Verde (ADR 0067): partidas por versión del arte, por orden y la encuesta.
 * - No hay jugadores únicos ni seguimiento de una persona, por diseño: todo se cuenta por partida.
 * Opciones: --desde AAAA-MM-DD, --build <versión>, --archivo <descarga.json> (sin red, desde una descarga guardada).
 * La lógica es pura (`report`) para probarla sin red; la descarga y los archivos solo corren al llamarlo desde la consola.
 */

export interface Frames { play?: { n: number; p95: number; p99: number; over33: number } | null; stallCount?: number; anomalies?: number[] }
export interface Ev {
  kind: 'pelea' | 'abandono' | 'compra' | 'creditos' | 'piloto' | 'piloto-encuesta'; build: string; day: string; device: string; tester?: string;
  stage?: string; dk?: string; fireMode?: string; win?: boolean; t?: number; bossPct?: number; gross?: number; fines?: number;
  lastHit?: string; dmgBy?: Record<string, number>; frames?: Frames; phase?: number; hpPct?: number;
  upgrades?: Record<string, number>; walletStart?: number; cheapest?: number;
  upgrade?: string; level?: number; price?: number; wallet?: number;
  from?: string; first?: boolean | string; reached?: number; maxStall?: number; skips?: number; end?: string;
  session?: string; round?: number; variant?: string; prefer?: string; readable?: string; lima?: string; recognized?: string;
}
export interface Stage { id: string; name: string }
export interface Opts { since?: string; build?: string; stages?: Stage[]; now?: string }

export const FEW = 5; // con menos peleas que esto, el porcentaje se marca como poco confiable
// Ninguna etapa se gana jugando en menos de esto: una victoria más rápida es una prueba forzada (comandos de simulación o
// créditos) y se deja fuera del informe, contada aparte.
export const MIN_WIN_S = 10;
export const forced = (e: Ev) => (e.kind === 'pelea' || e.kind === 'piloto') && !!e.win && (e.t ?? 0) < MIN_WIN_S;

/* ---------- números ---------- */

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// decimales con coma, como en los textos del juego
const fmt = (x: number | null, dec = 0) => (x === null ? '·' : x.toFixed(dec).replace('.', ','));
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '·');
const few = (n: number) => (n < FEW ? ' (pocas)' : '');
const mode = (e: Ev) => e.fireMode ?? 'desconocido';
const cell = (s: string) => s.replace(/\|/g, '/');

function groupBy<T>(xs: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) { const k = key(x); m.set(k, [...(m.get(k) ?? []), x]); }
  return m;
}
const table = (head: string[], rows: string[][]) =>
  rows.length ? [`| ${head.join(' | ')} |`, `|${head.map(() => ' --- ').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n') : '_Sin datos._';

/* ---------- secciones ---------- */

function fights(ev: Ev[], name: (id: string) => string, order: (id: string) => number): string {
  const f = ev.filter((e) => e.kind === 'pelea');
  const groups = [...groupBy(f, (e) => `${e.stage}|${e.dk}|${mode(e)}`)].sort(([a], [b]) => {
    const [sa, da, ma] = a.split('|'), [sb, db, mb] = b.split('|');
    return order(sa) - order(sb) || DK.indexOf(da) - DK.indexOf(db) || ma.localeCompare(mb);
  });
  const rows = groups.map(([k, g]) => {
    const [stage, dk, m] = k.split('|');
    const won = g.filter((e) => e.win), lost = g.filter((e) => !e.win);
    const gross = g.reduce((s, e) => s + (e.gross ?? 0), 0), fines = g.reduce((s, e) => s + (e.fines ?? 0), 0);
    return [name(stage), dk, m, `${g.length}${few(g.length)}`, `${won.length} (${pct(won.length, g.length)})`,
      fmt(median(won.map((e) => e.t ?? 0)), 1), fmt(median(lost.map((e) => e.bossPct ?? 0))), gross ? pct(fines, gross) : '·'];
  });
  return table(['Etapa', 'Dificultad', 'Modo', 'Peleas', 'Ganadas', 'Tiempo al ganar (s, mediana)', 'Vida del jefe al perder (%, mediana)', 'Multas sobre el cobro'], rows);
}

function damage(ev: Ev[], name: (id: string) => string, order: (id: string) => number): string {
  const f = ev.filter((e) => e.kind === 'pelea');
  const rows = [...groupBy(f, (e) => e.stage ?? '')].sort(([a], [b]) => order(a) - order(b)).map(([stage, g]) => {
    const by: Record<string, number> = {};
    for (const e of g) for (const [k, v] of Object.entries(e.dmgBy ?? {})) by[k] = (by[k] ?? 0) + v;
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${pct(v, total)}`).join(', ');
    const last = [...groupBy(g.filter((e) => !e.win && e.lastHit), (e) => e.lastHit!)].sort((a, b) => b[1].length - a[1].length)
      .slice(0, 2).map(([k, l]) => `${k} (${l.length})`).join(', ');
    return [name(stage), `${g.length}`, top || '·', last || '·'];
  });
  return table(['Etapa', 'Peleas', 'Más daño (parte del total)', 'Último golpe en derrotas'], rows);
}

function exits(ev: Ev[], name: (id: string) => string, order: (id: string) => number): string {
  const a = ev.filter((e) => e.kind === 'abandono');
  const fightsBy = groupBy(ev.filter((e) => e.kind === 'pelea'), (e) => e.stage ?? '');
  const rows = [...groupBy(a, (e) => e.stage ?? '')].sort(([x], [y]) => order(x) - order(y)).map(([stage, g]) => [
    name(stage), `${g.length}`, pct(g.length, g.length + (fightsBy.get(stage)?.length ?? 0)), fmt(median(g.map((e) => e.t ?? 0)), 1),
    fmt(median(g.map((e) => e.phase ?? 0))), fmt(median(g.map((e) => e.bossPct ?? 0))), fmt(median(g.map((e) => e.hpPct ?? 0))),
  ]);
  return table(['Etapa', 'Salidas', 'Sobre peleas empezadas', 'Tiempo (s, mediana)', 'Fase (mediana)', 'Vida del jefe (%)', 'Vida del Tico (%)'], rows);
}

function buys(ev: Ev[]): string {
  const b = ev.filter((e) => e.kind === 'compra');
  const rows = [...groupBy(b, (e) => e.upgrade ?? '')].sort((x, y) => y[1].length - x[1].length).map(([u, g]) => [
    u, `${g.length}`, fmt(Math.max(...g.map((e) => e.level ?? 0))), fmt(median(g.map((e) => e.price ?? 0))), fmt(median(g.map((e) => e.wallet ?? 0))),
  ]);
  return table(['Mejora', 'Compras', 'Nivel más alto', 'Precio (S/, mediana)', 'Billetera después (S/, mediana)'], rows);
}

// ¿Al que pierde le alcanzaba para una mejora y no la compró? Solo las peleas que traen la billetera (desde el PR #59).
function wallet(ev: Ev[], name: (id: string) => string, order: (id: string) => number): string {
  const lost = ev.filter((e) => e.kind === 'pelea' && !e.win && e.walletStart !== undefined);
  const rows = [...groupBy(lost, (e) => e.stage ?? '')].sort(([a], [b]) => order(a) - order(b)).map(([stage, g]) => {
    const bare = g.filter((e) => !Object.keys(e.upgrades ?? {}).length);
    const could = (xs: Ev[]) => xs.filter((e) => e.cheapest !== undefined && e.walletStart! >= e.cheapest).length;
    return [name(stage), `${g.length}${few(g.length)}`, fmt(median(g.map((e) => e.walletStart!))), `${could(g)} (${pct(could(g), g.length)})`,
      `${bare.length}`, `${could(bare)}`];
  });
  return table(['Etapa', 'Derrotas', 'Billetera al empezar (S/, mediana)', 'Le alcanzaba para una mejora', 'Sin ninguna mejora', 'Sin mejoras y le alcanzaba'], rows);
}

function smooth(ev: Ev[]): string {
  const f = ev.filter((e) => e.kind === 'pelea' && e.frames?.play);
  const rows = [...groupBy(f, (e) => e.device)].sort((a, b) => b[1].length - a[1].length).map(([d, g]) => {
    const frames = g.reduce((s, e) => s + e.frames!.play!.n, 0), lost = g.reduce((s, e) => s + e.frames!.play!.over33, 0);
    return [d, `${g.length}`, fmt(median(g.map((e) => e.frames!.play!.p95)), 1), fmt(median(g.map((e) => e.frames!.play!.p99)), 1),
      frames ? `${fmt((100 * lost) / frames, 1)} %` : '·', fmt(median(g.map((e) => e.frames!.stallCount ?? 0))),
      `${g.filter((e) => e.frames!.anomalies?.length).length}`];
  });
  return [table(['Equipo', 'Peleas', 'p95 (ms)', 'p99 (ms)', 'Cuadros de más de 33 ms', 'Bloqueos por pelea (mediana)', 'Peleas con anomalías'], rows),
    '', 'Objetivo: p95 de hasta 20 ms y p99 de hasta 33,3 ms (ADR 0045). Una pelea con anomalías (intervalos de más de 5 s) no sirve para aprobar fluidez.'].join('\n');
}

// Créditos (ADR 0060). Un rato de más de 1 s con la imagen quieta, fuera de la pausa, es un cuelgue que se nota.
export const STALL_S = 1;
const ENDS = ['completo', 'saltado', 'despues', 'salida', 'error'];
function credits(ev: Ev[]): string {
  const c = ev.filter((e) => e.kind === 'creditos');
  const rows = [...groupBy(c, (e) => `${e.from}|${e.first ? 'primera' : 'repetida'}`)].sort(([a], [b]) => a.localeCompare(b)).map(([k, g]) => {
    const [from, vez] = k.split('|');
    return [from === 'victoria' ? 'Victoria' : 'Menú', vez === 'primera' ? 'Primera' : 'Repetida', `${g.length}${few(g.length)}`,
      ...ENDS.map((end) => `${g.filter((e) => e.end === end).length}`),
      fmt(median(g.map((e) => e.reached ?? 0)), 1), fmt(median(g.map((e) => e.maxStall ?? 0)), 2), fmt(g.length ? Math.max(...g.map((e) => e.maxStall ?? 0)) : null, 2),
      `${g.filter((e) => (e.maxStall ?? 0) > STALL_S).length}`];
  });
  return table(['Origen', 'Vez', 'Veces', 'Completos', 'Saltados', 'Ver después', 'Salidas', 'Errores', 'Llegaron hasta (s, mediana)',
    'Imagen quieta (s, mediana)', 'Imagen quieta (s, máximo)', `Quieta más de ${STALL_S} s`], rows);
}

const DK = ['facil', 'normal', 'dificil'];

// Prueba de arte de la Costa Verde (ADR 0067). Cada persona juega con el arte actual y con el nuevo, en orden alternado.
const ART = [['actual', 'Actual'], ['nuevo', 'Nuevo']] as const;
function pilot(ev: Ev[]): string {
  const r = ev.filter((e) => e.kind === 'piloto'), q = ev.filter((e) => e.kind === 'piloto-encuesta');
  if (!r.length && !q.length) return '_Sin datos._';
  const play = (g: Ev[]) => g.filter((e) => e.frames?.play);
  const rounds = ART.map(([v, label]) => {
    const g = r.filter((e) => e.variant === v), fin = g.filter((e) => e.end !== 'abandono');
    return [label, `${g.length}${few(g.length)}`, pct(fin.filter((e) => e.win).length, fin.length), `${g.length - fin.length}`, fmt(median(fin.map((e) => e.t ?? 0)), 0),
      fmt(median(fin.map((e) => e.bossPct ?? 0))), fmt(median(fin.map((e) => e.hpPct ?? 0))),
      fmt(median(play(g).map((e) => e.frames!.play!.p95)), 1), fmt(median(play(g).map((e) => e.frames!.play!.p99)), 1)];
  });
  const order = ART.map(([v, label]) => {
    const g = (first: boolean) => r.filter((e) => e.variant === v && e.end !== 'abandono' && (e.first === v) === first);
    return [label, ...[true, false].flatMap((f) => [`${g(f).length}`, pct(g(f).filter((e) => e.win).length, g(f).length)])];
  });
  const sources = [...new Set(r.flatMap((e) => Object.keys(e.dmgBy ?? {})))];
  const dmg = sources.map((k) => [cell(k), ...ART.map(([v]) => {
    const g = r.filter((e) => e.variant === v);
    return g.length ? fmt(g.reduce((s, e) => s + (e.dmgBy?.[k] ?? 0), 0) / g.length, 1) : '·';
  })]).sort((a, b) => Number(b[1].replace(',', '.')) - Number(a[1].replace(',', '.'))).slice(0, 8);
  const count = (k: keyof Ev, vals: string[], g: Ev[]) => vals.map((x) => `${g.filter((e) => e[k] === x).length}`);
  const survey = [['Se veía mejor', 'prefer'], ['Peligros y avisos más claros', 'readable']].map(([label, k]) =>
    [label, ...count(k as keyof Ev, ['actual', 'nuevo', 'igual'], q)]);
  const lima = [['Vive o vivió en Lima', 'si'], ['No', 'no']].map(([label, l]) => {
    const g = q.filter((e) => e.lima === l);
    return [label, `${g.length}`, ...count('recognized', ['si', 'no', 'nose'], g)];
  });
  return [
    `${r.length} partidas y ${q.length} encuestas. Cada persona juega las dos versiones, así que cuenta dos veces en la primera tabla. Las victorias se cuentan sobre las partidas terminadas.`, '',
    table(['Arte', 'Partidas', 'Victorias', 'Abandonos', 'Tiempo (s, mediana)', 'Jefe restante (%, mediana)', 'Vida restante (%, mediana)', 'p95 (ms)', 'p99 (ms)'], rounds), '',
    'Por orden: jugar primero o segundo cambia el resultado, porque la segunda vez ya se conoce la pelea.', '',
    table(['Arte', 'Jugada primero', 'Victorias', 'Jugada segundo', 'Victorias'], order), '',
    'Daño recibido por partida, por fuente.', '',
    sources.length ? table(['Fuente', 'Actual', 'Nuevo'], dmg) : '_Sin daño registrado._', '',
    'Encuesta. Las respuestas A y B ya van traducidas al arte con que se jugó cada una.', '',
    table(['Pregunta', 'Actual', 'Nuevo', 'Igual'], survey), '',
    table(['Reconoció la Costa Verde', 'Respuestas', 'Sí', 'No', 'No sé'], lima),
  ].join('\n');
}

function audience(title: string, ev: Ev[], name: (id: string) => string, order: (id: string) => number): string {
  if (!ev.length) return `## ${title}\n\n_Sin datos._`;
  return [`## ${title}`, '', '### Peleas', '', fights(ev, name, order), '', '### Daño recibido', '', damage(ev, name, order), '',
    '### Salidas al menú', '', 'Volver al menú a mitad de pelea. Cerrar la app no se registra.', '', exits(ev, name, order), '',
    '### Compras del taller', '', buys(ev), '',
    '### Derrotas y billetera', '', '¿Al que perdió le alcanzaba para una mejora? Solo las peleas que traen la billetera al empezar.', '', wallet(ev, name, order), '',
    '### Créditos', '', 'Duran unos 84 s. "Salidas" son cierres o recargas a mitad, que llegan al abrir el juego otra vez. "Imagen quieta" es el mayor rato sin avanzar fuera de la pausa.', '', credits(ev), '',
    '### Fluidez por tipo de equipo', '', smooth(ev)].join('\n');
}

/* ---------- informe ---------- */

export function report(all: Ev[], o: Opts = {}): string {
  const kept = all.filter((e) => (!o.since || e.day >= o.since) && (!o.build || e.build === o.build));
  const ev = kept.filter((e) => !forced(e)), dropped = kept.length - ev.length;
  const names = new Map((o.stages ?? []).map((s, i) => [s.id, { name: s.name, i }]));
  const name = (id: string) => names.get(id)?.name ?? id;
  const order = (id: string) => names.get(id)?.i ?? 99;
  const days = ev.map((e) => e.day).sort();
  const kinds = (xs: Ev[]) => ['pelea', 'abandono', 'compra', 'creditos'].map((k) => xs.filter((e) => e.kind === k).length);
  const pub = ev.filter((e) => !e.tester), team = ev.filter((e) => e.tester);
  const builds = [...groupBy(ev, (e) => e.build)].map(([b, g]) => {
    const d = g.map((e) => e.day).sort();
    const [p, a, c] = kinds(g);
    return [b, d[0] === d[d.length - 1] ? d[0] : `${d[0]} a ${d[d.length - 1]}`, `${p}`, `${a}`, `${c}`];
  }).sort((x, y) => x[1].localeCompare(y[1]));
  const unknown = ev.filter((e) => e.kind === 'pelea' && !e.fireMode).length;
  const [p, a, c, r] = kinds(ev), [pp, pa, pc, pr] = kinds(pub), [tp, ta, tc, tr] = kinds(team);
  return [
    '# Informe de datos anónimos', '',
    `Generado el ${o.now ?? new Date().toISOString().slice(0, 10)}. ${days.length ? `Partidas del ${days[0]} al ${days[days.length - 1]}.` : 'Sin partidas.'}` +
      `${o.since ? ` Desde el ${o.since}.` : ''}${o.build ? ` Solo la versión ${o.build}.` : ''}`, '',
    'Todo se cuenta por partida: los datos no permiten saber cuántas personas jugaron ni seguir a una. ' +
      `Los porcentajes con menos de ${FEW} peleas van marcados como "(pocas)".`, '',
    '## Resumen', '',
    table(['', 'Peleas', 'Salidas al menú', 'Compras', 'Créditos'], [['Público', `${pp}`, `${pa}`, `${pc}`, `${pr}`], ['Equipo de pruebas', `${tp}`, `${ta}`, `${tc}`, `${tr}`], ['Total', `${p}`, `${a}`, `${c}`, `${r}`]]), '',
    ...(dropped ? [`${dropped} ${dropped === 1 ? 'victoria' : 'victorias'} en menos de ${MIN_WIN_S} s quedan fuera, porque son pruebas forzadas y no partidas.`, ''] : []),
    ...(unknown ? [`${unknown} ${unknown === 1 ? 'pelea llegó' : 'peleas llegaron'} sin modo de disparo (antes del PR #54). Van como modo "desconocido".`, ''] : []),
    '### Versiones del juego', '', table(['Versión', 'Días', 'Peleas', 'Salidas', 'Compras'], builds), '',
    audience('Público', pub, name, order), '',
    audience(`Equipo de pruebas (${[...new Set(team.map((e) => e.tester))].sort().join(', ') || 'nadie'})`, team, name, order), '',
    '## Prueba de arte de la Costa Verde', '', 'Demo aparte del juego (ADR 0067), con público y equipo de pruebas juntos.', '', pilot(ev), '',
  ].join('\n');
}

/* ---------- consola ---------- */

async function main(): Promise<void> {
  const fs = await import('node:fs'), path = await import('node:path');
  const args = process.argv.slice(2), opt = (k: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const since = opt('desde'), build = opt('build'), file = opt('archivo');
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('--desde va como AAAA-MM-DD');
  const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'datos'), today = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(out, { recursive: true });
  let events: Ev[];
  if (file) events = JSON.parse(fs.readFileSync(file, 'utf8'));
  else {
    const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env.datos'), 'utf8').split('\n').filter((l) => l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
    if (!env.DATOS_URL || !env.DATOS_TOKEN) throw new Error('faltan DATOS_URL o DATOS_TOKEN en .env.datos');
    const res = await fetch(`${env.DATOS_URL.replace(/\/$/, '')}/v1/export?desde=${since ?? '2000-01-01'}`, { headers: { Authorization: `Bearer ${env.DATOS_TOKEN}` } });
    if (!res.ok) throw new Error(`el receptor respondió ${res.status}`);
    events = await res.json();
    fs.writeFileSync(path.join(out, `crudo-${today}.json`), JSON.stringify(events));
  }
  const stages = fs.readdirSync(path.join(root, 'src/stages'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const c = JSON.parse(fs.readFileSync(path.join(root, 'src/stages', d.name, 'config.json'), 'utf8'));
    return { id: c.id as string, name: (c.district ?? c.id) as string, n: c.number as number };
  }).sort((x, y) => x.n - y.n);
  const md = report(events, { since, build, stages, now: today });
  const dest = path.join(out, `informe-${today}.md`);
  fs.writeFileSync(dest, md);
  console.log(`${events.length} registros. Informe en ${path.relative(root, dest)}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main().catch((e) => { console.error(e.message); process.exit(1); });
