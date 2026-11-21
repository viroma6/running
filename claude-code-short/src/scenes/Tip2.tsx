import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {Badge, Terminal, TipHeader, Typed} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at} from '../theme';

const TESTS = ['login funciona', 'API responde 200', 'UI sin errores (navegador)'];

export const Tip2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = at('tip2', 'Dale');
  const testsAt = at('tip2', 'tests');
  const anth = at('tip2', 'Anthropic');
  const term = pop(frame, fps, 0.3, 14);
  const badge = pop(frame, fps, anth, 8);
  const passed = pop(frame, fps, testsAt + 1.3, 12);
  return (
    <Shell id="tip2" accent={C.green}>
      <TipHeader n={2} title="Que se verifique" accent={C.green} />
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: term, translate: `0px ${interpolate(term, [0, 1], [80, 0])}px`}}>
        <Terminal width={920} glow={C.green}>
          <div>
            <span style={{color: C.green}}>$ </span>
            <Typed text="npm test" startSec={start} cps={14} cursor={false} />
          </div>
          {TESTS.map((s, i) => {
            const p = pop(frame, fps, testsAt + i * 0.4, 13);
            return (
              <div key={s} style={{opacity: p, scale: String(interpolate(p, [0, 1], [0.9, 1])), transformOrigin: 'left center'}}>
                <span style={{color: C.green}}>✓</span> {s}
              </div>
            );
          })}
          <div style={{marginTop: 14, opacity: passed, color: C.green, fontWeight: 700}}>
            Tests: <span style={{background: C.green, color: '#062b14', padding: '2px 14px', borderRadius: 8}}>12 passed</span>
          </div>
        </Terminal>
      </div>
      <div style={{position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Badge color={C.yellow} style={{opacity: badge, scale: String(interpolate(badge, [0, 1], [2.4, 1])), rotate: `${interpolate(badge, [0, 1], [-12, -3])}deg`, fontSize: 46}}>
          ★ El truco nº1 según Anthropic
        </Badge>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} src="pop" atSec={testsAt + i * 0.4} volume={0.4} />
      ))}
      <Sfx src="ding" atSec={testsAt + 1.3} volume={0.35} />
      <Sfx src="impact" atSec={anth} volume={0.6} />
    </Shell>
  );
};
