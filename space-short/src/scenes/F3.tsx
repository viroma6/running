import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from '../anim';
import {TipHeader} from '../components/Ui';
import {Sfx, Shell} from '../components/Shell';
import {C, at, display, mono} from '../theme';

export const F3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const spoonAt = at('f3', 'cucharadita');
  const weighAt = at('f3', 'pesaría');
  const shipAt = at('f3', '10.000');
  const star = pop(frame, fps, 0.1, 12);
  const spoon = pop(frame, fps, spoonAt, 11);
  const count = ease(frame, [weighAt * fps, (weighAt + 1.6) * fps]);
  const ships = pop(frame, fps, shipAt - 0.1, 10);
  const tons = Math.round(1e9 * count);
  return (
    <Shell id="f3" accent="#3b82f6" shakeAt={[weighAt + 1.6]}>
      <TipHeader n={3} title="Estrella de neutrones" accent={C.cyan} />
      {/* púlsar */}
      <div style={{position: 'absolute', left: 540, top: 720, opacity: star, scale: String(interpolate(star, [0, 1], [0.3, 1]))}}>
        <div style={{position: 'absolute', rotate: `${t * 220}deg`}}>
          {[0, 180].map((r) => (
            <div
              key={r}
              style={{
                position: 'absolute',
                left: -40,
                top: -560,
                width: 80,
                height: 560,
                rotate: `${r}deg`,
                transformOrigin: '50% 100%',
                background: `linear-gradient(0deg, ${C.cyan}cc, ${C.cyan}00)`,
                clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)',
                filter: 'blur(6px)',
              }}
            />
          ))}
        </div>
        <div style={{position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, #ffffff, #bdf3ff 35%, #3bb4ff 70%, #1d4ed8)', boxShadow: `0 0 80px ${C.cyan}, 0 0 200px #3b82f6`}} />
      </div>
      {/* cucharadita */}
      <div style={{position: 'absolute', left: 140, top: 900, opacity: spoon, translate: `${interpolate(spoon, [0, 1], [-300, 0])}px 0px`, rotate: `${interpolate(spoon, [0, 1], [-30, -12])}deg`}}>
        <svg width={800} height={240} viewBox="0 0 800 240">
          <defs>
            <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e5e9f5" />
              <stop offset="1" stopColor="#7b86a3" />
            </linearGradient>
          </defs>
          <rect x={250} y={105} width={540} height={30} rx={15} fill="url(#metal)" />
          <ellipse cx={150} cy={120} rx={140} ry={95} fill="url(#metal)" />
          <ellipse cx={150} cy={112} rx={110} ry={62} fill="#9bdcff" style={{filter: 'drop-shadow(0 0 30px #5CE1FF)'}} />
          <ellipse cx={130} cy={100} rx={60} ry={24} fill="#ffffff" opacity={0.7} />
        </svg>
      </div>
      <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', opacity: interpolate(count, [0, 0.03], [0, 1])}}>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 84, color: C.text, textShadow: `0 0 40px ${C.cyan}`}}>{tons.toLocaleString('es-ES')} t</span>
      </div>
      <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ships, scale: String(interpolate(ships, [0, 1], [2, 1]))}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 58, color: '#06202b', background: C.cyan, padding: '10px 30px', borderRadius: 20, boxShadow: `0 0 50px ${C.cyan}`, rotate: '-3deg'}}>= 10.000 portaaviones 🚢</div>
      </div>
      <Sfx src="whoosh" atSec={0} volume={0.45} />
      <Sfx src="pop" atSec={spoonAt} volume={0.5} />
      <Sfx src="riser" atSec={weighAt + 0.2} volume={0.3} />
      <Sfx src="impact" atSec={weighAt + 1.6} volume={0.8} />
      <Sfx src="pop" atSec={shipAt - 0.1} volume={0.6} />
    </Shell>
  );
};
