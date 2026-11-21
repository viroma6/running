import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, display, mono} from '../theme';

const N = 320;
const STREAKS = Array.from({length: N}).map((_, i) => ({a: random(`a${i}`) * Math.PI * 2, r0: random(`r${i}`), w: 0.6 + random(`w${i}`) * 2.2, hue: random(`h${i}`)}));

/** Rayas de hiperespacio. speed 0..1 */
export const Streaks: React.FC<{speed: number; travel: number; cx?: number; cy?: number; tint?: string; opacity?: number}> = ({speed, travel, cx = 960, cy = 540, tint = '#cfe0ff', opacity = 1}) => {
  const {width, height} = useVideoConfig();
  const maxR = Math.hypot(width, height) * 0.6;
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity}}>
      {STREAKS.map((s, i) => {
        const r = ((s.r0 + travel) % 1) ** 2 * maxR;
        const len = 6 + speed * (40 + r * 0.55);
        const x1 = cx + Math.cos(s.a) * r;
        const y1 = cy + Math.sin(s.a) * r;
        const x2 = cx + Math.cos(s.a) * (r + len);
        const y2 = cy + Math.sin(s.a) * (r + len);
        const o = Math.min(1, r / 140) * (0.35 + 0.65 * speed);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s.hue < 0.75 ? '#ffffff' : tint} strokeOpacity={o} strokeWidth={s.w} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** log-interpolación de distancias */
const logLerp = (a: number, b: number, k: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);

/** Interludio de salto entre paradas: hiperespacio + contador de distancia */
export const WarpJump: React.FC<{endSec: number; no: number; name: string; where: string; accent: string; fromLy: number; toLy: number; fmt: (ly: number) => string}> = ({endSec, no, name, where, accent, fromLy, toLy, fmt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const k = interpolate(t, [0.1, endSec - 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const speed = Math.sin(k * Math.PI);
  // recorrido integrado (aprox. analítica de la integral de sin)
  const travel = (1 - Math.cos(k * Math.PI)) * 1.4 + t * 0.05;
  const fade = interpolate(t, [0, 0.3, endSec - 0.45, endSec], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const label = interpolate(t, [0.35, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ly = logLerp(fromLy, toLy, k);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      <Streaks speed={speed} travel={travel} tint={accent} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: label}}>
        <div style={{fontFamily: mono, fontSize: 24, letterSpacing: 8, color: C.dim}}>DISTANCIA A LA TIERRA</div>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 64, color: '#fff', textShadow: `0 0 30px ${accent}`}}>{fmt(ly)}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', opacity: label, translate: `0px ${interpolate(label, [0, 1], [30, 0])}px`}}>
        <div style={{fontFamily: mono, fontSize: 30, letterSpacing: 8, color: accent}}>PARADA {String(no).padStart(2, '0')}</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 110, color: C.text, letterSpacing: -3, lineHeight: 1.05}}>{name}</div>
        <div style={{fontFamily: mono, fontSize: 30, color: C.dim}}>{where}</div>
      </div>
    </div>
  );
};
