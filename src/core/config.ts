// Tipos del config.json de cada etapa. Una etapa nueva es un JSON con esta forma, no código nuevo.

export type DiffKey = 'facil' | 'normal' | 'dificil';
export type PowerKey = 'turbo' | 'cancha' | 'soat' | 'combi' | 'picaron' | 'metro';

export interface Difficulty { label: string; hp: number; spd: number; freq: number; tele: boolean }

export interface PowerDef {
  name: string; label: string; col: string; L: string; dur: number;
  dmg?: number; vy?: number; phoneOff?: number; slip?: number; trafficSpin?: number;
}

export interface TrafficType {
  k: string; weight: number; w: number; h: number; vy: [number, number]; hp: number; cols: string[];
  invulnerable?: boolean; contactDmg: number; selfDmg?: number;
}

export interface BossPhase {
  id: number; from: number; name: string; col: string; bar: string; returnAct: number;
  swapChance: number; swapAct: number;
  attack: 'brake' | 'reverse' | 'ram'; tele: number; teleOff?: number; dur: number; speed: number;
  park?: number; maxY?: number;
  valetEvery?: number;
  hornFirst?: number; hornEvery?: number; hornRadius?: number; stun?: number;
  escorts?: { life: number; hp: number; cols: string[] };
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
  difficulties: Record<DiffKey, Difficulty>;
  road: { left: number; right: number; lanes: number; laneWidth: number; speed: number; turboSpeed: number; idleScroll: number };
  player: {
    lane: number; y: number; w: number; h: number; hp: number;
    accelX: number; accelY: number; response: number; minY: number; bottomMargin: number; turboMult: number;
    bossPush: number; bossHitCd: number; trafficPush: number; trafficHitCd: number;
  };
  weapons: {
    cone: { cd: number; vy: number; r: number; dmg: number; trafficDmg: number };
    oil: { cd: number; vy: number; r: number; dmg: number; slip: number; trafficSpin: number };
    horn: { cd: number; ring: number; reach: number; dmg: number; phoneOff: number; trafficRadius: number; trafficPush: number };
    cancha: { cd: number; vy: number; spread: number; jitter: number; r: number; dmg: number; trafficDmg: number };
    picaron: { vy: number; vx: number[]; ay: number; r: number; dmg: number; life: number };
    ram: { dmg: number };
  };
  powers: Record<PowerKey, PowerDef>;
  pickups: { first: number; every: [number, number]; fall: number; rare: PowerKey[]; rareReroll: number; rerollTo: PowerKey[] };
  traffic: { first: number; every: [number, number]; lastPhaseMult: number; killBonus: number; types: TrafficType[] };
  fines: { amount: number; contact: string; shot: string };
  bumps: { first: number; every: [number, number]; dmg: number };
  crossings: { first: number; every: [number, number] };
  streets: string[];
  rewards: { win: number; clean: number; blindPct: number };
  boss: BossConfig;
}
