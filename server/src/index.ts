import { originOk, parseBatch } from './validate';

/*
 * Receptor de datos anónimos de partidas (ADR 0051), en Cloudflare Workers con una base D1.
 * - POST /v1/events: recibe un grupo de registros del juego y guarda los válidos. No lee ni guarda la IP.
 * - GET /v1/export?desde=AAAA-MM-DD: descarga los registros para el informe, solo con la clave EXPORT_TOKEN.
 * - Todos los días borra lo que tiene más de 12 meses.
 */

interface Env { DB: D1Database; EXPORT_TOKEN: string }

const cors = (origin: string) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
const today = () => new Date().toISOString().slice(0, 10);

async function receive(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('Origin');
  if (!originOk(origin)) return new Response('origen no permitido', { status: 403 });
  const rows = parseBatch(await req.text());
  if (!rows) return new Response('envío inválido', { status: 400, headers: cors(origin!) });
  if (rows.length) {
    const stmt = env.DB.prepare('INSERT OR IGNORE INTO events (id, v, kind, build, day, device, tester, stage, payload, received) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const day = today();
    await env.DB.batch(rows.map((r) => stmt.bind(r.id, r.v, r.kind, r.build, r.day, r.device, r.tester, r.stage, r.payload, day)));
  }
  return new Response(null, { status: 204, headers: cors(origin!) });
}

async function exportRows(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!env.EXPORT_TOKEN || auth !== `Bearer ${env.EXPORT_TOKEN}`) return new Response('no autorizado', { status: 401 });
  const since = new URL(req.url).searchParams.get('desde') ?? '2000-01-01';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) return new Response('fecha inválida', { status: 400 });
  const { results } = await env.DB.prepare('SELECT payload FROM events WHERE day >= ? ORDER BY day').bind(since).all<{ payload: string }>();
  return new Response('[' + results.map((r) => r.payload).join(',') + ']', { headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/v1/events') {
      if (req.method === 'OPTIONS') { const o = req.headers.get('Origin'); return originOk(o) ? new Response(null, { status: 204, headers: cors(o!) }) : new Response(null, { status: 403 }); }
      if (req.method === 'POST') return receive(req, env);
    }
    if (url.pathname === '/v1/export' && req.method === 'GET') return exportRows(req, env);
    return new Response('Limargeddon · datos anónimos de partidas', { status: 404 });
  },
  // retención de 12 meses
  async scheduled(_c: ScheduledController, env: Env): Promise<void> {
    const limit = new Date(Date.now() - 365 * 86400e3).toISOString().slice(0, 10);
    await env.DB.prepare('DELETE FROM events WHERE received < ?').bind(limit).run();
  },
};
