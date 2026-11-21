import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono, sans} from '../theme';

const CARDS = [
  {n: 1, e: '🪐', t: 'Venus', c: C.orangeHi},
  {n: 2, e: '☀️', t: 'El Sol', c: '#ff8a3d'},
  {n: 3, e: '💫', t: 'Neutrones', c: C.cyan},
  {n: 4, e: '🌕', t: 'La Luna', c: '#cbd5e1'},
];

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const comAt = at('cta', 'comentarios');
  const sigAt = at('cta', 'sígueme');
  const tapAt = sigAt + 0.6;
  const q = pop(frame, fps, 0.05, 11);
  const bubble = pop(frame, fps, comAt - 0.1, 10);
  const btn = pop(frame, fps, sigAt - 0.15, 11);
  const tapped = t >= tapAt;
  const tapPop = pop(frame, fps, tapAt, 8);
  const ring = (t % 1.1) / 1.1;
  const hand = interpolate(frame, [(tapAt - 0.5) * fps, (tapAt - 0.05) * fps], [260, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Shell id="cta" captionsTop={1400} accent={C.violet}>
      <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: q}}>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: C.violet, padding: '12px 28px', border: `2px solid ${C.violet}66`, borderRadius: 99, background: `${C.violet}14`}}>
          UNIVERSO EN 1 MINUTO
        </div>
      </div>
      <div style={{position: 'absolute', top: 270, left: 0, right: 0, textAlign: 'center', fontFamily: display, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: -4, color: C.text, opacity: q, translate: `0px ${interpolate(q, [0, 1], [60, 0])}px`}}>
        ¿Cuál te voló
        <br />
        la cabeza? 🤯
      </div>
      <div style={{position: 'absolute', top: 560, left: 110, right: 110, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
        {CARDS.map((c, i) => {
          const p = pop(frame, fps, 0.4 + i * 0.15, 11);
          return (
            <div
              key={c.n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '24px 26px',
                borderRadius: 28,
                background: C.panel2,
                border: `2px solid ${c.c}55`,
                boxShadow: `0 0 40px ${c.c}22`,
                opacity: p,
                scale: String(interpolate(p, [0, 1], [0.5, 1])),
              }}
            >
              <span style={{fontFamily: mono, fontWeight: 700, fontSize: 40, color: c.c}}>{c.n}</span>
              <span style={{fontSize: 56}}>{c.e}</span>
              <span style={{fontFamily: sans, fontWeight: 800, fontSize: 40, color: C.text}}>{c.t}</span>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 920, left: 150, opacity: bubble, scale: String(interpolate(bubble, [0, 1], [0.3, 1])), transformOrigin: 'left bottom'}}>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 44, color: '#14102b', background: C.violet, padding: '20px 34px', borderRadius: '36px 36px 36px 8px', boxShadow: `0 0 50px ${C.violet}88`}}>💬 ¡La 3! ¿Cómo es posible?</div>
      </div>
      <div style={{position: 'absolute', top: 1100, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', opacity: btn, scale: String(interpolate(btn, [0, 1], [0.4, 1]) * (tapped ? interpolate(tapPop, [0, 1], [0.9, 1]) : 1))}}>
          {!tapped && <div style={{position: 'absolute', inset: 0, borderRadius: 99, border: `5px solid ${C.orange}`, scale: String(1 + ring * 0.35), opacity: 1 - ring}} />}
          <div
            style={{
              fontFamily: sans,
              fontWeight: 900,
              fontSize: 64,
              padding: '30px 84px',
              borderRadius: 99,
              background: tapped ? C.panel2 : C.orange,
              color: tapped ? C.text : '#1a1205',
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
      {CARDS.map((c, i) => (
        <Sfx key={c.n} src="pop" atSec={0.4 + i * 0.15} volume={0.35} />
      ))}
      <Sfx src="pop" atSec={comAt - 0.1} volume={0.5} />
      <Sfx src="click" atSec={tapAt} volume={0.9} />
      <Sfx src="ding" atSec={tapAt + 0.05} volume={0.45} />
    </Shell>
  );
};
