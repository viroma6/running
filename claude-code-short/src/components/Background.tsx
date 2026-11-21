import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Fondo cálido con brillos que respiran, rejilla sutil, grano y viñeta */
export const Background: React.FC<{accent?: string}> = ({accent = C.orange}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          left: -300 + Math.sin(t * 0.5) * 120,
          top: -500 + Math.cos(t * 0.4) * 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55 0%, ${accent}00 62%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          right: -500 + Math.cos(t * 0.35) * 140,
          bottom: -300 + Math.sin(t * 0.45) * 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, #7a4cff33 0%, #7a4cff00 60%)`,
          filter: 'blur(50px)',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0px ${interpolate(frame, [0, 900], [0, 90 * 6])}px`,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)',
        }}
      />
      <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={frame % 8} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};
