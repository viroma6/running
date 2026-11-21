import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono} from '../theme';

const STEPS = [
  [250, 1310, -8],
  [360, 1250, 10],
  [470, 1300, -6],
  [580, 1235, 12],
  [690, 1290, -4],
  [800, 1225, 14],
];

const Boot: React.FC<{x: number; y: number; rot: number; p: number; flip: boolean}> = ({x, y, rot, p, flip}) => (
  <svg width={70} height={130} viewBox="0 0 70 130" style={{position: 'absolute', left: x, top: y, rotate: `${rot + 90}deg`, opacity: p, scale: String(interpolate(p, [0, 1], [1.6, 1]) * (flip ? -1 : 1))}}>
    <rect x={8} y={4} width={54} height={70} rx={24} fill="#3a3d47" />
    <rect x={14} y={84} width={42} height={42} rx={18} fill="#3a3d47" />
    {[14, 26, 38, 50, 62].map((yy) => (
      <rect key={yy} x={12} y={yy} width={46} height={5} rx={2} fill="#6b6f7c" />
    ))}
  </svg>
);

export const F4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const yearsAt = at('f4', 'millones');
  const windAt = at('f4', 'viento');
  const rainAt = at('f4', 'lluvia');
  const surf = pop(frame, fps, 0.05, 15);
  const years = ease(frame, [yearsAt * fps, (yearsAt + 1.3) * fps]);
  const wind = pop(frame, fps, windAt - 0.1, 10);
  const rain = pop(frame, fps, rainAt - 0.1, 10);
  return (
    <Shell id="f4" accent="#64748b" captionsTop={880}>
      <TipHeader n={4} title="La Luna" accent="#cbd5e1" />
      {/* Tierra en el cielo */}
      <div style={{position: 'absolute', left: 840, top: 450, opacity: pop(frame, fps, 0.3)}}>
        <div style={{fontSize: 146, lineHeight: 1, filter: 'drop-shadow(0 0 30px #5CE1FF88)'}}>🌍</div>
      </div>
      {/* superficie lunar */}
      <div style={{position: 'absolute', left: -460, top: interpolate(surf, [0, 1], [1500, 1080]), width: 2000, height: 1600, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 10%, #b9bcc6 0%, #8a8e99 30%, #4b4e58 70%)', boxShadow: '0 -20px 120px rgba(200,210,255,0.25)'}}>
        {[
          [520, 120, 160],
          [1200, 90, 120],
          [900, 260, 220],
          [1500, 230, 140],
          [300, 300, 110],
        ].map(([x, y, r], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r * 0.35, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 70%, rgba(255,255,255,0.12), rgba(0,0,0,0.35))'}} />
        ))}
      </div>
      {STEPS.map(([x, y, r], i) => (
        <Boot key={i} x={x} y={y - 110} rot={r} flip={i % 2 === 1} p={pop(frame, fps, 0.35 + i * 0.28, 14)} />
      ))}
      {/* contador de años */}
      <div style={{position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center', opacity: interpolate(years, [0, 0.03], [0, 1])}}>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 84, color: C.text, textShadow: '0 0 40px #94a3b8'}}>+{Math.round(1_000_000 * years).toLocaleString('es-ES')}</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 52, color: C.dim}}>años</div>
      </div>
      <div style={{position: 'absolute', top: 440, left: 80, display: 'flex', flexDirection: 'column', gap: 20}}>
        {[
          ['🌬️', wind],
          ['🌧️', rain],
        ].map(([e, p], i) => (
          <div key={i} style={{position: 'relative', fontSize: 100, opacity: p as number, scale: String(interpolate(p as number, [0, 1], [0.4, 1]))}}>
            {e as string}
            <svg width={120} height={120} viewBox="0 0 100 100" style={{position: 'absolute', left: 0, top: 6}}>
              <path d="M15 15 L85 85 M85 15 L15 85" stroke={C.red} strokeWidth={12} strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      {STEPS.map((_, i) => (
        <Sfx key={i} src="click" atSec={0.35 + i * 0.28} volume={0.6} />
      ))}
      <Sfx src="riser" atSec={yearsAt - 0.3} volume={0.25} />
      <Sfx src="pop" atSec={windAt - 0.1} volume={0.5} />
      <Sfx src="pop" atSec={rainAt - 0.1} volume={0.5} />
    </Shell>
  );
};
