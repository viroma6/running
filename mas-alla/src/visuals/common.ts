import {Easing, interpolate} from 'remotion';
import {ChapterData} from '../theme';

export type VisualProps = {ch: ChapterData; t: number; frame: number; enter: number; width: number; height: number; fps: number};

/** Inicio / fin de la frase i */
export const P = (ch: ChapterData, i: number) => ch.phrases[Math.min(i, ch.phrases.length - 1)].start;
export const E = (ch: ChapterData, i: number) => ch.phrases[Math.min(i, ch.phrases.length - 1)].end;

/** Rampa 0→1 suave entre a y b (segundos) */
export const ramp = (t: number, a: number, b: number, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
/** Ventana: entra en a, sale en b */
export const win = (t: number, a: number, b: number, f = 0.5) =>
  interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
