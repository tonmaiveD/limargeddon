/* Audio 100% sintetizado con WebAudio, independiente de Phaser. Portado de prototipo/san-isidro-v3.html; la música por
 * distrito (ADR 0038) toca las canciones de songs.ts con el mismo secuenciador. */
import { DEFAULT_SONG, SONGS, type Drum, type Song, type Voice } from './songs';

export type SfxName =
  | 'cone' | 'kernel' | 'oil' | 'horn' | 'bossHorn' | 'hit' | 'boom' | 'pickup' | 'bump' | 'whistle'
  | 'block' | 'phase' | 'turbo' | 'combi' | 'picaron' | 'metro' | 'skid' | 'win' | 'lose' | 'say' | 'combo';

let ac: AudioContext | null = null;
let master: GainNode, music: GainNode, noiseBuf: AudioBuffer;
let eng: OscillatorNode, engGain: GainNode, engFilt: BiquadFilterNode;
let on = true, playing = false, step = 0, nextT = 0, song: Song = SONGS[DEFAULT_SONG];
const stepDur = () => 60 / song.bpm / song.sub;

function init(): void {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = new Ctor();
  } catch { return; }
  master = ac.createGain(); master.gain.value = on ? 0.55 : 0; master.connect(ac.destination);
  music = ac.createGain(); music.gain.value = 0.2; music.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  eng = ac.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 50;
  engFilt = ac.createBiquadFilter(); engFilt.type = 'lowpass'; engFilt.frequency.value = 320;
  engGain = ac.createGain(); engGain.gain.value = 0;
  eng.connect(engFilt); engFilt.connect(engGain); engGain.connect(master); eng.start();
}

function tone(f: number, dur: number, type: OscillatorType = 'square', vol = 0.25, slide: number | null = null, when = 0, dest: AudioNode = master): void {
  if (!ac) return;
  const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
}

function noise(dur: number, vol = 0.3, freq = 1200, type: BiquadFilterType = 'lowpass', when = 0, dest: AudioNode = master, sweep: number | null = null): void {
  if (!ac) return;
  const t = ac.currentTime + when, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.03);
}

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function voice(v: Voice | undefined, i: number, w: number): void {
  if (!v) return;
  const n = v.notes[i % v.notes.length];
  for (const m of Array.isArray(n) ? n : n ? [n] : []) {
    tone(N(m), v.dur, v.wave, v.vol, null, w, music);
    if (v.double) tone(N(m) * 1.005, v.dur, v.wave, v.double, null, w, music); // segunda voz desafinada, como la chicha
  }
}

// Percusión sintetizada; k es 1 en un golpe y 1,7 en uno fuerte.
function drum(d: Drum, k: number, w: number): void {
  switch (d) {
    case 'kick': tone(110, 0.12, 'sine', 0.5 * k, 50, w, music); break;
    case 'snare': noise(0.12, 0.2 * k, 1800, 'bandpass', w, music); break;
    case 'hat': noise(0.03, 0.08 * k, 8000, 'highpass', w, music); break;
    case 'guiro': // como el prototipo: el golpe fuerte raspa dos veces
      noise(0.05, k > 1 ? 0.22 : 0.12, 6000, 'highpass', w, music);
      if (k > 1) noise(0.04, 0.1, 7000, 'highpass', w + stepDur() / 2, music);
      break;
    case 'clave': tone(2500, 0.05, 'triangle', 0.16 * k, null, w, music); break;
    case 'cowbell': tone(560, 0.08, 'square', 0.07 * k, null, w, music); tone(845, 0.08, 'square', 0.05 * k, null, w, music); break;
    case 'cajon': tone(140, 0.1, 'sine', 0.4 * k, 70, w, music); if (k > 1) noise(0.08, 0.2, 2500, 'bandpass', w, music); break;
    case 'shaker': noise(0.04, 0.06 * k, 5000, 'highpass', w, music); break;
    case 'bombo': tone(90, 0.2, 'sine', 0.5 * k, 45, w, music); break;
    case 'quijada': noise(0.18, 0.12 * k, 3000, 'bandpass', w, music); break;
  }
}

