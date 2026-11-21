import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import timeline from './timeline.json';

export const display = loadDisplay('normal', {weights: ['600', '800'], subsets: ['latin']}).fontFamily;
export const sans = loadSans('normal', {weights: ['500', '700', '900'], subsets: ['latin']}).fontFamily;
export const mono = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  bg: '#0B0A09',
  panel: '#171513',
  panel2: '#1F1C19',
  line: 'rgba(255,240,225,0.10)',
  text: '#F7F1EA',
  dim: 'rgba(247,241,234,0.55)',
  orange: '#E2774F',
  orangeHi: '#FF9B6E',
  green: '#4ADE80',
  red: '#F25F5C',
  yellow: '#FACC15',
  blue: '#7DB7FF',
};

export type SceneId = 'hook' | 'tip1' | 'tip2' | 'tip3' | 'tip4' | 'tip5' | 'cta';
export type Word = {text: string; start: number; end: number; phrase: number};
export const scene = (id: SceneId) => timeline.scenes.find((s) => s.id === id)!;
export const sceneFrames = (id: SceneId, fps: number) => Math.ceil(scene(id).duration * fps);
/** Segundo en el que empieza la palabra (para sincronizar animaciones con la voz) */
export const at = (id: SceneId, text: string, nth = 0) =>
  scene(id).words.filter((w) => w.text.toLowerCase().startsWith(text.toLowerCase()))[nth]?.start ?? 0;
