/*
 * Pruebas de escenas (deuda técnica, paso 4 del plan del 10 de noviembre): recorre el juego en un Chrome
 * sin ventana, como un teléfono en vertical, y revisa que cada escena lleve a la siguiente. Las pruebas de `tests/` cubren
 * la lógica pura. Esto cubre las uniones que antes se revisaban a mano:
 * - Menú, pelea, resultados, taller y menú otra vez, con la billetera y el avance guardados.
 * - Derrota y revancha, y salir al menú desde la pausa.
 * - Línea Amarilla, créditos y resultados: la primera vez no se saltan, después sí, y "Ver créditos" vuelve al menú.
 * - Los controles táctiles solo en la pelea y los créditos (ADR 0054).
 * Sin dependencias: habla con Chrome por el protocolo de DevTools. Los datos anónimos no salen: el receptor está bloqueado.
 * Corre sobre el servidor de desarrollo, el único que expone `game` para manejarlo.
 * Uso: `npm run escenas`. Chrome se busca en CHROME o en las rutas habituales.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 4179, DEBUG = 9339, ORIGIN = `http://localhost:${PORT}`;
const CHROMES = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// en GitHub la máquina es varias veces más lenta: los plazos se estiran, las condiciones no cambian
const SLOW = process.env.CI ? 4 : 1;
async function until(check, ms, what) {
  const end = Date.now() + ms * SLOW;
  for (;;) { try { const v = await check(); if (v) return v; } catch { /* todavía no */ } if (Date.now() > end) throw new Error(`no llegó a tiempo: ${what}`); await sleep(150); }
}