function schedule(i: number, t: number): void {
  const w = t - ac!.currentTime;
  voice(song.bass, i, w); voice(song.chords, i, w); voice(song.lead, i, w);
  for (const [d, pat] of Object.entries(song.drums) as [Drum, string][]) {
    const c = pat[i % pat.length];
    if (c === 'x' || c === 'X') drum(d, c === 'X' ? 1.7 : 1, w);
  }
}

export const Sfx = {
  init,
  get on() { return on; },
  toggle(): boolean { on = !on; if (master && ac) master.gain.setTargetAtTime(on ? 0.55 : 0, ac.currentTime, 0.02); return on; },
  // id: canción del distrito (songs.ts); sin id, o con uno desconocido, la cumbia chicha del prototipo
  music(v: boolean, id?: string): void { playing = v; if (v) song = SONGS[id ?? DEFAULT_SONG] ?? SONGS[DEFAULT_SONG]; if (v && ac) { nextT = ac.currentTime + 0.05; step = 0; } },
  tick(): void { if (!ac || !playing) return; while (nextT < ac.currentTime + 0.15) { schedule(step, nextT); nextT += stepDur(); step++; } },
  engine(level: number): void {
    if (!ac) return; const t = ac.currentTime;
    engGain.gain.setTargetAtTime(level > 0 ? 0.05 + level * 0.03 : 0, t, 0.08);
    eng.frequency.setTargetAtTime(42 + level * 55, t, 0.1);
    engFilt.frequency.setTargetAtTime(260 + level * 400, t, 0.1);
  },
  // lvl: nivel del combo, sube el tono un tono entero por paso
  play(n: SfxName, lvl = 0): void {
    if (!ac || !on) return;
    switch (n) {
      case 'cone': tone(700, 0.07, 'square', 0.1, 350); break;
      case 'kernel': noise(0.03, 0.12, 3000, 'bandpass'); break;
      case 'oil': noise(0.25, 0.25, 500); tone(130, 0.2, 'sine', 0.25, 60); break;
      case 'horn': tone(440, 0.12, 'square', 0.12); tone(554, 0.12, 'square', 0.1); tone(440, 0.3, 'square', 0.12, null, 0.16); tone(554, 0.3, 'square', 0.1, null, 0.16); break;
      case 'bossHorn': tone(330, 0.45, 'sawtooth', 0.14); tone(392, 0.45, 'sawtooth', 0.12); break;
      case 'hit': noise(0.15, 0.35, 1800); tone(90, 0.15, 'square', 0.2, 40); break;
      case 'boom': noise(0.7, 0.45, 1600, 'lowpass', 0, master, 120); tone(80, 0.5, 'sine', 0.4, 30); break;
      case 'pickup': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.09, 'triangle', 0.18, null, i * 0.06)); break;
      case 'bump': tone(70, 0.09, 'sine', 0.45); tone(60, 0.09, 'sine', 0.45, null, 0.12); break;
      case 'whistle': for (let i = 0; i < 5; i++) tone(i % 2 ? 2350 : 2150, 0.06, 'sine', 0.14, null, i * 0.06); break;
      case 'block': tone(1200, 0.12, 'triangle', 0.15, 1800); break;
      case 'phase': tone(180, 0.45, 'sawtooth', 0.18, 820); break;
      case 'turbo': noise(0.6, 0.3, 400, 'bandpass', 0, master, 3000); break;
      case 'combi': tone(300, 0.25, 'square', 0.15); tone(300, 0.4, 'square', 0.15, null, 0.3); noise(0.3, 0.12, 900, 'bandpass', 0.1); break;
      case 'picaron': tone(500, 0.25, 'triangle', 0.15, 900); break;
      case 'metro': tone(196, 0.9, 'sawtooth', 0.16); tone(247, 0.9, 'sawtooth', 0.14); tone(147, 0.9, 'square', 0.08); break;
      case 'skid': noise(0.4, 0.2, 2500, 'bandpass', 0, master, 800); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.14, null, i * 0.13)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'square', 0.14, null, i * 0.18)); break;
      case 'say': tone(880, 0.05, 'triangle', 0.06); tone(990, 0.05, 'triangle', 0.06, null, 0.06); break;
      case 'combo': { const f = 660 * Math.pow(2, (lvl * 2) / 12); tone(f, 0.08, 'square', 0.1); tone(f * 1.5, 0.1, 'triangle', 0.08, null, 0.05); break; }
    }
  },
};
