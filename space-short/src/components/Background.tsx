import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

const STARS = Array.from({length: 260}).map((_, i) => ({
  x: random(`x${i}`) * 1080,
  y: random(`y${i}`) * 1920,
  r: random(`r${i}`) ** 3 * 3.2 + 0.6,
  ph: random(`p${i}`) * Math.PI * 2,
  sp: 0.6 + random(`s${i}`) * 2.2,
  depth: 0.3 + random(`d${i}`) * 0.7,
}));

/** Cielo estrellado con parallax, nebulosas que respiran, grano y viñeta */
export const Background: React.FC<{accent?: string}> = ({accent = C.violet}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1500,
          height: 1100,
          left: -500 + Math.sin(t * 0.3) * 80,
          top: 200 + Math.cos(t * 0.25) * 60,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${accent}40 0%, ${accent}00 60%)`,
          filter: 'blur(60px)',
          rotate: '-20deg',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          right: -600 + Math.cos(t * 0.3) * 90,
          bottom: -200,
          borderRadius: '50%',
          background: `radial-gradient(circle, #2d5bff30 0%, #2d5bff00 60%)`,
          filter: 'blur(60px)',
        }}
      />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {STARS.map((s, i) => {
          const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
          const y = (s.y + frame * s.depth * 0.6) % 1920;
          return <circle key={i} cx={s.x} cy={y} r={s.r} fill="#fff" opacity={tw * s.depth} />;
        })}
      </svg>
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={frame % 8} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,${interpolate(Math.sin(t), [-1, 1], [0.6, 0.7])}) 100%)`}} />
    </AbsoluteFill>
  );
};
