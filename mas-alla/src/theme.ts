import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import timeline from './timeline.json';

export const display = loadDisplay('normal', {weights: ['600', '800'], subsets: ['latin']}).fontFamily;
export const sans = loadSans('normal', {weights: ['400', '600', '800'], subsets: ['latin']}).fontFamily;
export const mono = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  bg: '#02030A',
  panel: 'rgba(10,14,32,0.72)',
  line: 'rgba(190,210,255,0.16)',
  text: '#F2F5FF',
  dim: 'rgba(222,230,255,0.62)',
  violet: '#A78BFA',
};

export type Callout = [string, string] | null;
export type Phrase = {text: string; start: number; end: number; callout: Callout};
export type ChapterData = {id: string; duration: number; lead: number; phrases: Phrase[]};
export const chapters = timeline.chapters as ChapterData[];
export const chapter = (id: string) => chapters.find((c) => c.id === id)!;
export const frames = (sec: number, fps: number) => Math.ceil(sec * fps);
