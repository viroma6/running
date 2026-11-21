import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Planet} from '../components/Planet';
import {TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono, sans} from '../theme';

const Stat: React.FC<{label: string; value: number; color: string; startSec: number; max: number}> = ({label, value, color, startSec, max}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = pop(frame, fps, startSec, 12);
  const c = ease(frame, [startSec * fps, (startSec + 0.9) * fps]);
  return (
    <div style={{opacity: p, translate: `${interpolate(p, [0, 1], [-80, 0])}px 0px`, display: 'flex', flexDirection: 'column', gap: 12}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontFamily: sans, fontWeight: 900, fontSize: 52, color}}>{label}</span>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 54, color: C.text}}>
          {Math.round(value * c)} <span style={{fontSize: 34, color: C.dim}}>días</span>
        </span>
      </div>
      <div style={{height: 30, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
        <div style={{width: `${(value / max) * 100 * c}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 24px ${color}`}} />
      </div>
    </div>
  );
};

export const F1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dayAt = at('f1', '243');
  const yearAt = at('f1', '225');
  const stampAt = at('f1', 'Sol.') + 0.2;
  const planet = pop(frame, fps, 0.1, 14);
  const stamp = pop(frame, fps, stampAt, 8);
  return (
    <Shell id="f1" accent="#f59e0b">
      <TipHeader n={1} title="Venus" accent={C.orange} />
      <div style={{position: 'absolute', top: 500, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(interpolate(planet, [0, 1], [0.5, 1])), opacity: planet}}>
        <Planet size={380} colors={['#f5d08a', '#e8b363', '#f3dca8', '#d99a4e', '#f7e2b5']} glow="#ffcf7a" speed={0.35} />
      </div>
      <div style={{position: 'absolute', top: 940, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 34}}>
        <Stat label="1 DÍA" value={243} color={C.orangeHi} startSec={dayAt - 0.2} max={243} />
        <Stat label="1 AÑO" value={225} color={C.cyan} startSec={yearAt - 0.2} max={243} />
      </div>
      <div style={{position: 'absolute', top: 700, right: 70, opacity: stamp, scale: String(interpolate(stamp, [0, 1], [2.5, 1])), rotate: '10deg'}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 70, color: '#1a1205', background: C.orangeHi, padding: '12px 30px', borderRadius: 20, boxShadow: `0 0 60px ${C.orange}`}}>DÍA &gt; AÑO 🤯</div>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="pop" atSec={dayAt - 0.2} volume={0.5} />
      <Sfx src="pop" atSec={yearAt - 0.2} volume={0.5} />
      <Sfx src="impact" atSec={stampAt} volume={0.7} />
    </Shell>
  );
};
