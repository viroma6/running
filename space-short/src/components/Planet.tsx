import {useCurrentFrame} from 'remotion';

/** Planeta esférico: bandas que rotan + sombreado + atmósfera */
export const Planet: React.FC<{
  size: number;
  colors: string[];
  glow?: string;
  speed?: number;
  bands?: boolean;
  craters?: boolean;
  light?: number; // 0..1 brillo
  style?: React.CSSProperties;
}> = ({size, colors, glow = colors[0], speed = 1, bands = true, craters = false, light = 1, style}) => {
  const frame = useCurrentFrame();
  const shift = (frame * speed * 1.2) % (size * 2);
  const stripes = colors.map((c, i) => `${c} ${(i / colors.length) * 100}%, ${c} ${((i + 0.5) / colors.length) * 100}%`).join(',');
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 0 ${size * 0.25}px ${glow}${light > 0.5 ? '88' : '22'}, inset 0 0 ${size * 0.04}px ${glow}`,
        filter: `brightness(${0.15 + light * 0.85})`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bands ? `repeating-linear-gradient(170deg, ${stripes})` : colors[0],
          backgroundSize: `${size * 2}px ${size}px`,
          backgroundPosition: `${shift}px 0px`,
          filter: `blur(${size * 0.02}px)`,
          scale: '1.2',
        }}
      />
      {craters &&
        [
          [0.25, 0.3, 0.16],
          [0.6, 0.2, 0.1],
          [0.55, 0.6, 0.2],
          [0.2, 0.68, 0.09],
          [0.78, 0.5, 0.08],
          [0.4, 0.48, 0.06],
        ].map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (((x * size + shift * 0.5) % (size * 1.2)) - size * 0.1),
              top: y * size,
              width: r * size,
              height: r * size,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 60%, rgba(255,255,255,0.12), rgba(0,0,0,0.28))',
              boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.35)',
            }}
          />
        ))}
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.78) 82%)'}} />
    </div>
  );
};

/** Sol con corona giratoria */
export const Sun: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{width: size, height: size, position: 'relative', ...style}}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.35,
          borderRadius: '50%',
          background: 'repeating-conic-gradient(from 0deg, #ff8a3d00 0deg, #ffb34755 8deg, #ff8a3d00 16deg, #ffd27a33 24deg, #ff8a3d00 34deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 36%, black 40%, transparent 70%)',
          maskImage: 'radial-gradient(circle, transparent 36%, black 40%, transparent 70%)',
          rotate: `${frame * 0.6}deg`,
        }}
      />
      <div style={{position: 'absolute', inset: -size * 0.5, borderRadius: '50%', background: 'radial-gradient(circle, #ffb34766 0%, #ffb34700 65%)'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 45% 40%, #fff6d8 0%, #ffd27a 25%, #ff9f2e 60%, #e8571a 100%)',
          boxShadow: `0 0 ${Math.min(size * 0.3, 120)}px #ff9f2e, 0 0 ${Math.min(size * 0.8, 200)}px #ff6a2a88`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
            mixBlendMode: 'multiply',
            background: 'radial-gradient(circle at 30% 60%, #c2410c 0 4%, transparent 9%), radial-gradient(circle at 70% 30%, #c2410c 0 3%, transparent 8%), radial-gradient(circle at 60% 75%, #c2410c 0 5%, transparent 11%)',
            rotate: `${frame * 0.15}deg`,
          }}
        />
      </div>
    </div>
  );
};