/* ---------- protocolo de DevTools ---------- */

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl), pending = new Map();
  let id = 0;
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  const send = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; pending.set(i, (d) => (d.error ? ko(new Error(`${method}: ${d.error.message}`)) : ok(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  // evalúa en la página y devuelve el valor; un error de la página se vuelve error acá
  const page = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  return { send, page, close: () => ws.close() };
}

/* ---------- ayudas dentro de la página ---------- */

// Se cargan en cada página nueva. El juego corre solo; `adelantar` además da pasos extra para no esperar en tiempo real.
const HELPERS = `
window.__t = {
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  visible: (id) => { const e = document.getElementById(id); return !!e && !e.hidden && !e.closest('[hidden]'); },
  deck: () => !document.body.classList.contains('sin-deck'),
  save: () => JSON.parse(localStorage.getItem('limargeddon.save') || '{}'),
  click: (id) => { const e = document.getElementById(id); if (!e || e.hidden) throw new Error('no se ve #' + id); e.click(); },
  clickText: (t) => { const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().toUpperCase() === t && !b.closest('[hidden]')); if (b) b.click(); return !!b; },
  stage: () => { const S = game.scene.getScene('Stage'); removeEventListener('blur', S.onBlur); S.G.hintsOn = false; return S; },
  adelantar: (n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) game.step(t0 + i * 16.7, 16.7); },
  enter: () => dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })),
};`;

/* ---------- recorridos ---------- */

const checks = [];
const ok = (cond, what) => { if (!cond) throw new Error(what); checks.push(what); };

async function fresh(p, save) {
  await p.send('Page.navigate', { url: `${ORIGIN}/` });
  await until(() => p.page('return typeof game !== "undefined"'), 15000, 'el juego carga');
  await p.page(`localStorage.clear(); ${save ? `localStorage.setItem('limargeddon.save', ${JSON.stringify(JSON.stringify(save))});` : ''} return true`);
  await p.send('Page.reload');
  await sleep(500);
  await until(() => p.page('return typeof game !== "undefined" && __t.scenes().includes("Menu")'), 15000, 'el menú aparece');
}
const scenes = (p) => p.page('return __t.scenes()');
const waitScene = (p, key, ms = 15000) => until(async () => (await scenes(p)).includes(key), ms, `la escena ${key}`);
// avanza el juego hasta que se cumpla la condición de la página
const run = (p, cond, ms, what) => until(() => p.page(`__t.adelantar(30); return ${cond}`), ms, what);

async function play(p) {
  await p.page('__t.click("playBtn"); return true');
  await waitScene(p, 'Stage');
  await run(p, 'game.scene.getScene("Stage").G.mode === "play"', 15000, 'la pelea empieza');
}

const SAVE = (o) => ({ v: 1, fights: [], settings: { playerName: 'PRUEBA', dataNotice: true, dk: 'normal', fireMode: 'toque', hints: false, ...o.settings }, progress: { unlocked: o.unlocked ?? 1 }, garage: { wallet: o.wallet ?? 0, levels: {} }, ...(o.credits ? { credits: true } : {}) });

const TOURS = {
  async 'primera partida: menú, pelea, resultados, taller y menú'(p) {
    await fresh(p);
    ok(!(await p.page('return __t.deck()')), 'el menú no muestra los controles táctiles');
    await until(() => p.page('return __t.clickText("LISTO")'), 5000, 'pide el nombre la primera vez');
    await sleep(300);
    await p.page('__t.clickText("ENTENDIDO"); return true');
    await play(p);
    ok(await p.page('return __t.deck()'), 'la pelea muestra los controles táctiles');
    await p.page('const S = __t.stage(); S.G.t = 50; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Results") && __t.visible("end")', 20000, 'los resultados de la victoria');
    ok(await p.page('const n = document.getElementById("next"); return __t.visible("next") && n.textContent === "Al taller" && n.className === "pick"'), 'la victoria lleva al taller como opción principal');
    const s1 = await p.page('return __t.save()');
    ok(s1.fights?.length === 1 && s1.fights[0].win && s1.fights[0].walletStart === 0, 'la pelea queda guardada con su billetera inicial');
    ok(s1.garage.wallet > 0 && s1.progress.unlocked === 2, 'cobra y desbloquea la etapa 2');
    await p.page('__t.click("next"); return true');
    await waitScene(p, 'Garage');
    ok(await p.page('return __t.visible("garage") && !__t.deck()'), 'la siguiente etapa pasa por el taller, sin controles táctiles');
    const before = s1.garage.wallet;
    await p.page('const b = document.querySelector("#gList .upg > button:first-of-type:not(:disabled)"); if (!b) throw new Error("no hay mejora que alcance"); b.click(); return true');
    const s2 = await p.page('return __t.save()');
    ok(s2.garage.wallet < before && Object.keys(s2.garage.levels).length === 1, 'comprar una mejora descuenta la billetera');
    await p.page('__t.click("gMenu"); return true');
    await waitScene(p, 'Menu');
    ok(await p.page('return __t.visible("menu") && __t.visible("playBtn") && !__t.deck()'), 'el taller vuelve al menú');
    ok(/2/.test(await p.page('return document.getElementById("playBtn").textContent')), 'el menú ofrece jugar la etapa 2');
  },

  async 'derrota, revancha y salir al menú desde la pausa'(p) {
    await fresh(p, SAVE({}));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 30; S.G.p.lives = 0; S.G.p.hp = 0; return true');
    await run(p, '__t.scenes().includes("Results") && __t.visible("end")', 20000, 'los resultados de la derrota');
    ok(await p.page('return document.getElementById("endTitle").textContent.startsWith("Te ganó")'), 'la derrota dice quién ganó');
    ok(await p.page('return document.getElementById("again").className === "pick" && document.getElementById("next").textContent === "Taller"'), 'tras perder, la revancha es lo principal y el taller queda como opción');
    ok((await p.page('return __t.save()')).progress.unlocked === 1, 'la derrota no desbloquea nada');
    await p.page('__t.click("again"); return true');
    await run(p, '!__t.scenes().includes("Results") && game.scene.getScene("Stage").G.mode === "play"', 15000, 'la revancha empieza otra pelea');
    ok(true, 'la revancha vuelve a la pelea');
    await p.page('const S = __t.stage(); S.setPaused(true); return true');
    ok(await p.page('return __t.visible("pause")'), 'la pausa se abre');
    await p.page('__t.click("quit"); return true');
    await waitScene(p, 'Menu');
    ok(await p.page('return __t.visible("menu") && !__t.deck()'), 'salir desde la pausa vuelve al menú sin controles táctiles');
  },

  async 'Línea Amarilla: aparecen los créditos y la primera vez no se saltan'(p) {
    await fresh(p, SAVE({ unlocked: 10, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos tras ganar la Línea Amarilla');
    ok(await p.page('return __t.deck()'), 'los créditos muestran los controles táctiles');
    await run(p, 'game.scene.getScene("Credits").t >= 1', 20000, 'los créditos corren');
    await p.page('__t.enter(); return true');
    await sleep(300);
    ok((await scenes(p)).includes('Credits'), 'la primera vez los créditos no se saltan');
  },

  async 'créditos ya vistos: se saltan y llevan a los resultados'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos');
    await run(p, 'game.scene.getScene("Credits").canSkipNow()', 20000, 'los créditos ya se pueden saltar');
    await run(p, '(__t.enter(), !__t.scenes().includes("Credits") && __t.visible("end"))', 20000, 'saltar los créditos lleva a los resultados');
    ok(true, 'saltar los créditos lleva a los resultados');
  },

  async '"Ver créditos" desde el menú vuelve al menú'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true }));
    ok(await p.page('return __t.visible("toCredits")'), 'el menú ofrece "Ver créditos" si ya se vieron');
    await p.page('__t.click("toCredits"); return true');
    await waitScene(p, 'Credits');
    await run(p, 'game.scene.getScene("Credits").canSkipNow()', 20000, 'los créditos ya se pueden saltar');
    await run(p, '(__t.enter(), __t.scenes().includes("Menu") && !__t.scenes().includes("Credits"))', 20000, 'los créditos vuelven al menú');
    ok(await p.page('return __t.visible("menu") && !__t.deck()'), 'al salir de los créditos el menú no muestra los controles');
  },
};

