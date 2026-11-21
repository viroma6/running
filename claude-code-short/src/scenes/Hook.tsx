import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Badge} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono, sans} from '../theme';

const Spark: React.FC<{size: number; rot: number}> = ({size, rot}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{rotate: `${rot}deg`}}>
    {Array.from({length: 8}).map((_, i) => (
      <rect key={i} x={-5} y={-46} width={10} height={40} rx={5} fill={C.orange} transform={`rotate(${i * 45})`} />
    ))}
  </svg>
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const xAt = at('hook', 'Estás');
  const fiveAt = at('hook', '5');
  const creAt = at('hook', 'sus');

  const bubble = pop(frame, fps, 0, 11);
  const bubble2 = pop(frame, fps, 0.9, 12);
  const cross = pop(frame, fps, xAt, 9);
  const out = ease(frame, [(fiveAt - 0.45) * fps, (fiveAt - 0.05) * fps]);
  const five = pop(frame, fps, fiveAt, 8);
  const badge = pop(frame, fps, creAt, 11);

  return (
    <Shell id="hook" shakeAt={[xAt, fiveAt]} captionsTop={1340}>
      {/* logo superior */}
      <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: pop(frame, fps, 0, 14)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 34px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: `2px solid ${C.line}`}}>
          <Spark size={46} rot={t * 40} />
          <span style={{fontFamily: mono, fontWeight: 700, fontSize: 40, color: C.text, letterSpacing: 2}}>claude code</span>
        </div>
      </div>

      {/* Chat "normal" que se tacha */}
      <div
        style={{
          position: 'absolute',
          top: 420,
          left: 110,
          right: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          opacity: 1 - out,
          scale: String(interpolate(out, [0, 1], [1, 0.6])),
          translate: `0px ${interpolate(out, [0, 1], [0, -200])}px`,
          filter: `grayscale(${cross})`,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: 700,
            background: C.orange,
            color: '#1a0d07',
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 50,
            padding: '30px 40px',
            borderRadius: '44px 44px 10px 44px',
            scale: String(bubble),
            transformOrigin: 'right bottom',
          }}
        >
          hola 👋 ¿me arreglas este bug?
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: 700,
            background: C.panel2,
            border: `2px solid ${C.line}`,
            color: C.text,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 46,
            padding: '30px 40px',
            borderRadius: '44px 44px 44px 10px',
            scale: String(bubble2),
            transformOrigin: 'left bottom',
          }}
        >
          ¡Claro! Aquí tienes una posible solución…
        </div>
        {/* X roja */}
        <div style={{position: 'absolute', inset: -60, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={560} height={560} viewBox="0 0 100 100" style={{scale: String(interpolate(cross, [0, 1], [2.2, 1])), opacity: Math.min(1, cross * 1.4), filter: `drop-shadow(0 0 30px ${C.red})`}}>
            <path d="M15 15 L85 85 M85 15 L15 85" stroke={C.red} strokeWidth={13} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 5 TRUCOS */}
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 560,
            lineHeight: 0.85,
            color: C.orange,
            textShadow: `0 0 120px ${C.orange}aa, 0 20px 0 #6b3420`,
            scale: String(interpolate(five, [0, 1], [3, 1])),
            opacity: Math.min(1, five * 2),
            rotate: `${interpolate(five, [0, 1], [-14, -4])}deg`,
          }}
        >
          5
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 150,
            letterSpacing: -5,
            color: C.text,
            marginTop: -10,
            opacity: pop(frame, fps, fiveAt + 0.15, 12),
            translate: `0px ${interpolate(pop(frame, fps, fiveAt + 0.15, 12), [0, 1], [60, 0])}px`,
          }}
        >
          TRUCOS PRO
        </div>
        <Badge style={{marginTop: 34, opacity: badge, scale: String(interpolate(badge, [0, 1], [0.5, 1])), rotate: '2deg'}}>
          usados por sus creadores
        </Badge>
      </div>

      <Sfx src="pop" atSec={0} volume={0.5} />
      <Sfx src="pop" atSec={0.9} volume={0.4} />
      <Sfx src="impact" atSec={xAt} volume={0.7} />
      <Sfx src="riser" atSec={fiveAt - 1.3} volume={0.35} />
      <Sfx src="impact" atSec={fiveAt} volume={0.9} />
      <Sfx src="pop" atSec={creAt} volume={0.5} />
    </Shell>
  );
};
