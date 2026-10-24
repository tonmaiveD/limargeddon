// Tipos del config.json de cada etapa. Una etapa nueva es un JSON con esta forma, no código nuevo.

export type DiffKey = 'facil' | 'normal' | 'dificil';
// Cómo se lanzan los conos. 'mantener': mantener el botón dispara a cadencia fija (prototipo v3).
// 'toque': cada toque lanza un cono, con una reserva que se recarga. 'acelerar': se disparan solos mientras se acelera.
export type FireMode = 'mantener' | 'toque' | 'acelerar';
export const FIRE_MODES: readonly FireMode[] = ['toque', 'acelerar'];

export type PowerKey = 'turbo' | 'cancha' | 'soat' | 'combi' | 'picaron' | 'metro';

// dmgMult: multiplica el daño que recibe el Tico en esa dificultad (1 si se omite)
export interface Difficulty { label: string; hp: number; spd: number; freq: number; tele: boolean; dmgMult?: number }

export interface PowerDef {
  name: string; label: string; col: string; L: string; dur: number;
  dmg?: number; vy?: number; phoneOff?: number; slip?: number; trafficSpin?: number;
}

// Aspecto declarativo de un vehículo: el motor lo dibuja sin código por tipo.
export interface VehicleLook {
  kind?: 'auto' | 'moto' | 'bici';   // auto por defecto
  roof?: string;                     // color del techo
  panel?: string;                    // franja ancha sobre el techo (fondo del rótulo del serenazgo)
  siren?: boolean;                   // circulina roja y azul intermitente
  label?: string; labelCol?: string; labelSize?: number; labelY?: number; // rótulo en el techo (labelY: fracción del alto)
  band?: string;                     // franja lateral (combis)
  box?: string;                      // caja o mochila de reparto (motos)
  shades?: boolean;                  // lentes oscuros de la conductora
}
// Movimiento propio, además de avanzar con la pista.
export interface VehicleMove { zigzag?: { amp: number; freq: number } }

export interface TrafficType {
  k: string; weight: number; w: number; h: number; vy: [number, number]; hp: number; cols: string[];
  invulnerable?: boolean; contactDmg: number; selfDmg?: number;
  // lo que paga sacarlo de la pista; si falta, vale traffic.killBonus (ciclistas y Delivery pagan 0)
  killBonus?: number;
  look?: VehicleLook; move?: VehicleMove;
}

// Enjambre: grupo de vehículos de un mismo tipo que llega junto, en formación, solo en ciertas dificultades.
export interface SwarmDef {
  type: string;                      // `k` de un tipo de traffic.types
  diffs: DiffKey[];
  first: number; every: [number, number];
  count: [number, number];
  formation: 'columna' | 'v' | 'diagonal';
  gap: number;                       // separación entre vehículos, en px
  label?: string;                    // aviso en pantalla al llegar
}

// Obstáculo fijo sobre la pista (avanza con el asfalto). 'bloque' es sólido y empuja; 'hueco' se cruza y castiga.
export interface ObstacleDef {
  k: string;
  kind: 'bloque' | 'hueco';
  style: 'conos' | 'barrera' | 'caja' | 'crater' | 'peatones' | 'scooter';
  diffs?: DiffKey[];                 // todas si se omite
  first: number; every: [number, number];
  lanes: number;                     // carriles que ocupa
  h: number;                         // alto en px
  w?: number;                        // ancho en px, si es menor que los carriles que ocupa (se centra en ellos)
  col: string; col2?: string;        // colores principal y de franjas
  label?: string; labelCol?: string;
  dmg: number;                       // daño al chocar (bloque) o al caer (hueco)
  fine?: number;                     // papeleta al chocarlo
  drift?: { amp: number; freq: number }; // vaivén lateral (por ejemplo, una marcha que se corre de carril)
}

export type BossAttack = 'brake' | 'reverse' | 'ram' | 'jet';

// Chorro: el jefe apunta al carril del Tico y suelta un chorro hacia abajo que empuja de lado (Rochabús).
export interface BossJet { tele: number; dur: number; w: number; push: number; dmg: number }

// Invocación: el jefe trae vehículos de un tipo de traffic.types, desde un costado (como el valet) o desde arriba.
export interface BossSummon { type: string; every: number; from: 'lado' | 'arriba'; count?: number; say?: string }

