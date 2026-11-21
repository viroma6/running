import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import timeline from './timeline.json';

export const display = loadDisplay('normal', {weights: ['600', '800'], subsets: ['latin']}).fontFamily;
export const sans = loadSans('normal', {weights: ['500', '700', '900'], subsets: ['latin']}).fontFamily;
export const mono = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  bg: '#03040A',
  panel: '#0B0F1E',
  panel2: '#111733',
  line: 'rgba(190,210,255,0.14)',
  text: '#F2F5FF',
  dim: 'rgba(222,230,255,0.6)',
  orange: '#FFB347',
  orangeHi: '#FFD27A',
  cyan: '#5CE1FF',
  violet: '#A78BFA',
  green: '#4ADE80',
  red: '#F25F5C',
  yellow: '#FACC15',
  blue: '#7DB7FF',
};

export type SceneId = 'hook' | 'f1' | 'f2' | 'f3' | 'f4' | 'cta';
export type Word = {text: string; start: number; end: number; phrase: number};
export const scene = (id: SceneId) => timeline.scenes.find((s) => s.id === id)!;
export const sceneFrames = (id: SceneId, fps: number) => Math.ceil(scene(id).duration * fps);
/** Segundo en el que empieza la palabra (para sincronizar animaciones con la voz) */
export const at = (id: SceneId, text: string, nth = 0) =>
  scene(id).words.filter((w) => w.text.toLowerCase().startsWith(text.toLowerCase()))[nth]?.start ?? 0;
