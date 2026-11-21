import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../theme';

/** Cielo estrellado con 3 capas de parallax, nebulosas y viñeta */
export const Background: React.FC<{accent?: string; drift?: number}> = ({accent = C.violet, drift = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / 30;
  const stars = Array.from({length: 420}).map((_, i) => ({
    x: random(`x${i}`) * width,
    y: random(`y${i}`) * height,
    r: random(`r${i}`) ** 4 * 2.6 + 0.5,
    ph: random(`p${i}`) * 6.28,
    d: 0.2 + random(`d${i}`) * 0.8,
  }));
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 1600, height: 1000, left: -300 + Math.sin(t * 0.08) * 120, top: -200, borderRadius: '50%', background: `radial-gradient(ellipse, ${accent}2a 0%, ${accent}00 62%)`, filter: 'blur(40px)'}} />
      <div style={{position: 'absolute', width: 1400, height: 1000, right: -400, bottom: -300 + Math.cos(t * 0.07) * 100, borderRadius: '50%', background: 'radial-gradient(ellipse, #3355ff22 0%, #3355ff00 60%)', filter: 'blur(50px)'}} />
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {stars.map((s, i) => (
          <circle key={i} cx={(s.x - frame * s.d * 0.35 * drift + width * 10) % width} cy={s.y} r={s.r} fill="#fff" opacity={(0.55 + 0.45 * Math.sin(t * (0.5 + s.d * 1.5) + s.ph)) * s.d} />
        ))}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)'}} />
    </AbsoluteFill>
  );
};
