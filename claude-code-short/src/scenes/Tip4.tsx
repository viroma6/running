import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Terminal, TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, mono, sans} from '../theme';

export const Tip4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const clearAt = at('tip4', '/clear');
  const compactAt = at('tip4', '/compact');
  const f = (a: number, b: number) => [a * fps, b * fps] as [number, number];
  // nivel de contexto en %
  let level: number;
  if (t < clearAt) level = ease(frame, f(0.2, clearAt - 0.1), [35, 94]);
  else if (t < clearAt + 0.25) level = ease(frame, f(clearAt, clearAt + 0.25), [94, 0]);
  else if (t < compactAt) level = ease(frame, f(clearAt + 0.3, compactAt - 0.05), [0, 81]);
  else level = ease(frame, f(compactAt + 0.1, compactAt + 0.6), [81, 18]);
  const color = level > 75 ? C.red : level > 50 ? C.yellow : C.green;
  const cmd = t >= compactAt ? '/compact' : t >= clearAt ? '/clear' : '';
  const cmdPop = pop(frame, fps, t >= compactAt ? compactAt : clearAt, 10);
  const card = pop(frame, fps, 0.3, 14);
  return (
    <Shell id="tip4" accent={C.yellow}>
      <TipHeader n={4} title="Contexto limpio" accent={C.yellow} />
      <div style={{position: 'absolute', top: 590, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: card, translate: `0px ${interpolate(card, [0, 1], [80, 0])}px`}}>
        <Terminal width={920} glow={color}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontWeight: 700, fontSize: 36, color: C.dim, marginBottom: 18}}>
            <span>Contexto usado</span>
            <span style={{color, fontFamily: mono}}>
              {level > 90 ? '⚠ ' : ''}
              {Math.round(level)}%
            </span>
          </div>
          <div style={{height: 54, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', border: `2px solid ${C.line}`}}>
            <div style={{width: `${level}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 30px ${color}`}} />
          </div>
          <div style={{marginTop: 30, height: 60}}>
            <span style={{color: C.yellow}}>&gt; </span>
            <span
              style={{
                display: 'inline-block',
                fontWeight: 700,
                fontSize: 48,
                color: C.yellow,
                scale: String(interpolate(cmdPop, [0, 1], [1.5, 1])),
                opacity: cmd ? 1 : 0,
              }}
            >
              {cmd}
            </span>
          </div>
          <div style={{fontSize: 30, color: C.green, opacity: pop(frame, fps, compactAt + 0.6)}}>✓ resumen guardado, lo importante se queda</div>
        </Terminal>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="whoosh" atSec={clearAt} volume={0.6} />
      <Sfx src="click" atSec={clearAt} volume={0.8} />
      <Sfx src="click" atSec={compactAt} volume={0.8} />
      <Sfx src="pop" atSec={compactAt + 0.1} volume={0.5} />
    </Shell>
  );
};
