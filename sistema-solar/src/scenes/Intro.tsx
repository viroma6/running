import {useThree} from '@react-three/fiber';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Subtitles} from '../components/Subtitles';
import {body} from '../planets';
import {C, chapter, display, mono} from '../theme';
import {PlanetMesh} from '../three/PlanetMesh';
import {useTextures} from '../three/useTex';

const LINEUP: [string, number][] = [
  ['mercury', 0.38],
  ['venus', 0.7],
  ['earth', 0.74],
  ['mars', 0.5],
  ['jupiter', 1.7],
  ['saturn', 1.3],
  ['uranus', 1.0],
  ['neptune', 0.95],
];
const GAP = 4.2;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const ch = chapter('intro');
  const t = frame / fps;
  const tex = useTextures(LINEUP.map(([id]) => body(id).tex));
  const titleAt = ch.phrases[ch.phrases.length - 1].start;
  const endX = (LINEUP.length - 1) * GAP + 2;
  const camX = interpolate(t, [0, titleAt + 1.5], [-3, endX], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const warp = interpolate(t, [titleAt, ch.duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const title = spring({frame: frame - titleAt * fps, fps, config: {damping: 14}});
  const out = interpolate(frame, [durationInFrames - 0.5 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill>
      <Background drift={1 + warp * 30} />
      <AbsoluteFill style={{opacity: out * (1 - warp * 0.6)}}>
        <ThreeCanvas width={width} height={height} camera={{position: [-3, 0.6, 7], fov: 40}}>
          <CameraRig x={camX} />
          <ambientLight intensity={0.06} />
          <directionalLight position={[-20, 2, 6]} intensity={3.2} color="#fff4e6" />
          {tex && LINEUP.map(([id, s], i) => (
            <PlanetMesh key={id} b={body(id)} tex={tex[body(id).tex]} rotation={frame * body(id).spin * 1.5 + i} position={[i * GAP, Math.sin(i * 1.7) * 0.5, -Math.abs(Math.cos(i)) * 1.5]} scale={s} />
          ))}
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: title * out}}>
        <div style={{fontFamily: mono, fontSize: 34, letterSpacing: 14, color: '#FFB347', opacity: title}}>UN VIAJE DE 6.000 MILLONES DE KM</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 190, lineHeight: 0.92, letterSpacing: -7, color: C.text, textAlign: 'center', scale: String(interpolate(title, [0, 1], [1.3, 1])), textShadow: '0 0 80px rgba(120,150,255,0.45)'}}>
          VIAJE POR EL
          <br />
          SISTEMA SOLAR
        </div>
      </AbsoluteFill>
      <Subtitles phrases={ch.phrases} />
      <Audio name="Voz intro" src={staticFile('audio/intro.wav')} />
      <Audio name="Riser" src={staticFile('audio/riser.wav')} from={Math.round((titleAt - 1.3) * fps)} volume={0.35} />
      <Audio name="Impacto título" src={staticFile('audio/impact.wav')} from={Math.round(titleAt * fps)} volume={0.6} />
    </AbsoluteFill>
  );
};

const CameraRig: React.FC<{x: number}> = ({x}) => {
  const {camera} = useThree();
  camera.position.set(x, 0.6, 7);
  camera.lookAt(x + 1.2, 0, 0);
  return null;
};
