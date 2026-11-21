import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, sans} from '../theme';

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sigAt = at('cta', 'sígueme');
  const tapAt = sigAt + 0.55;
  const save = pop(frame, fps, 0.05, 9);
  const btn = pop(frame, fps, sigAt - 0.15, 11);
  const tapped = t >= tapAt;
  const tapPop = pop(frame, fps, tapAt, 8);
  const ring = ((frame / fps) % 1.1) / 1.1;
  const hand = interpolate(frame, [(tapAt - 0.5) * fps, (tapAt - 0.05) * fps], [260, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Shell id="cta" captionsTop={1390}>
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 80,
            background: `linear-gradient(160deg, ${C.orangeHi}, ${C.orange})`,
            boxShadow: `0 30px 0 #6b3420, 0 0 140px ${C.orange}99`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scale: String(interpolate(save, [0, 1], [0.2, 1])),
            rotate: `${interpolate(save, [0, 1], [-30, -6])}deg`,
          }}
        >
          <svg width={150} height={170} viewBox="0 0 24 28">
            <path d="M3 2 h18 v24 l-9 -6 l-9 6 z" fill="#1a0d07" />
          </svg>
        </div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 140, color: C.text, letterSpacing: -5, lineHeight: 1, opacity: save}}>Guárdalo</div>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 46, color: C.dim, opacity: pop(frame, fps, 0.4)}}>para tenerlo a mano 👇</div>
      </div>
      <div style={{position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', opacity: btn, scale: String(interpolate(btn, [0, 1], [0.4, 1]) * (tapped ? interpolate(tapPop, [0, 1], [0.9, 1]) : 1))}}>
          {!tapped && (
            <div style={{position: 'absolute', inset: 0, borderRadius: 99, border: `5px solid ${C.orange}`, scale: String(1 + ring * 0.35), opacity: 1 - ring}} />
          )}
          <div
            style={{
              fontFamily: sans,
              fontWeight: 900,
              fontSize: 68,
              padding: '34px 90px',
              borderRadius: 99,
              background: tapped ? C.panel2 : C.orange,
              color: tapped ? C.text : '#1a0d07',
              border: tapped ? `3px solid ${C.line}` : '3px solid transparent',
              boxShadow: tapped ? 'none' : `0 20px 60px ${C.orange}88`,
            }}
          >
            {tapped ? 'Siguiendo ✓' : '+ Seguir'}
          </div>
          <div style={{position: 'absolute', right: -40, bottom: -110, fontSize: 130, translate: `${hand}px ${hand}px`, opacity: t < tapAt + 0.8 ? 1 : 0}}>👆</div>
        </div>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="impact" atSec={0.05} volume={0.6} />
      <Sfx src="pop" atSec={sigAt - 0.15} volume={0.5} />
      <Sfx src="click" atSec={tapAt} volume={0.9} />
      <Sfx src="ding" atSec={tapAt + 0.05} volume={0.45} />
    </Shell>
  );
};
