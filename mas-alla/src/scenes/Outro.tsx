import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Subtitles} from '../components/Subtitles';
import {C, chapter, display, mono, sans} from '../theme';
import {Glow, SoftPoints} from '../three/Stars';
import {Cam} from '../three/util';
import {MW_OPTS, makeGalaxy} from '../visuals/MilkyWay';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const ch = chapter('outro');
  const t = frame / fps;
  const gal = useMemo(() => makeGalaxy({...MW_OPTS, n: 50000}), []);
  const endAt = ch.phrases[ch.phrases.length - 1].end + 0.4;
  const end = spring({frame: frame - endAt * fps, fps, config: {damping: 200}, durationInFrames: 1.2 * fps});
  const intro = spring({frame, fps, config: {damping: 200}, durationInFrames: 1.5 * fps});
  const fadeOut = interpolate(frame, [durationInFrames - 1.5 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const q = spring({frame: frame - ch.phrases[2].start * fps, fps, config: {damping: 16}});
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Background accent="#A78BFA" />
      <AbsoluteFill style={{opacity: intro * interpolate(end, [0, 1], [1, 0.35])}}>
        <ThreeCanvas width={width} height={height} camera={{fov: 40, position: [0, 7, 9]}}>
          <Cam pos={[0, 7.5 - t * 0.03, 9.5]} look={[0, -0.6, 0]} fov={40} />
          <group rotation={[0, -t * 0.04, 0]}>
            <SoftPoints data={gal} scale={height * 0.5} opacity={0.9} time={t} twinkle={0.15} />
            <Glow color="#ffcf8a" size={3.4} opacity={0.5} />
          </group>
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: q * (1 - end)}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 130, color: C.text, letterSpacing: -4, textShadow: '0 0 60px rgba(0,0,0,0.9)', scale: String(interpolate(q, [0, 1], [1.15, 1]))}}>¿Estamos solos?</div>
      </AbsoluteFill>
      {/* Pantalla final (deja hueco para los elementos de YouTube) */}
      <AbsoluteFill style={{opacity: end}}>
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{fontFamily: mono, fontSize: 30, letterSpacing: 10, color: '#A78BFA'}}>PRÓXIMO · CAPÍTULO 3</div>
          <div style={{fontFamily: display, fontWeight: 800, fontSize: 110, color: C.text, letterSpacing: -3}}>¿Estamos solos?</div>
        </div>
        <div style={{position: 'absolute', left: 230, top: 420, width: 820, height: 461, borderRadius: 24, border: `3px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontSize: 34, color: C.dim, background: 'rgba(2,3,10,0.5)'}}>
          ▶ Ver capítulo 1
        </div>
        <div style={{position: 'absolute', left: 1240, top: 470, width: 360, height: 360, borderRadius: '50%', border: `3px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: 38, color: C.text, textAlign: 'center', background: 'rgba(2,3,10,0.5)'}}>
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
