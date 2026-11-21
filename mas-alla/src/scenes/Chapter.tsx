import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Facts} from '../components/Facts';
import {Journey} from '../components/Journey';
import {Subtitles} from '../components/Subtitles';
import {WarpJump} from '../components/Warp';
import {STOPS, fmtLy, stopIndex} from '../stops';
import {C, chapter, display, mono, sans} from '../theme';
import {Andromeda} from '../visuals/Andromeda';
import {BlackHoleScene} from '../visuals/BlackHoleScene';
import {Giants} from '../visuals/Giants';
import {Heliosphere} from '../visuals/Heliosphere';
import {MilkyWay} from '../visuals/MilkyWay';
import {Nebula} from '../visuals/Nebula';
import {Neutron} from '../visuals/Neutron';
import {Proxima} from '../visuals/Proxima';
import {Supernova} from '../visuals/Supernova';
import {Universe} from '../visuals/Universe';
import {VisualProps} from '../visuals/common';

const VISUALS: Record<string, React.FC<VisualProps>> = {
  heliosphere: Heliosphere,
  proxima: Proxima,
  nebula: Nebula,
  giants: Giants,
  supernova: Supernova,
  neutron: Neutron,
  blackhole: BlackHoleScene,
  milkyway: MilkyWay,
  andromeda: Andromeda,
  universe: Universe,
};

export const Chapter: React.FC<{id: string}> = ({id}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const ch = chapter(id);
  const idx = stopIndex(id);
  const b = STOPS[idx];
  const prev = idx > 0 ? STOPS[idx - 1].ly : 1.58e-5; // 1 UA
  const t = frame / fps;
  const lead = ch.lead;
  const enter = 0.002 + 0.998 * spring({frame: frame - (lead - 0.5) * fps, fps, config: {damping: 200}, durationInFrames: 2.2 * fps});
  const ui = spring({frame: frame - lead * fps, fps, config: {damping: 18}});
  const out = interpolate(frame, [durationInFrames - 0.6 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const Visual = VISUALS[id];
  return (
    <AbsoluteFill>
      <Background accent={b.accent} />
      <AbsoluteFill style={{opacity: out}}>{t >= lead && <Visual ch={ch} t={t} frame={frame} enter={enter} width={width} height={height} fps={fps} />}</AbsoluteFill>
      {/* degradado lateral para la legibilidad del texto */}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(2,3,10,0.78) 0%, rgba(2,3,10,0.35) 38%, rgba(2,3,10,0) 55%)', opacity: ui * out}} />
      <div style={{position: 'absolute', left: 140, top: 150, opacity: ui * out, translate: `${interpolate(ui, [0, 1], [-60, 0])}px 0px`}}>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 26, letterSpacing: 8, color: b.accent}}>PARADA {String(idx + 1).padStart(2, '0')}</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: b.name.length > 13 ? 118 : 140, lineHeight: 0.95, letterSpacing: -5, color: C.text, marginTop: 8, whiteSpace: 'nowrap'}}>{b.name}</div>
        <div style={{fontFamily: sans, fontWeight: 400, fontSize: 38, color: C.dim, marginTop: 12}}>{b.subtitle}</div>
      </div>
      <div style={{opacity: out}}>
        <Facts phrases={ch.phrases} accent={b.accent} top={440} />
      </div>
      <Journey current={idx} accent={b.accent} opacity={ui * out} />
      {t < lead + 0.1 && (
        <AbsoluteFill style={{background: C.bg, opacity: interpolate(t, [lead - 0.45, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <Background accent={b.accent} drift={3} />
          <WarpJump endSec={lead} no={idx + 1} name={b.name} where={b.where} accent={b.accent} fromLy={prev} toLy={b.ly} fmt={fmtLy} />
        </AbsoluteFill>
      )}
      <Subtitles phrases={ch.phrases} />
      <Audio name={`Voz ${id}`} src={staticFile(`audio/${id}.wav`)} />
      <Audio name="Whoosh" src={staticFile('audio/whoosh.wav')} volume={0.4} />
      <Audio name="Llegada" src={staticFile('audio/riser.wav')} from={Math.round((lead - 1.5) * fps)} volume={0.18} />
      {ch.phrases
        .filter((p) => p.callout)
        .map((p) => (
          <Audio key={p.start} name="Pop dato" src={staticFile('audio/pop.wav')} from={Math.round((p.start - 0.1) * fps)} volume={0.16} />
        ))}
    </AbsoluteFill>
  );
};
