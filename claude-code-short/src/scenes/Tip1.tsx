import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Key, Terminal, TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, sans} from '../theme';

const STEPS = ['Analizar el código existente', 'Diseñar la solución', 'Implementar + tests'];

export const Tip1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const press = at('tip1', 'Shift');
  const planAt = at('tip1', 'Claude');
  const mode = ease(frame, [(press + 0.3) * fps, (press + 0.7) * fps]);
  const term = pop(frame, fps, press + 0.4, 14);
  return (
    <Shell id="tip1">
      <TipHeader n={1} title="Modo Plan" />
      <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
        <Key label="⇧ Shift" pressSec={press} width={330} />
        <div style={{fontFamily: sans, fontWeight: 900, fontSize: 80, color: C.dim, opacity: pop(frame, fps, press - 0.5)}}>+</div>
        <Key label="Tab ⇥" pressSec={press + 0.12} width={300} />
      </div>
      <div style={{position: 'absolute', top: 830, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: term, translate: `0px ${interpolate(term, [0, 1], [80, 0])}px`}}>
        <Terminal width={920}>
          <div style={{color: C.dim, fontSize: 32}}>
            <span style={{color: mode > 0.5 ? '#7DB7FF' : C.dim}}>⏸ plan mode {mode > 0.5 ? 'on' : 'off'}</span>
          </div>
          {STEPS.map((s, i) => {
            const p = pop(frame, fps, planAt + 0.35 + i * 0.5, 14);
            const done = t > planAt + 0.6 + i * 0.5;
            return (
              <div key={s} style={{opacity: p, translate: `${interpolate(p, [0, 1], [-40, 0])}px 0px`, display: 'flex', gap: 20}}>
                <span style={{color: done ? C.green : C.dim}}>{done ? '☑' : '☐'}</span>
                <span>
                  {i + 1}. {s}
                </span>
              </div>
            );
          })}
        </Terminal>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="click" atSec={press} volume={0.9} />
      <Sfx src="click" atSec={press + 0.12} volume={0.9} />
      <Sfx src="pop" atSec={planAt + 0.35} volume={0.35} />
      <Sfx src="pop" atSec={planAt + 0.85} volume={0.35} />
      <Sfx src="pop" atSec={planAt + 1.35} volume={0.35} />
    </Shell>
  );
};
