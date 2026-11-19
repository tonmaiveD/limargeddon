/*
 * Pruebas de escenas (deuda técnica, paso 4 del plan del 10 de noviembre): recorre el juego en un Chrome
 * sin ventana, como un teléfono en vertical, y revisa que cada escena lleve a la siguiente. Las pruebas de `tests/` cubren
 * la lógica pura. Esto cubre las uniones que antes se revisaban a mano:
 * - Menú, pelea, resultados, taller y menú otra vez, con la billetera y el avance guardados.
 * - Derrota y revancha, y salir al menú desde la pausa.
 * - Línea Amarilla, créditos y resultados: la primera vez no se saltan, después sí, y "Ver créditos" vuelve al menú.
 * - Créditos recargados a medias, un error en un cuadro de los créditos y el audio que vuelve solo (ADR 0058).
 * - Pausa en los créditos con toques reales, "Continuar" sin saltar y "Ver después" a los resultados (ADR 0059).
 * - Los créditos completos, con el reloj acelerado, todas las mejoras y el audio cortado a mitad del desfile, y el
 *   registro anónimo de cómo terminaron (ADR 0060).
 * - Los controles táctiles solo en la pelea y los créditos (ADR 0054).
 * - El aviso de reversa en San Isidro suena y vibra, y sin sonido no vibra (ADR 0061).
 * - Un guardado viejo en "acelerar es atacar" juega por toque y conserva su récord y medallas (ADR 0062).
 * - Menú con Taller, Ranking y Ajustes, la hoja de ajustes, "Jugar" a la vista y el taller que dice cuánto falta (ADR 0063).
 * - La Costa Verde de noche oscurece la pista, deja al jefe y al Tico encima y sobrevive a la revancha (ADR 0065).
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
// Guarda el AudioContext del juego en window.__ac, para cortarlo en las pruebas.
const HELPERS = `
{ const A = window.AudioContext; if (A) window.AudioContext = class extends A { constructor(...a) { super(...a); window.__ac = this; } }; }
window.__errors = [];
{ const e = console.error.bind(console); console.error = (...a) => { __errors.push(a.map(String).join(' ')); e(...a); }; }
addEventListener('error', (ev) => __errors.push(String(ev.message)));
window.__t = {
  // registros de créditos anotados para enviar (el receptor está bloqueado, así que quedan en la cola)
  creditos: () => JSON.parse(localStorage.getItem('limargeddon.datos') || '[]').filter((e) => e.kind === 'creditos'),
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  visible: (id) => { const e = document.getElementById(id); return !!e && !e.hidden && !e.closest('[hidden]'); },
  deck: () => !document.body.classList.contains('sin-deck'),
  save: () => JSON.parse(localStorage.getItem('limargeddon.save') || '{}'),
  click: (id) => { const e = document.getElementById(id); if (!e || e.hidden) throw new Error('no se ve #' + id); e.click(); },
  clickText: (t) => { const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().toUpperCase() === t && !b.closest('[hidden]')); if (b) b.click(); return !!b; },
  stage: () => { const S = game.scene.getScene('Stage'); removeEventListener('blur', S.onBlur); S.G.hintsOn = false; return S; },
  adelantar: (n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) game.step(t0 + i * 16.7, 16.7); },
  enter: () => dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })),
  key: (key) => dispatchEvent(new KeyboardEvent('keydown', { key })),
  t: () => game.scene.getScene('Credits').t,
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

// un toque real con el dedo en el centro del elemento, como en el teléfono: pasa por pointerdown, pointerup y click
async function tap(p, id) {
  const [x, y] = await p.page(`const e = document.getElementById(${JSON.stringify(id)}); if (!e || e.closest('[hidden]')) throw new Error('no se ve #${id}');
    const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]`);
  await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await sleep(60);
  await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(150 * SLOW);
}
// la imagen de los créditos: ¿avanza en tiempo real?
const creditsMove = async (p) => { const a = await p.page('return __t.t()'); await sleep(400 * SLOW); return (await p.page('return __t.t()')) > a; };

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

  async 'aviso de reversa en San Isidro: alarma propia y vibración, que se apaga con el sonido'(p) {
    await fresh(p, SAVE({ unlocked: 2 }));
    await play(p);
    // anota los sonidos y las vibraciones
    await p.page(`const { Sfx } = await import('/src/core/audio/sfx.ts'); window.__snd = []; const play = Sfx.play.bind(Sfx);
      Sfx.play = (n, l) => { __snd.push(n); return play(n, l); }; window.__vib = []; navigator.vibrate = (ms) => (__vib.push(ms), true); return true`);
    // fase 2 (reversa) sin tráfico, y el próximo ataque ya
    const reverse = async () => {
      await p.page('const S = __t.stage(), G = S.G; G.traffic.length = 0; G.p.pw.soat = 999; G.b.hp = G.b.max * 0.5; __snd.length = 0; __vib.length = 0; return true');
      await run(p, '(() => { const b = __t.stage().G.b; if (b.state === "cruise") b.act = 0; return b.state === "teleRev" || b.state === "rev"; })()', 20000, 'el aviso de reversa');
    };
    await reverse();
    ok(await p.page('return __snd.includes("alarm") && !__snd.includes("bossHorn")'), 'el aviso de reversa tiene su propio sonido, distinto del claxon');
    ok(await p.page('return __vib.length === 1 && __vib[0] > 0 && __vib[0] <= 200'), 'el aviso de reversa vibra una vez, corto');
    await p.page(`const { Sfx } = await import('/src/core/audio/sfx.ts'); if (Sfx.on) Sfx.toggle(); __t.stage().G.b.state = 'return'; return true`);
    await run(p, '__t.stage().G.b.state === "cruise"', 20000, 'el jefe vuelve a su lugar');
    await reverse();
    ok(await p.page('return __vib.length === 0'), 'con el sonido apagado no vibra');
    await p.page(`const { Sfx } = await import('/src/core/audio/sfx.ts'); if (!Sfx.on) Sfx.toggle(); return true`);
  },

  async 'un guardado viejo en "acelerar es atacar" juega por toque y conserva récord y medallas'(p) {
    const old = SAVE({ unlocked: 2, settings: { fireMode: 'acelerar' } });
    old.scores = { PRUEBA: { miraflores: 9100 } };
    old.scoreCtx = { PRUEBA: { miraflores: { points: 9100, v: 2, mode: 'acelerar', dk: 'normal', upgrades: {}, parts: {} } } };
    old.medals = { PRUEBA: { miraflores: ['ciego'] } };
    await fresh(p, old);
    ok(await p.page('return !document.getElementById("fireSel") && !document.getElementById("fireTip")'), 'el menú ya no tiene selector de disparo');
    ok(await p.page('return document.getElementById("playInfo").textContent === "Normal"'), 'bajo "Jugar" solo va la dificultad');
    await p.page('__t.click("toRanking"); return true');
    ok(await p.page('return __t.visible("rankDlg") && document.getElementById("rankList").textContent.includes("PRUEBA")'), 'el récord hecho acelerando sigue en el ranking');
    await p.page('__t.click("rankClose"); return true');
    await play(p);
    ok(await p.page('return __t.stage().G.fireMode === "toque"'), 'la pelea es por toque');
    ok(await p.page('const b = document.getElementById("w-cone"); return getComputedStyle(b).display !== "none" && b.getBoundingClientRect().width > 40'), 'el deck tiene el botón de conos');
    // acelerar ya no dispara
    const shots = await p.page('const S = __t.stage(), G = S.G; G.traffic.length = 0; G.keys.up = true; __t.adelantar(60); G.keys.up = false; return G.shots.filter((s) => s.k === "cone").length');
    ok(shots === 0, `acelerar no lanza conos (${shots})`);
    ok(await p.page('const s = __t.save(); return s.scores.PRUEBA.miraflores === 9100 && s.medals.PRUEBA.miraflores.includes("ciego")'), 'el récord y las medallas se conservan');
  },

  async 'menú con hoja de ajustes, "Jugar" a la vista y taller que dice cuánto falta'(p) {
    await fresh(p, { ...SAVE({ unlocked: 9, wallet: 450 }), creditsOpened: true });
    const box = (id) => p.page(`const r = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom, right: r.right }`);
    // "Jugar" sin desplazar, y la tarjeta tapa lo que se desplaza: en sus bordes y esquinas solo está la tarjeta
    const play = await box('playBtn');
    ok(play.y >= 0 && play.bottom <= 852, '"Jugar" se ve sin desplazar');
    await p.page('const m = document.getElementById("menu"); m.scrollTop = m.scrollHeight / 2; return true');
    const covered = await p.page(`const card = document.querySelector('.menu-play'), r = card.getBoundingClientRect();
      const m = document.getElementById('menu').getBoundingClientRect(), mid = r.top + r.height / 2;
      return [[r.left + 2, r.top + 24], [r.right - 2, r.top + 24], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2], [r.left + r.width / 2, r.bottom - 2], [m.left + 3, mid], [m.right - 3, mid], [m.left + m.width / 2, m.bottom - 3]]
        .every(([x, y]) => card.contains(document.elementFromPoint(x, y)))`);
    ok(covered, 'nada del menú se ve debajo ni alrededor de la tarjeta de "Jugar"');
    const bg = await p.page(`return getComputedStyle(document.querySelector('.menu-play')).backgroundImage`);
    ok(/rgb\(14, 10, 22\)\)?/.test(bg), 'la tarjeta es opaca abajo');
    await p.page('document.getElementById("menu").scrollTop = 0; return true');
    // Taller, Ranking y Ajustes como botones; lo demás no está en el menú
    for (const id of ['toGarage', 'toRanking', 'toSettings']) { const b = await box(id); ok(b.w >= 44 && b.h >= 44, `${id} es un botón de 44 px o más (${Math.round(b.w)}×${Math.round(b.h)})`); }
    ok(await p.page('return ["toName", "toReset", "toShare", "toHintsOnOff", "toCredits"].every((id) => !__t.visible(id))'), 'jugador, datos, ayudas, créditos y reinicio no están en el menú');
    // la hoja de ajustes, con "Empezar de nuevo" al fondo
    await p.page('__t.click("toSettings"); return true');
    ok(await p.page('return __t.visible("settingsDlg") && ["toName", "toShare", "toHintsOnOff", "toCredits", "toReset"].every((id) => __t.visible(id))'), 'la hoja de ajustes tiene jugador, datos, ayudas, créditos y reinicio');
    ok(await p.page(`const items = [...document.querySelectorAll('#settingsDlg button, #settingsDlg a')].filter((e) => !e.closest('[hidden]'));
      return items.at(-1).id === 'toReset' && items.every((e) => e.getBoundingClientRect().height >= 44)`), '"Empezar de nuevo" va al fondo y todo mide 44 px o más');
    ok(await p.page('return [...document.querySelectorAll("#settingsDlg a")].map((a) => a.getAttribute("href")).join() === "privacidad.html,acerca.html"'), 'privacidad y acerca están en los ajustes');
    // el diálogo del jugador se abre encima de la hoja
    await p.page('__t.click("toName"); return true');
    ok(await p.page(`const r = document.getElementById('nameDlg').getBoundingClientRect(); return document.getElementById('nameDlg').contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))`), 'el diálogo del jugador queda encima de los ajustes');
    await p.page('__t.click("nameCancel"); __t.click("settingsClose"); return true');
    ok(await p.page('return !__t.visible("settingsDlg") && __t.visible("menu")'), '"Volver" cierra los ajustes');
    // el taller: las cinco categorías entran y la mejora que no alcanza dice cuánto falta
    await p.page('__t.click("toGarage"); return true');
    await waitScene(p, 'Garage');
    ok(await p.page('const c = document.getElementById("gCats"); return c.children.length === 5 && c.scrollWidth <= c.clientWidth + 1'), 'las cinco categorías del taller entran en el ancho');
    ok(await p.page(`for (const b of document.querySelectorAll('#gCats .seg')) { b.click(); if ([...document.querySelectorAll('#gList .upg')].some((c) => c.textContent.includes('Te faltan S/ '))) return true; } return false`), 'una mejora que no alcanza dice cuánto falta');
    ok(await p.page('return !document.getElementById("garage").textContent.includes("modo de disparo") && !document.getElementById("garage").textContent.includes("Acelerando")'), 'el taller ya no habla del modo de disparo');
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
    // la pausa y "Ver después" están también la primera vez, y salir no los da por vistos (ADR 0059)
    await tap(p, 'pauseBtn');
    ok(await p.page('return __t.visible("pause") && __t.scenes().includes("Credits")'), 'la primera vez los créditos también se pausan');
    await tap(p, 'quit');
    await until(() => p.page('return !__t.scenes().includes("Credits") && __t.visible("end")'), 10000, 'los resultados tras "Ver después"');
    ok(await p.page('return __t.save().credits !== true && __t.save().creditsOpened === true'), '"Ver después" la primera vez no los da por vistos');
    const [c] = await p.page('return __t.creditos()');
    ok(c && c.from === 'victoria' && c.first === true && c.end === 'despues' && c.reached >= 1 && c.skips === 0, 'el registro anónimo dice que salieron con "Ver después" la primera vez');
    ok(await p.page('return localStorage.getItem("limargeddon.creditos") === null'), 'al salir no queda borrador de créditos');
  },

  async 'pausa en los créditos: continuar sin saltar y "Ver después" a los resultados'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos');
    // ya vistos, así un toque que contara como salto se notaría
    await run(p, 'game.scene.getScene("Credits").canSkipNow()', 20000, 'los créditos ya se pueden saltar');
    const box = await p.page(`const b = document.getElementById('pauseBtn').getBoundingClientRect(), c = game.canvas.getBoundingClientRect(), k = c.height / 640;
      return { w: b.width, h: b.height, top: (b.top - c.top) / k }`);
    ok(box.w >= 44 && box.h >= 44, `el botón de pausa mide 44 px o más (${box.w}×${box.h})`);
    ok(box.top > 140, 'el botón de pausa queda lejos de la ficha de reparto, arriba');
    // saltar lleva al poscrédito: si el tiempo sigue antes, no hubo salto. Con margen de tiempo no sirve, porque en una
    // máquina lenta la imagen puede adelantarse unos segundos para alcanzar a la música
    const POST = await p.page(`const { POST_START } = await import('/src/core/credits.ts'); return POST_START`);
    ok(await p.page(`return __t.t() < ${POST} - 20`), 'los créditos van lejos del poscrédito');
    await tap(p, 'pauseBtn');
    ok(await p.page(`return __t.visible("pause") && __t.scenes().includes("Credits") && __t.t() < ${POST}`), 'el botón pausa los créditos sin saltarlos');
    ok(!(await creditsMove(p)), 'en pausa la imagen no avanza');
    ok(await p.page('return document.getElementById("quit").textContent === "Ver después"'), 'el panel ofrece "Ver después"');
    const t0 = await p.page('return __t.t()');
    await tap(p, 'resume');
    ok(await p.page(`return !__t.visible("pause") && __t.scenes().includes("Credits") && __t.t() < ${POST}`), '"Continuar" sigue sin saltar');
    ok(await creditsMove(p), 'al continuar la imagen avanza');
    const t1 = await p.page('return __t.t()');
    ok(t1 >= t0 && t1 - t0 < 8, `al continuar sigue desde el mismo punto (de ${t0.toFixed(1)} a ${t1.toFixed(1)} s)`);
    await p.page('__t.key("p"); return true');
    ok(await p.page('return __t.visible("pause")'), 'P pausa los créditos');
    await p.page('__t.key("Escape"); return true');
    ok(await p.page('return !__t.visible("pause")'), 'Escape los sigue');
    await tap(p, 'pauseBtn');
    await tap(p, 'quit');
    await until(() => p.page('return !__t.scenes().includes("Credits") && __t.visible("end")'), 10000, 'los resultados tras "Ver después"');
    ok(await p.page('return !__t.visible("pauseBtn") && document.getElementById("quit").textContent === "Salir al menú"'), '"Ver después" lleva a los resultados y deja la pausa de la pelea como estaba');
  },

  async 'créditos ya vistos: se saltan y llevan a los resultados'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos');
    await run(p, 'game.scene.getScene("Credits").canSkipNow()', 20000, 'los créditos ya se pueden saltar');
    await run(p, '(__t.enter(), !__t.scenes().includes("Credits") && __t.visible("end"))', 20000, 'saltar los créditos lleva a los resultados');
    ok(true, 'saltar los créditos lleva a los resultados');
    const sk = (await p.page('return __t.creditos()')).at(-1);
    ok(sk && sk.end === 'saltado' && sk.skips === 2 && sk.first === false, 'el registro anónimo cuenta los dos saltos');
  },

  async 'créditos empezados y recargados: el menú ofrece "Ver créditos" y siguen sin saltarse'(p) {
    await fresh(p, SAVE({ unlocked: 10, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos');
    await run(p, 'game.scene.getScene("Credits").t >= 10', 30000, 'diez segundos de créditos');
    await p.send('Page.reload');
    await sleep(500);
    await until(() => p.page('return typeof game !== "undefined" && __t.scenes().includes("Menu")'), 15000, 'el menú tras recargar');
    ok(await p.page('__t.click("toSettings"); return __t.visible("toCredits")'), 'tras recargar a los 10 s, los ajustes ofrecen "Ver créditos"');
    const [gone] = await p.page('return __t.creditos()');
    ok(gone && gone.end === 'salida' && gone.from === 'victoria' && gone.reached >= 7, `los créditos recargados a mitad llegan como "salida" al abrir otra vez (hasta ${gone?.reached} s)`);
    await p.page('__t.click("toCredits"); return true');
    await waitScene(p, 'Credits');
    await run(p, 'game.scene.getScene("Credits").t >= 1', 20000, 'los créditos corren');
    await p.page('__t.enter(); return true');
    await sleep(300);
    ok((await scenes(p)).includes('Credits'), 'sin haberlos visto completos, siguen sin poder saltarse');
  },

  async 'un error en el dibujo de los créditos lleva a los resultados'(p) {
    await fresh(p, SAVE({ unlocked: 10, settings: { stageId: 'linea-amarilla' } }));
    await play(p);
    await p.page('const S = __t.stage(); S.G.t = 80; S.G.b.hp = 0; return true');
    await run(p, '__t.scenes().includes("Credits")', 60000, 'los créditos');
    await p.page('const C = game.scene.getScene("Credits"); const boom = () => { throw new Error("prueba de la red de seguridad") }; C.drawTakeoff = C.drawDistrict = C.drawClosing = C.drawPost = boom; return true');
    await run(p, '!__t.scenes().includes("Credits") && __t.visible("end")', 20000, 'los resultados tras el error');
    ok(true, 'un error en un cuadro de los créditos termina la escena y muestra los resultados');
    ok((await p.page('return __t.creditos()')).some((c) => c.end === 'error'), 'el registro anónimo anota el error');
  },

  async 'créditos completos: reloj acelerado, mejoras al máximo y audio cortado a mitad del desfile'(p) {
    // empezados pero no vistos, así no se pueden saltar y tienen que recorrerse enteros
    await fresh(p, { ...SAVE({ unlocked: 10 }), creditsOpened: true });
    await p.page(`const { UPGRADES } = await import('/src/garage/upgrades.ts'), s = __t.save();
      s.garage.levels = Object.fromEntries(UPGRADES.map((u) => [u.id, u.levels.length])); localStorage.setItem('limargeddon.save', JSON.stringify(s)); return true`);
    await p.page('__t.click("toCredits"); return true');
    await waitScene(p, 'Credits');
    // anota los títulos que se dibujan, para saber si llegó a "CONTINUARÁ"
    await p.page(`const C = game.scene.getScene('Credits'), T = C.title.bind(C); window.__titles = new Set();
      C.title = (g, text, ...r) => { __titles.add(text); return T(g, text, ...r); }; return true`);
    const end = await p.page(`const { TEXT } = await import('/src/core/credits.ts'); return TEXT.post.end`);
    // el desfile a toda velocidad; en el segundo 30 se corta el audio y vuelve diez segundos de juego después
    await run(p, '__t.t() >= 30', 60000, 'el desfile hasta el segundo 30');
    // el corte de la auditoría (C01): el audio se suspende y además su reloj queda quieto, como si figurara activo
    await p.page(`await __ac.suspend(); const { Sfx } = await import('/src/core/audio/sfx.ts'); window.__mt = Sfx.medleyTime;
      const v = Sfx.medleyTime() ?? __t.t(); Sfx.medleyTime = () => v; return true`);
    const moved = await p.page('const a = __t.t(); __t.adelantar(300); return __t.t() - a');
    ok(moved >= 3, `con el audio cortado la imagen sigue avanzando (${moved.toFixed(1)} s en 5 s de juego)`);
    await p.page(`const { Sfx } = await import('/src/core/audio/sfx.ts'); Sfx.medleyTime = __mt; await __ac.resume(); return true`);
    await run(p, '!__t.scenes().includes("Credits")', 120000, 'el final de los créditos');
    ok(await p.page(`return __titles.has(${JSON.stringify(end)}) && __t.visible("menu")`), `los créditos llegan hasta "${end}" y vuelven al menú`);
    ok(await p.page('return __t.save().credits === true'), 'al terminarlos quedan vistos');
    const errs = await p.page('return __errors');
    ok(!errs.length, `sin errores en la consola${errs.length ? ` (${errs[0]})` : ''}`);
    const c = (await p.page('return __t.creditos()')).at(-1);
    ok(c && c.end === 'completo' && c.from === 'menu' && c.first === true && c.reached >= 80, 'el registro anónimo dice que se vieron completos desde el menú');
    ok(c.maxStall < 1, `el registro no muestra la imagen quieta (mayor rato ${c.maxStall} s)`);
  },

  async 'el audio cortado se reanuda solo al volver a la página'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true }));
    await p.page('__t.click("toCredits"); return true');
    await waitScene(p, 'Credits');
    await until(() => p.page('return window.__ac?.state === "running"'), 10000, 'el audio suena');
    await p.page('await __ac.suspend(); dispatchEvent(new PageTransitionEvent("pageshow")); return true');
    await until(() => p.page('return __ac.state === "running"'), 5000, 'el audio se reanuda al volver');
    ok(true, 'al volver a la página, el audio suspendido se reanuda sin tocar nada');
  },

  async '"Ver créditos" desde el menú vuelve al menú'(p) {
    await fresh(p, SAVE({ unlocked: 10, credits: true }));
    ok(await p.page('__t.click("toSettings"); return __t.visible("toCredits")'), 'los ajustes ofrecen "Ver créditos" si ya se vieron');
    await p.page('__t.click("toCredits"); return true');
    await waitScene(p, 'Credits');
    await run(p, 'game.scene.getScene("Credits").canSkipNow()', 20000, 'los créditos ya se pueden saltar');
    await run(p, '(__t.enter(), __t.scenes().includes("Menu") && !__t.scenes().includes("Credits"))', 20000, 'los créditos vuelven al menú');
    ok(await p.page('return __t.visible("menu") && !__t.deck()'), 'al salir de los créditos el menú no muestra los controles');
  },

  async 'Costa Verde de noche: oscurece la pista, deja al jefe encima y sobrevive a la revancha'(p) {
    await fresh(p, SAVE({ unlocked: 10 }));
    await p.page('document.querySelector(\'#stageSel [data-stage="costa-verde"]\').click(); return true');
    await play(p);
    // brillo medio de un cuadro, con la noche a la vista o escondida
    const bright = (show) => p.page(`const S = __t.stage(), N = S.night; N.img.setVisible(${show}); N.heads.g.setVisible(${show}); __t.adelantar(1);
      const img = await new Promise((ok) => game.renderer.snapshot(ok)); const c = document.createElement('canvas'); c.width = 90; c.height = 160;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 90, 160); const d = x.getImageData(0, 0, 90, 140).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3`);
    await p.page('const G = __t.stage().G; G.p.pw.soat = 999; G.traffic.length = 0; return true');
    ok(await p.page(`const S = __t.stage(), N = S.night, L = S.L; return !!N && N.img.visible && N.img.depth > L.carsFx.g.depth && N.img.depth < L.ents.g.depth && N.img.depth < L.bossFx.g.depth && N.img.depth < L.me.g.depth`),
      'la noche va sobre el tráfico y debajo del jefe, sus avisos y el Tico');
    const day = await bright(false), night = await bright(true);
    ok(night < day * 0.8, `la noche oscurece el cuadro (${day.toFixed(0)} de día, ${night.toFixed(0)} de noche)`);
    await p.page('__t.stage().scene.restart(); return true');
    await run(p, '(() => { const S = game.scene.getScene("Stage"); return S.G?.mode === "play" && !!S.night && S.night.img.visible; })()', 15000, 'la revancha empieza de noche');
    await p.page('__t.adelantar(120); return true');
    ok(await p.page('return __errors.length === 0'), 'la noche no deja errores, tampoco al repetir la pelea');
    await fresh(p, SAVE({ unlocked: 10 }));
    await p.page('document.querySelector(\'#stageSel [data-stage="san-isidro"]\').click(); return true');
    await play(p);
    ok(await p.page('return __t.stage().night === null'), 'las etapas de día no tienen noche');
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
