import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, mono} from '../theme';
import {Glow, Star} from '../three/Stars';
import {Cam, Polyline, V3, project} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';

const S: V3 = [1.9, 0, 0];
const ORB = 3.1;
const INC = 0.32;
const bPos = (a: number): V3 => [S[0] + Math.cos(a) * ORB, S[1] + Math.sin(a) * ORB * Math.sin(INC) * 0.6, S[2] + Math.sin(a) * ORB * Math.cos(INC)];

export const Proxima: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  // llamaradas en la última frase
  const flareT = P(ch, 7);
  const flare = [0, 1.6, 3.1].reduce((a, o) => a + Math.exp(-Math.max(0, t - flareT - o) * 2.2) * (t > flareT + o ? 1 : 0), 0);
  const camPos: V3 = [0.4 - t * 0.012, 0.5 + t * 0.006, 8.4 - t * 0.03];
  const look: V3 = [0.6, 0, 0];
  const fov = 40;
  const planetIn = ramp(t, P(ch, 6) - 0.5, P(ch, 6) + 1.2);
  const ang = t * 0.35 + 1.0;
  const pb = bPos(ang);
  const pl = project(camPos, look, fov, width, height, pb);
  const behind = Math.sin(ang) < 0;
  const abIn = win(t, P(ch, 5) - 0.3, ch.duration + 2, 0.8);
  const ab = project(camPos, look, fov, width, height, [-2.6, 2.6, -14]);
  const orbitPts: V3[] = Array.from({length: 160}, (_, i) => bPos((i / 160) * Math.PI * 2));
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <ambientLight intensity={0.02} />
        <pointLight position={S} intensity={60} decay={1.6} color="#ff8a5c" />
        {/* Alfa Centauri A y B, lejanas */}
        <Glow color="#fff1c9" size={2.4 * abIn} position={[-2.4, 2.6, -14]} />
        <Glow color="#ffd08a" size={1.6 * abIn} position={[-2.9, 2.45, -14]} />
        <Glow color="#ffffff" size={0.5 * abIn} position={[-2.4, 2.6, -14]} />
        <Glow color="#ff5a30" size={7.5 * enter} opacity={0.55} position={S} />
        <Glow color="#ff3d1f" size={4.4 * enter} opacity={0.6 + flare * 0.4} position={S} />
        <Star time={t} colors={{dark: '#4a0700', mid: '#e0461c', hot: '#ffc08a'}} cells={2.4} spots={0.9} bright={1.15 + flare * 0.5} position={S} scale={1.45 * enter} />
        {flare > 0.01 && <Glow color="#fff0d8" size={2.2 * flare} position={[S[0] - 1.0, S[1] + 1.0, 0.6]} opacity={Math.min(1, flare)} />}
        <Polyline points={orbitPts} color="#ff8a5c" opacity={0.35 * planetIn} loop />
        <mesh position={pb} scale={0.17 * planetIn} renderOrder={behind ? -1 : 2}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color="#9a6a55" roughness={1} />
        </mesh>
      </ThreeCanvas>
      <div style={{position: 'absolute', left: pl.x + 26, top: pl.y - 30, opacity: planetIn, fontFamily: mono, fontSize: 22, letterSpacing: 3, color: '#fff', textShadow: '0 0 10px #000'}}>
        PRÓXIMA b
      </div>
      <div style={{position: 'absolute', left: ab.x + 60, top: ab.y - 20, opacity: abIn, fontFamily: mono, fontSize: 20, letterSpacing: 3, color: C.dim}}>
        ALFA CENTAURI A · B
      </div>
      {/* barra de luz: 4,24 años */}
      <div style={{position: 'absolute', left: 1080, right: 160, top: 860, opacity: win(t, P(ch, 1), E(ch, 2) + 0.6, 0.5)}}>
        <div style={{fontFamily: mono, fontSize: 20, color: C.dim, letterSpacing: 3, marginBottom: 10}}>LA LUZ VIAJANDO DESDE PRÓXIMA</div>
        <div style={{height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 4, position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: -3, height: 10, borderRadius: 6, width: `${interpolate(t, [P(ch, 1), E(ch, 2)], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, background: 'linear-gradient(90deg,#ff6b4a00,#ffd2a8)', boxShadow: '0 0 18px #ffb08a'}} />
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 22, color: '#fff', marginTop: 10}}>
          <span>Próxima</span>
          <span>{interpolate(t, [P(ch, 1), E(ch, 2)], [0, 4.24], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}).toFixed(2).replace('.', ',')} años</span>
          <span>Tierra</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
