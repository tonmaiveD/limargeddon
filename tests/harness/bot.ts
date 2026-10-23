// Bot de prueba: se pega al lado derecho del jefe (su punto ciego), dispara conos siempre,
// aceite y claxon cuando están listos, recoge bonus cercanos y esquiva embestidas y reversas.
// Lee el estado con la forma del prototipo (G.p, G.b, G.pickups), así sirve para ambos.
export interface BotKeys { left: boolean; right: boolean; up: boolean; down: boolean; cone: boolean; oil: boolean; horn: boolean }
interface Ent { x: number; y: number; w?: number; h?: number }
export interface BotView {
  p: Ent & { cd: Record<string, number> };
  b: Ent & { state: string };
  pickups: Ent[];
  traffic: (Ent & { k: string })[];
}

export function bot(G: BotView, k: BotKeys): void {
  const p = G.p, b = G.b;
  const danger = ['teleRam', 'ram', 'teleRev', 'rev', 'teleBrake', 'brake'].includes(b.state);
  let tx = Math.min(b.x + 48, 290), ty = danger ? 560 : 330;
  if (danger && Math.abs(p.x - b.x) < 60) tx = b.x < 180 ? b.x + 90 : b.x - 90; // salir de su carril
  const near = G.pickups.find((u) => Math.abs(u.x - p.x) < 90 && u.y > 200 && u.y < p.y);
  if (near && !danger) { tx = near.x; ty = Math.max(260, near.y); }
  // evitar serenazgo justo delante
  const sereno = G.traffic.find((c) => c.k === 'sereno' && Math.abs(c.x - p.x) < 40 && c.y < p.y && p.y - c.y < 120);
  if (sereno) tx = p.x + (p.x < 180 ? 60 : -60);
  k.left = tx < p.x - 6; k.right = tx > p.x + 6;
  k.up = ty < p.y - 10; k.down = ty > p.y + 10;
  k.cone = true;
  k.oil = Math.abs(p.x - b.x) < 30 && !danger;
  k.horn = Math.hypot(p.x - b.x, p.y - b.y) < 200;
}