export interface BossPhase {
  id: number; from: number; name: string; col: string; bar: string; returnAct: number;
  swapChance: number; swapAct: number;
  // `attack` es el ataque único (como en el prototipo); `attacks` permite combinar varios con peso
  attack: BossAttack; attacks?: { k: BossAttack; weight: number }[];
  tele: number; teleOff?: number; dur: number; speed: number;
  park?: number; maxY?: number;
  valetEvery?: number;
  hornFirst?: number; hornEvery?: number; hornRadius?: number; stun?: number;
  hornSound?: 'bossHorn' | 'whistle'; hornCol?: string; hornText?: string;
  escorts?: { life: number; hp: number; cols: string[]; contactDmg?: number; look?: VehicleLook; w?: number; h?: number };
  summon?: BossSummon;
  jet?: BossJet;
}

export interface BossConfig {
  id: string; name: string; title: string; w: number; h: number; startY: number; baseY: number; lane: number;
  firstAction: number; cruiseSpeed: number; weakSideMult: number; slipMult: number;
  laneSwapAimChance: number; phoneOffAct: number; contactDmg: number; chargeContactDmg: number;
  phases: BossPhase[];
  lines: Record<string, string[]>;
  quips: Record<'horn' | 'oil' | 'combi' | 'metro' | 'valet', string>;
}

export interface StageConfig {
  id: string; number: number; district: string; roadName: string; eyebrow: string; tip: string;
  // ayudas breves sobre el Tico en los primeros segundos (at = segundo de la pelea en que aparece)
  hints?: { at: number; text: string }[];
  difficulties: Record<DiffKey, Difficulty>;
  road: { left: number; right: number; lanes: number; laneWidth: number; speed: number; turboSpeed: number; idleScroll: number };
  player: {
    lane: number; y: number; w: number; h: number; hp: number;
    accelX: number; accelY: number; response: number; minY: number; bottomMargin: number; turboMult: number;
    // 'libre': cuatro direcciones con freno (prototipo v3). 'acelerador': se sube manteniendo el acelerador y al soltar vuelve a la línea de crucero.
    throttle: 'libre' | 'acelerador'; cruiseReturn: number;
    bossPush: number; bossHitCd: number; trafficPush: number; trafficHitCd: number;
    // mejoras del taller (ADR 0018): armadura (fracción de daño evitado), vida por segundo, vidas extra y piezas visibles
    armor?: number; regen?: number; lives?: number; look?: { bumper?: boolean; plates?: boolean };
    // mejoras de lujo: sin papeletas y con paso libre ante uniformados; combi aliada cada allyEvery s con allyDmg de daño
    privilege?: boolean; allyEvery?: number; allyDmg?: number;
  };
  weapons: {
    cone: {
      cd: number; vy: number; r: number; dmg: number; trafficDmg: number;
      mode?: FireMode; ammo?: number; reload?: number; tapGap?: number;
      // combo de punto ciego: cada cono seguido que pega por la derecha suma `step` al multiplicador, hasta `maxSteps`
      combo?: { step: number; maxSteps: number; hitstop: number };
    };
    oil: { cd: number; vy: number; r: number; dmg: number; slip: number; trafficSpin: number };
    horn: { cd: number; ring: number; reach: number; dmg: number; phoneOff: number; trafficRadius: number; trafficPush: number };
    cancha: { cd: number; vy: number; spread: number; jitter: number; r: number; dmg: number; trafficDmg: number };
    picaron: { vy: number; vx: number[]; ay: number; r: number; dmg: number; life: number };
    ram: { dmg: number };
  };
  powers: Record<PowerKey, PowerDef>;
  pickups: { first: number; every: [number, number]; fall: number; rare: PowerKey[]; rareReroll: number; rerollTo: PowerKey[] };
  // yieldToBoss: el tráfico se aparta del jefe en vez de pasarle por debajo (el prototipo no lo hacía)
  traffic: { first: number; every: [number, number]; lastPhaseMult: number; yieldToBoss: boolean; killBonus: number; types: TrafficType[] };
  swarms?: SwarmDef[];
  obstacles?: ObstacleDef[];
  fines: { amount: number; contact: string; shot: string };
  bumps: { first: number; every: [number, number]; dmg: number };
  crossings: { first: number; every: [number, number] };
  streets: string[];
  // item: premio que se muestra al ganar; defeatTip: consejo al perder
  rewards: { win: number; clean: number; blindPct: number; item?: string; defeatTip?: string };
  boss: BossConfig;
}
