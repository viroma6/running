import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Subtitles} from '../components/Subtitles';
import {Streaks} from '../components/Warp';
import {C, chapter, display, mono} from '../theme';

const PLANETS = ['#C9B8A6', '#F5C97A', '#5CB8FF', '#FF7A50', '#E8B98A', '#F2D9A0', '#8FE3E8', '#5B8CFF'];
const CX = 960;
const CY = 540;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const ch = chapter('intro');
  const t = frame / fps;
  const P = (i: number) => ch.phrases[i].start;
  const titleAt = P(4) + 1.6;
  // 1) recordatorio del capítulo 1: el sistema solar girando
  // 2) "un grano de arena": se encoge hasta un punto
  const shrink = interpolate(t, [P(1) + 0.3, P(2) + 1.5], [1, 0.012], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const sysO = interpolate(t, [0, 0.8, P(3), P(3) + 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // 3) salto al hiperespacio
  const warp = interpolate(t, [P(3) + 0.5, titleAt - 0.3, titleAt + 0.4, ch.duration], [0, 1, 0.35, 0.1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const travel = interpolate(t, [P(3), ch.duration], [0, 9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const title = spring({frame: frame - titleAt * fps, fps, config: {damping: 14}});
  const tag = interpolate(t, [0.3, 1, P(1) - 0.2, P(1) + 0.4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [durationInFrames - 0.5 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const flash = titleAt > 0 ? Math.exp(-Math.max(0, t - titleAt) * 4) * (t > titleAt ? 1 : 0) : 0;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Background drift={1 + warp * 6} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: sysO}}>
        <g transform={`translate(${CX} ${CY}) scale(${shrink}) translate(${-CX} ${-CY})`}>
          {PLANETS.map((c, i) => {
            const r = 90 + i * 52;
            const a = t * (0.9 / Math.sqrt((i + 1) ** 3)) + i * 1.3;
            return (
              <g key={i}>
                <ellipse cx={CX} cy={CY} rx={r} ry={r * 0.36} fill="none" stroke="rgba(190,210,255,0.2)" strokeWidth={1.5 / Math.max(shrink, 0.05)} />
                <circle cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r * 0.36} r={i === 4 ? 14 : i === 5 ? 12 : 7} fill={c} style={{filter: `drop-shadow(0 0 10px ${c})`}} />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={34} fill="#FFB347" style={{filter: 'drop-shadow(0 0 40px #ff9f2e)'}} />
        </g>
        <circle cx={CX} cy={CY} r={interpolate(shrink, [0.012, 0.2], [5, 0], {extrapolateRight: 'clamp'})} fill="#FFD58A" style={{filter: 'drop-shadow(0 0 12px #ffb347)'}} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', opacity: tag, fontFamily: mono, fontSize: 28, letterSpacing: 10, color: '#FFB347'}}>EN EL CAPÍTULO 1…</div>
      {/* avance del capítulo */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', gap: 30}}>
        {[
          ['ESTRELLAS GIGANTES', '#FF8A3D', P(2) + 1.6],
          ['SUPERNOVAS', '#FFD166', P(2) + 3.0],
          ['AGUJEROS NEGROS', '#FFA94D', P(2) + 4.6],
          ['GALAXIAS', '#C4B5FD', P(3) + 0.4],
        ].map(([l, c, at]) => {
          const k = spring({frame: frame - (at as number) * fps, fps, config: {damping: 14}});
          const gone = interpolate(t, [P(3) + 1.6, P(3) + 2.4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={l as string} style={{fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: c as string, padding: '14px 26px', borderRadius: 16, border: `2px solid ${c}88`, background: 'rgba(6,8,20,0.7)', opacity: k * gone, translate: `0px ${(1 - k) * 30}px`, boxShadow: `0 0 30px ${c}33`}}>
              {l as string}
            </div>
          );
        })}
      </div>
      <Streaks speed={warp} travel={travel} tint="#a78bfa" opacity={Math.min(1, warp * 2)} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.8}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: title}}>
        <div style={{fontFamily: mono, fontSize: 34, letterSpacing: 14, color: '#A78BFA'}}>CAPÍTULO 2</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 176, lineHeight: 0.92, letterSpacing: -7, color: C.text, textAlign: 'center', scale: String(interpolate(title, [0, 1], [1.3, 1])), textShadow: '0 0 80px rgba(150,120,255,0.55)'}}>
          MÁS ALLÁ DEL
          <br />
          SISTEMA SOLAR
        </div>
        <div style={{fontFamily: mono, fontSize: 28, letterSpacing: 8, color: C.dim, marginTop: 26}}>DE LA HELIOPAUSA AL BORDE DEL UNIVERSO</div>
      </AbsoluteFill>
      <Subtitles phrases={ch.phrases} />
      <Audio name="Voz intro" src={staticFile('audio/intro.wav')} />
      <Audio name="Whoosh salto" src={staticFile('audio/whoosh.wav')} from={Math.round((P(3) + 0.5) * fps)} volume={0.5} />
      <Audio name="Riser" src={staticFile('audio/riser.wav')} from={Math.round((titleAt - 1.3) * fps)} volume={0.35} />
      <Audio name="Impacto título" src={staticFile('audio/impact.wav')} from={Math.round(titleAt * fps)} volume={0.6} />
    </AbsoluteFill>
  );
};
