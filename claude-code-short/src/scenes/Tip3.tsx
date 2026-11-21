import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {Terminal, TipHeader, Typed} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, mono} from '../theme';

export const Tip3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const typeAt = at('tip3', 'termina');
  const fileAt = at('tip3', 'CLAUDE.md');
  const ruleAt = at('tip3', 'Así');
  const term = pop(frame, fps, 0.3, 14);
  const file = pop(frame, fps, fileAt, 12);
  const rule = pop(frame, fps, ruleAt, 10);
  return (
    <Shell id="tip3" accent={C.blue}>
      <TipHeader n={3} title="Aprende de ti" accent={C.blue} />
      <div style={{position: 'absolute', top: 580, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: term, translate: `0px ${interpolate(term, [0, 1], [80, 0])}px`}}>
        <Terminal width={920} glow={C.blue}>
          <div style={{fontSize: 36}}>
            <span style={{color: C.blue}}>&gt; </span>
            <Typed text="Actualiza tu CLAUDE.md para no repetir este error" startSec={typeAt} cps={30} />
          </div>
        </Terminal>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 880,
          left: 120,
          right: 120,
          borderRadius: 28,
          background: '#11151c',
          border: `2px solid ${C.blue}55`,
          boxShadow: `0 40px 100px rgba(0,0,0,0.55), 0 0 70px ${C.blue}22`,
          padding: '28px 36px',
          fontFamily: mono,
          fontSize: 34,
          lineHeight: 1.6,
          color: C.text,
          opacity: file,
          scale: String(interpolate(file, [0, 1], [0.8, 1])),
          rotate: `${interpolate(file, [0, 1], [6, -1.5])}deg`,
        }}
      >
        <div style={{color: C.blue, fontWeight: 700, marginBottom: 6}}>📄 CLAUDE.md</div>
        <div style={{color: C.dim}}># Reglas del proyecto</div>
        <div style={{color: C.dim}}>- Usa pnpm, nunca npm</div>
        <div
          style={{
            background: `${C.green}22`,
            borderLeft: `6px solid ${C.green}`,
            margin: '4px -36px 0',
            padding: '2px 30px',
            color: C.green,
            opacity: rule,
            translate: `${interpolate(rule, [0, 1], [-60, 0])}px 0px`,
          }}
        >
          + Corre los tests antes de cada commit
        </div>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="pop" atSec={fileAt} volume={0.5} />
      <Sfx src="ding" atSec={ruleAt} volume={0.3} />
    </Shell>
  );
};
