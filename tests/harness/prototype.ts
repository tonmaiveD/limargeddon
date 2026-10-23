import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/*
 * Carga prototipo/san-isidro-v3.html en Node sin modificar el archivo: extrae el <script>, le agrega en memoria
 * una línea final que expone start/update/G/keys, y lo ejecuta con stubs mínimos de DOM y canvas.
 */
export interface ProtoHandle { start(dk: string): void; update(dt: number): void; readonly G: any; keys: Record<string, boolean> }

const noop = () => {};
const ctxStub: any = new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 10 }) : noop), set: () => true });
function el(): any {
  return { style: { setProperty: noop }, hidden: false, textContent: '', innerHTML: '', dataset: {}, classList: { add: noop, remove: noop },
    addEventListener: noop, setAttribute: noop, focus: noop, getContext: () => ctxStub, offsetHeight: 0, clientWidth: 360, clientHeight: 640 };
}

export function loadPrototype(): ProtoHandle {
  const path = fileURLToPath(new URL('../../prototipo/san-isidro-v3.html', import.meta.url));
  const html = readFileSync(path, 'utf8');
  let src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const tail = src.lastIndexOf('})();');
  src = src.slice(0, tail) + 'globalThis.__proto={start,update,keys,get G(){return G}};\n' + src.slice(tail);
  const g = globalThis as any;
  g.document = { getElementById: el, querySelectorAll: () => [], fonts: undefined };
  g.addEventListener = noop; g.matchMedia = () => ({ matches: false }); g.requestAnimationFrame = noop;
  g.getComputedStyle = () => ({ display: 'none' });
  // los stubs quedan instalados: el prototipo los usa en callbacks diferidos (fuentes, overlay final)
  new Function(src)();
  const h = g.__proto; delete g.__proto;
  return h;
}
