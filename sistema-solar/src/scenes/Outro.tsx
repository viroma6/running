import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Subtitles} from '../components/Subtitles';
import {BODIES} from '../planets';
import {C, chapter, display, mono, sans} from '../theme';

const CX = 960;
const CY = 540;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const ch = chapter('outro');
  const t = frame / fps;
  const endAt = ch.phrases[ch.phrases.length - 1].end + 0.4;
  const end = spring({frame: frame - endAt * fps, fps, config: {damping: 200}, durationInFrames: 1.2 * fps});
  const intro = spring({frame, fps, config: {damping: 200}, durationInFrames: 1.5 * fps});
  const fadeOut = interpolate(frame, [durationInFrames - 1.5 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Background />
      {/* sistema solar completo girando */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: interpolate(end, [0, 1], [1, 0.25]) * intro, scale: String(interpolate(end, [0, 1], [1, 1.25]))}}>
        {BODIES.map((b, i) => {
          if (i === 0) return null;
          const r = 80 + i * 82;
          const a = t * (0.9 / Math.sqrt(i * i * i)) + i * 1.3;
          return (
            <g key={b.id}>
              <ellipse cx={CX} cy={CY} rx={r} ry={r * 0.36} fill="none" stroke="rgba(190,210,255,0.16)" strokeWidth={1.5} />
              <circle cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r * 0.36} r={i === 5 ? 16 : i === 6 ? 13 : 8} fill={b.accent} style={{filter: `drop-shadow(0 0 10px ${b.accent})`}} />
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={36} fill="#FFB347" style={{filter: 'drop-shadow(0 0 40px #ff9f2e)'}} />
      </svg>
      {/* Pantalla final (end screen de YouTube: deja hueco para los elementos) */}
      <AbsoluteFill style={{opacity: end}}>
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{fontFamily: mono, fontSize: 30, letterSpacing: 10, color: '#FFB347'}}>PRÓXIMO DESTINO</div>
          <div style={{fontFamily: display, fontWeight: 800, fontSize: 110, color: C.text, letterSpacing: -3}}>Agujeros negros</div>
        </div>
        <div style={{position: 'absolute', left: 230, top: 420, width: 820, height: 461, borderRadius: 24, border: `3px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontSize: 34, color: C.dim}}>
          ▶ Ver siguiente vídeo
        </div>
        <div style={{position: 'absolute', left: 1240, top: 470, width: 360, height: 360, borderRadius: '50%', border: `3px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: 38, color: C.text, textAlign: 'center'}}>
          Suscríbete
          <br />🔔
        </div>
      </AbsoluteFill>
      <Subtitles phrases={ch.phrases} />
      <Audio name="Voz outro" src={staticFile('audio/outro.wav')} />
      <Audio name="Ding final" src={staticFile('audio/ding.wav')} from={Math.round(endAt * fps)} volume={0.3} />
    </AbsoluteFill>
  );
};
