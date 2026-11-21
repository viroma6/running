import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Background} from './components/Background';
import {body} from './planets';
import {display} from './theme';
import {PlanetMesh} from './three/PlanetMesh';
import {useTextures} from './three/useTex';

/** Miniatura 1280×720 */
export const Thumbnail: React.FC = () => {
  const {width, height} = useVideoConfig();
  const tex = useTextures(['saturn.jpg', 'earth.jpg']);
  return (
    <AbsoluteFill>
      <Background accent="#ff9f2e" />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.9, 6.2], fov: 38}}>
        <ambientLight intensity={0.05} />
        <directionalLight position={[-6, 1.5, 3]} intensity={3.4} color="#fff4e6" />
        {tex && <PlanetMesh b={body('saturn')} tex={tex['saturn.jpg']} rotation={1.6} position={[1.25, -0.1, 0]} scale={1.2} />}
      </ThreeCanvas>
      <div style={{position: 'absolute', left: 60, top: 70, fontFamily: display, fontWeight: 800, fontSize: 118, lineHeight: 0.9, letterSpacing: -4, color: '#fff', textShadow: '0 6px 0 rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.8)'}}>
        TODO EL
        <br />
        <span style={{color: '#FFB347'}}>SISTEMA</span>
        <br />
        SOLAR
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 70, fontFamily: display, fontWeight: 800, fontSize: 54, color: '#111', background: '#FFB347', padding: '6px 22px', borderRadius: 14, rotate: '-2deg'}}>en 8 minutos</div>
    </AbsoluteFill>
  );
};
