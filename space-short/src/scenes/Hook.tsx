import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Sun} from '../components/Planet';
import {Sfx, Shell} from '../components/Shell';
import {C, at, mono} from '../theme';

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const goneAt = at('hook', 'desapareciera') + 0.35;
  const beamStart = at('hook', 'no');
  const arrive = at('hook', 'minutos.') + 0.25;
  const loco = at('hook', 'Y');

  const sunIn = pop(frame, fps, 0, 12);
  const collapse = ease(frame, [goneAt * fps, (goneAt + 0.35) * fps]);
  const flash = interpolate(frame, [(goneAt + 0.3) * fps, (goneAt + 0.38) * fps, (goneAt + 0.8) * fps], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const beam = ease(frame, [beamStart * fps, arrive * fps], [0, 1]);
  const secs = Math.round(interpolate(t, [beamStart, arrive], [0, 500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const dark = t > arrive;
  const earthLight = interpolate(frame, [arrive * fps, (arrive + 0.3) * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const zoomOut = ease(frame, [loco * fps, (loco + 1.5) * fps]);
  const timer = pop(frame, fps, beamStart - 0.1, 12);

  return (
    <Shell id="hook" shakeAt={[goneAt + 0.3, arrive]} captionsTop={1360} accent="#ff8a3d">
      <div style={{position: 'absolute', inset: 0, scale: String(interpolate(zoomOut, [0, 1], [1, 0.72])), rotate: `${zoomOut * -6}deg`}}>
        {/* Sol */}
        <div style={{position: 'absolute', left: 540 - 230, top: 300, scale: String(interpolate(sunIn, [0, 1], [0.4, 1]) * (1 - collapse)), opacity: 1 - collapse * 0.2}}>
          <Sun size={460} />
        </div>
        {/* fantasma del Sol (contorno) */}
        <div style={{position: 'absolute', left: 540 - 230, top: 300, width: 460, height: 460, borderRadius: '50%', border: `4px dashed rgba(255,210,122,${0.5 * collapse})`}} />
        {/* rayo de luz viajando */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: t > beamStart && !dark ? 1 : 0}}>
          <defs>
            <linearGradient id="bm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd27a" stopOpacity="0" />
              <stop offset="1" stopColor="#fff3cf" stopOpacity="1" />
            </linearGradient>
          </defs>
          <line x1={540} y1={530} x2={interpolate(beam, [0, 1], [540, 760])} y2={interpolate(beam, [0, 1], [530, 1110])} stroke="url(#bm)" strokeWidth={10} strokeLinecap="round" />
          <circle cx={interpolate(beam, [0, 1], [540, 760])} cy={interpolate(beam, [0, 1], [530, 1110])} r={16} fill="#fff6d8" style={{filter: 'drop-shadow(0 0 20px #ffd27a)'}} />
        </svg>
        {/* Tierra */}
        <div style={{position: 'absolute', left: 760 - 75, top: 1110 - 75}}>
          <div style={{fontSize: 129, lineHeight: 1, filter: `brightness(${Math.max(0.12, earthLight)}) drop-shadow(0 0 ${30*Math.max(0.12, earthLight)}px #5CE1FF)`}}>🌍</div>
        </div>
        <div style={{position: 'absolute', left: 760 - 120, top: 1205, width: 240, textAlign: 'center', fontFamily: mono, fontSize: 30, color: C.dim}}>Tierra</div>
      </div>
      {/* contador */}
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: timer, scale: String(interpolate(timer, [0, 1], [0.6, 1]))}}>
        <div
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 84,
            color: dark ? C.cyan : C.orangeHi,
            padding: '14px 40px',
            borderRadius: 26,
            background: 'rgba(10,14,30,0.7)',
            border: `2px solid ${dark ? C.cyan : C.orange}66`,
            boxShadow: `0 0 50px ${dark ? C.cyan : C.orange}44`,
          }}
        >
          ⏱ {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, background: '#fff3d0', opacity: flash * 0.8}} />
      <Sfx src="riser" atSec={0} volume={0.25} />
      <Sfx src="impact" atSec={goneAt + 0.3} volume={0.9} />
      <Sfx src="whoosh" atSec={beamStart} volume={0.4} />
      <Sfx src="impact" atSec={arrive} volume={0.7} />
      <Sfx src="whoosh" atSec={loco} volume={0.4} />
    </Shell>
  );
};
