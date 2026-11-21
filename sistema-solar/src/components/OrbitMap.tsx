import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODIES} from '../planets';
import {C, display, mono} from '../theme';

const CX = 960;
const CY = 560;
const rx = (i: number) => (i === 0 ? 0 : 90 + i * 78);
const ANG = [0, 0.8, 2.3, 3.6, 5.0, 0.3, 1.9, 3.1, 4.4, 5.6];
const pos = (i: number, a = ANG[i]) => ({x: CX + Math.cos(a) * rx(i), y: CY + Math.sin(a) * rx(i) * 0.36});

/** Interludio: mapa del sistema solar con la nave viajando a la siguiente parada */
export const OrbitMap: React.FC<{to: number; endSec: number; chapterNo: number}> = ({to, endSec, chapterNo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const from = Math.max(0, to - 1);
  const travel = interpolate(t, [0.3, endSec - 1.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const r = interpolate(travel, [0, 1], [rx(from), rx(to)]);
  const a = interpolate(travel, [0, 1], [ANG[from], ANG[to] + (to === 0 ? 0 : 0)]);
  const ship = to === 0 ? {x: CX - 600 + travel * 600, y: CY + 200 - travel * 200} : {x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.36};
  const target = pos(to);
  const zoom = interpolate(t, [endSec - 1.0, endSec], [1, 3.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const fade = interpolate(t, [0, 0.35, endSec - 0.45, endSec], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const b = BODIES[to];
  const label = interpolate(t, [0.4, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, scale: String(zoom), transformOrigin: `${target.x}px ${target.y}px`}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {BODIES.map((_, i) =>
            i === 0 ? null : (
              <ellipse key={i} cx={CX} cy={CY} rx={rx(i)} ry={rx(i) * 0.36} fill="none" stroke={i === to ? b.accent : 'rgba(190,210,255,0.18)'} strokeWidth={i === to ? 3 : 1.5} strokeDasharray={i === 9 ? '6 8' : undefined} />
            ),
          )}
          <circle cx={CX} cy={CY} r={34} fill="#FFB347" style={{filter: 'drop-shadow(0 0 30px #ff9f2e)'}} />
          {BODIES.map((bb, i) => {
            if (i === 0) return null;
            const p = pos(i);
            return <circle key={bb.id} cx={p.x} cy={p.y} r={i === to ? 13 : 8} fill={bb.accent} opacity={i === to ? 1 : 0.7} />;
          })}
          {/* estela */}
          {Array.from({length: 14}).map((_, k) => {
            const tt = Math.max(0, travel - k * 0.025);
            const rr = interpolate(tt, [0, 1], [rx(from), rx(to)]);
            const aa = interpolate(tt, [0, 1], [ANG[from], ANG[to]]);
            const p = to === 0 ? {x: CX - 600 + tt * 600, y: CY + 200 - tt * 200} : {x: CX + Math.cos(aa) * rr, y: CY + Math.sin(aa) * rr * 0.36};
            return <circle key={k} cx={p.x} cy={p.y} r={7 - k * 0.4} fill="#fff" opacity={(1 - k / 14) * 0.6} />;
          })}
          <circle cx={ship.x} cy={ship.y} r={9} fill="#fff" style={{filter: 'drop-shadow(0 0 14px #fff)'}} />
        </svg>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', opacity: label, translate: `0px ${interpolate(label, [0, 1], [30, 0])}px`}}>
        <div style={{fontFamily: mono, fontSize: 30, letterSpacing: 8, color: b.accent}}>CAPÍTULO {String(chapterNo).padStart(2, '0')}</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 110, color: C.text, letterSpacing: -3, lineHeight: 1.05}}>{b.name}</div>
        <div style={{fontFamily: mono, fontSize: 30, color: C.dim}}>{b.distance}</div>
      </div>
    </div>
  );
};
