import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {C, display, mono, sans} from '../theme';

/** Cabecera de cada truco: pastilla "TRUCO X/5" + título grande */
export const TipHeader: React.FC<{n: number; title: string; accent?: string}> = ({n, title, accent = C.orange}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = pop(frame, fps, 0.05, 11);
  const b = pop(frame, fps, 0.2, 13);
  return (
    <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{display: 'flex', gap: 14, opacity: a}}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: i === n ? 90 : 46,
              height: 12,
              borderRadius: 99,
              background: i < n ? `${accent}99` : i === n ? accent : 'rgba(255,255,255,0.14)',
              boxShadow: i === n ? `0 0 24px ${accent}` : 'none',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: 6,
          color: accent,
          padding: '12px 28px',
          border: `2px solid ${accent}66`,
          borderRadius: 99,
          background: `${accent}14`,
          scale: String(interpolate(a, [0, 1], [0.6, 1])),
          opacity: a,
        }}
      >
        TRUCO {n}/5
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: 124,
          lineHeight: 0.95,
          color: C.text,
          textAlign: 'center',
          letterSpacing: -4,
          padding: '0 60px',
          opacity: b,
          translate: `0px ${interpolate(b, [0, 1], [50, 0])}px`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

/** Ventana de terminal estilo macOS */
export const Terminal: React.FC<{
  title?: string;
  children: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
  glow?: string;
}> = ({title = 'claude', children, width = 900, style, glow = C.orange}) => (
  <div
    style={{
      width,
      borderRadius: 34,
      background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
      border: `2px solid ${C.line}`,
      boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 90px ${glow}22`,
      overflow: 'hidden',
      ...style,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '24px 30px', borderBottom: `2px solid ${C.line}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 22, height: 22, borderRadius: 99, background: c}} />
      ))}
      <div style={{flex: 1, textAlign: 'center', fontFamily: mono, fontSize: 28, color: C.dim, marginRight: 80}}>{title}</div>
    </div>
    <div style={{padding: '34px 40px', fontFamily: mono, fontSize: 38, lineHeight: 1.55, color: C.text}}>{children}</div>
  </div>
);

/** Texto que se escribe letra a letra con cursor */
export const Typed: React.FC<{text: string; startSec: number; cps?: number; color?: string; cursor?: boolean}> = ({
  text,
  startSec,
  cps = 22,
  color = C.text,
  cursor = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame / fps - startSec) * cps)));
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={{color}}>
      {text.slice(0, n)}
      {cursor && <span style={{opacity: n < text.length || blink ? 1 : 0, color: C.orange}}>▍</span>}
    </span>
  );
};

/** Tecla 3D que se pulsa */
export const Key: React.FC<{label: string; pressSec: number; width?: number}> = ({label, pressSec, width = 300}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const down = t >= pressSec && t < pressSec + 0.35;
  const appear = pop(frame, fps, pressSec - 0.6, 12);
  const lit = t >= pressSec;
  return (
    <div
      style={{
        width,
        height: 190,
        borderRadius: 34,
        background: lit ? `linear-gradient(180deg, ${C.orangeHi}, ${C.orange})` : 'linear-gradient(180deg,#2a2622,#1d1a17)',
        boxShadow: down
          ? `0 4px 0 #6b3420, 0 0 70px ${C.orange}aa`
          : lit
            ? `0 16px 0 #6b3420, 0 0 60px ${C.orange}66`
            : '0 16px 0 #0d0c0b, 0 20px 40px rgba(0,0,0,0.5)',
        translate: `0px ${down ? 12 : 0}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: sans,
        fontWeight: 800,
        fontSize: 64,
        color: lit ? '#2b1208' : C.text,
        border: '2px solid rgba(255,255,255,0.08)',
        opacity: appear,
        scale: String(interpolate(appear, [0, 1], [0.5, 1])),
      }}
    >
      {label}
    </div>
  );
};

export const Badge: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.orange, style}) => (
  <div
    style={{
      fontFamily: sans,
      fontWeight: 800,
      fontSize: 40,
      color: '#1a0d07',
      background: color,
      padding: '16px 32px',
      borderRadius: 22,
      boxShadow: `0 14px 40px ${color}66`,
      ...style,
    }}
  >
    {children}
  </div>
);
