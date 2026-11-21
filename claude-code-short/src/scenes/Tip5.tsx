import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {Terminal, TipHeader, Typed} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, mono} from '../theme';

const AGENTS = [
  {branch: 'feature/login', color: C.orange, speed: 1.6},
  {branch: 'fix/pagos', color: C.green, speed: 1.25},
  {branch: 'refactor/api', color: C.blue, speed: 1.9},
];

export const Tip5: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cmdAt = at('tip5', 'con');
  const agentsAt = at('tip5', '3');
  const term = pop(frame, fps, 0.3, 14);
  return (
    <Shell id="tip5" accent="#A78BFA">
      <TipHeader n={5} title="En paralelo" accent="#A78BFA" />
      <div style={{position: 'absolute', top: 590, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: term, translate: `0px ${interpolate(term, [0, 1], [80, 0])}px`}}>
        <Terminal width={920} glow="#A78BFA">
          <span style={{color: '#A78BFA'}}>$ </span>
          <Typed text="claude --worktree" startSec={cmdAt} cps={26} />
        </Terminal>
      </div>
      <div style={{position: 'absolute', top: 860, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 22}}>
        {AGENTS.map((a, i) => {
          const s = agentsAt - 0.9 + i * 0.25;
          const p = pop(frame, fps, s, 12);
          const prog = ease(frame, [(s + 0.2) * fps, (s + 0.2 + a.speed) * fps]);
          const done = prog >= 0.999;
          return (
            <div
              key={a.branch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '22px 30px',
                borderRadius: 26,
                background: C.panel2,
                border: `2px solid ${a.color}55`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.45)`,
                fontFamily: mono,
                fontSize: 32,
                color: C.text,
                opacity: p,
                translate: `${interpolate(p, [0, 1], [i % 2 ? 300 : -300, 0])}px 0px`,
              }}
            >
              <span style={{color: a.color, fontSize: 38, rotate: done ? '0deg' : `${t * 360}deg`, display: 'inline-block', width: 40, textAlign: 'center'}}>
                {done ? '✓' : '✻'}
              </span>
              <span style={{width: 290}}>{a.branch}</span>
              <div style={{flex: 1, height: 18, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                <div style={{width: `${prog * 100}%`, height: '100%', background: a.color, borderRadius: 99}} />
              </div>
              <span style={{width: 120, textAlign: 'right', color: done ? a.color : C.dim, fontWeight: 700}}>{done ? 'PR ✓' : `${Math.round(prog * 100)}%`}</span>
            </div>
          );
        })}
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      {AGENTS.map((a, i) => (
        <Sfx key={a.branch} src="pop" atSec={agentsAt - 0.9 + i * 0.25} volume={0.4} />
      ))}
      {AGENTS.map((a, i) => (
        <Sfx key={a.branch + 'd'} src="click" atSec={agentsAt - 0.9 + i * 0.25 + 0.2 + a.speed} volume={0.7} />
      ))}
    </Shell>
  );
};
