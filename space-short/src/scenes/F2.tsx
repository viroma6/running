import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Sun} from '../components/Planet';
import {TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono} from '../theme';

const R = 330;
const DOTS = (() => {
  const out: {x: number; y: number; d: number}[] = [];
  for (let y = -R; y <= R; y += 22)
    for (let x = -R; x <= R; x += 22) if (x * x + y * y < (R - 14) ** 2) out.push({x, y, d: random(`e${x}-${y}`)});
  return out;
})();

export const F2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fillAt = at('f2', 'cabrían');
  const countEnd = at('f2', 'Tierras.') + 0.3;
  const monton = at('f2', 'estrella');
  const fill = ease(frame, [fillAt * fps, countEnd * fps]);
  const out = ease(frame, [monton * fps, (monton + 0.9) * fps]);
  const sunIn = pop(frame, fps, 0.05, 13);
  const n = Math.round(1300000 * fill);
  const label = pop(frame, fps, monton + 0.5, 12);
  return (
    <Shell id="f2" accent="#ff8a3d">
      <TipHeader n={2} title="El Sol" accent={C.orange} />
      <div style={{position: 'absolute', left: 540 - R, top: 880 - R, width: R * 2, height: R * 2, scale: String(interpolate(sunIn, [0, 1], [0.5, 1]) * interpolate(out, [0, 1], [1, 0.05])), translate: `${interpolate(out, [0, 1], [0, 160])}px ${interpolate(out, [0, 1], [0, -120])}px`}}>
        <Sun size={R * 2} />
        <svg width={R * 2} height={R * 2} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
          {DOTS.map((d, i) =>
            d.d < fill ? <circle key={i} cx={d.x + R} cy={d.y + R} r={8} fill="#3b82f6" stroke="#7ee787" strokeWidth={2} opacity={0.95} /> : null,
          )}
        </svg>
      </div>
      <div style={{position: 'absolute', top: 1130, left: 0, right: 0, textAlign: 'center', opacity: interpolate(fill, [0, 0.05], [0, 1]) * (1 - out) ** 3}}>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 92, color: C.text, textShadow: `0 0 40px ${C.cyan}`}}>{n.toLocaleString('es-ES')}</span>
        <span style={{fontSize: 70}}> 🌍</span>
      </div>
      {/* "una más" entre las estrellas */}
      <div style={{position: 'absolute', top: 640, left: 640, opacity: label, scale: String(interpolate(label, [0, 1], [0.6, 1]))}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 60, color: C.orangeHi, rotate: '-4deg'}}>← una más 🤷</div>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="riser" atSec={fillAt - 0.4} volume={0.3} />
      <Sfx src="impact" atSec={countEnd} volume={0.6} />
      <Sfx src="whoosh" atSec={monton} volume={0.5} />
      <Sfx src="pop" atSec={monton + 0.5} volume={0.5} />
    </Shell>
  );
};