/* ---------- arranque ---------- */

async function main() {
  const chrome = CHROMES.find((c) => c && existsSync(c));
  if (!chrome) throw new Error('no encontré Chrome: indícalo con CHROME=/ruta');
  const profile = mkdtempSync(join(tmpdir(), 'limargeddon-escenas-'));
  const procs = [
    spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' }),
    spawn(chrome, ['--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', 'about:blank'], { stdio: 'ignore' }),
  ];
  let failed = 0;
  try {
    await until(async () => (await fetch(`${ORIGIN}/`)).ok, 20000, 'el servidor del juego');
    const target = await until(async () => (await (await fetch(`http://127.0.0.1:${DEBUG}/json/new?about:blank`, { method: 'PUT' })).json()), 20000, 'Chrome');
    const p = await connect(target.webSocketDebuggerUrl);
    await p.send('Page.enable'); await p.send('Runtime.enable'); await p.send('Network.enable');
    await p.send('Network.setBlockedURLs', { urls: ['*workers.dev*'] }); // los datos anónimos no salen de las pruebas
    // un teléfono en vertical y táctil (los controles dependen de pointer: coarse)
    await p.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: true });
    await p.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await p.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] });
    await p.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await p.send('Page.addScriptToEvaluateOnNewDocument', { source: HELPERS });
    for (const [name, tour] of Object.entries(TOURS)) {
      const n = checks.length, t0 = Date.now();
      try { await tour(p); console.log(`✓ ${name} (${checks.length - n} revisiones, ${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
      catch (e) { failed++; console.log(`✗ ${name}\n    ${e.message}`); }
    }
    p.close();
  } finally {
    for (const c of procs) c.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome todavía lo usa */ }
  }
  console.log(`\n${Object.keys(TOURS).length - failed} de ${Object.keys(TOURS).length} recorridos bien, ${checks.length} revisiones.`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
