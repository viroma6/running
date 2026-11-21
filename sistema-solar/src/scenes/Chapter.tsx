import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Facts} from '../components/Facts';
import {Journey} from '../components/Journey';
import {OrbitMap} from '../components/OrbitMap';
import {Subtitles} from '../components/Subtitles';
import {body} from '../planets';
import {C, chapter, display, mono, sans} from '../theme';
import {Moon, PlanetMesh} from '../three/PlanetMesh';
import {useTextures} from '../three/useTex';

export const Chapter: React.FC<{id: string; no: number}> = ({id, no}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const ch = chapter(id);
  const b = body(id);
  const t = frame / fps;
  const tex = useTextures(id === 'earth' ? [b.tex, 'moon.jpg'] : [b.tex]);
  const lead = ch.lead;
  const enter = spring({frame: frame - (lead - 0.5) * fps, fps, config: {damping: 200}, durationInFrames: 2.2 * fps});
  const ui = spring({frame: frame - lead * fps, fps, config: {damping: 18}});
  const out = interpolate(frame, [durationInFrames - 0.6 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  // cámara: acercamiento lento y leve órbita
  const camZ = interpolate(t, [lead, ch.duration], [b.ring ? 7.2 : 5.2, b.ring ? 6.3 : 4.5], {extrapolateLeft: 'clamp', easing: Easing.inOut(Easing.quad)});
  const camY = interpolate(t, [0, ch.duration], [0.35, -0.15]);
  const planetX = interpolate(enter, [0, 1], [3.6, b.ring ? 1.55 : 1.25]);
  const sizeScale = id === 'sun' ? 1.45 : id === 'mercury' || id === 'beyond' ? 0.9 : 1.15;
  return (
    <AbsoluteFill>
      <Background accent={b.accent} />
      {/* brillo del Sol desde la izquierda (luz de escena) */}
      <div style={{position: 'absolute', left: -500, top: 100, width: 1100, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${id === 'sun' ? '#ff9f2e00' : '#ffcf8a14'} 0%, #ffcf8a00 60%)`}} />
      {id === 'sun' && (
        <div style={{position: 'absolute', left: 1180 - 700, top: 540 - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, #ff9f2e66 0%, #ff6a2a22 35%, #ff6a2a00 60%)', opacity: enter, translate: `${interpolate(enter, [0, 1], [600, 0])}px 0px`}} />
      )}
      <AbsoluteFill style={{opacity: out}}>
        <ThreeCanvas width={width} height={height} camera={{position: [0, camY, camZ], fov: 38}}>
          <ambientLight intensity={0.06} />
          <directionalLight position={[-6, 1.2, 3]} intensity={3.2} color="#fff4e6" />
          {tex && <PlanetMesh b={b} tex={tex[b.tex]} rotation={frame * b.spin + 1.2} position={[planetX, 0, 0]} scale={interpolate(enter, [0, 1], [0.4, sizeScale])} />}
          {id === 'earth' && tex && (
            <group position={[planetX, 0, 0]} scale={interpolate(enter, [0, 1], [0.4, 1])}>
              <Moon tex={tex['moon.jpg']} angle={t * 0.18 + 2.2} radius={2.0} />
            </group>
          )}
        </ThreeCanvas>
      </AbsoluteFill>
      {/* Cabecera del capítulo */}
      <div style={{position: 'absolute', left: 140, top: 150, opacity: ui * out, translate: `${interpolate(ui, [0, 1], [-60, 0])}px 0px`}}>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 26, letterSpacing: 8, color: b.accent}}>CAPÍTULO {String(no).padStart(2, '0')}</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 150, lineHeight: 0.95, letterSpacing: -5, color: C.text, marginTop: 8}}>{b.name}</div>
        <div style={{fontFamily: sans, fontWeight: 400, fontSize: 40, color: C.dim, marginTop: 10}}>{b.subtitle}</div>
      </div>
      <div style={{opacity: out}}>
        <Facts phrases={ch.phrases} accent={b.accent} top={450} />
      </div>
      <Journey current={b.orbit} accent={b.accent} opacity={ui * out} />
      {t < lead + 0.1 && (
        <AbsoluteFill style={{background: C.bg, opacity: interpolate(t, [lead - 0.45, lead], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <Background accent={b.accent} drift={3} />
          <OrbitMap to={b.orbit} endSec={lead} chapterNo={no} />
        </AbsoluteFill>
      )}
      <Subtitles phrases={ch.phrases} />
      <Audio name={`Voz ${id}`} src={staticFile(`audio/${id}.wav`)} />
      <Audio name="Whoosh" src={staticFile('audio/whoosh.wav')} volume={0.35} />
      <Audio name="Llegada" src={staticFile('audio/riser.wav')} from={Math.round((lead - 1.5) * fps)} volume={0.18} />
      {ch.phrases
        .filter((p) => p.callout)
        .map((p) => (
          <Audio key={p.start} name="Pop dato" src={staticFile('audio/pop.wav')} from={Math.round((p.start - 0.1) * fps)} volume={0.16} />
        ))}
    </AbsoluteFill>
  );
};
