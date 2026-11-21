import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {display, mono} from './theme';
import {BlackHole} from './three/BlackHole';

/** Miniatura 1280×720 */
export const Thumbnail: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={width} height={height} gl={{antialias: false}}>
        <BlackHole width={width} height={height} time={3} camPos={[Math.sin(0.5) * 17, 1.7, Math.cos(0.5) * 17]} shift={[0.3, -0.02]} fov={42} bright={1.15} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, transparent 60%)'}} />
      <div style={{position: 'absolute', left: 60, top: 64, fontFamily: display, fontWeight: 800, fontSize: 112, lineHeight: 0.9, letterSpacing: -4, color: '#fff', textShadow: '0 6px 0 rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.8)'}}>
        MÁS ALLÁ
        <br />
        DEL <span style={{color: '#FFA94D'}}>SISTEMA</span>
        <br />
        SOLAR
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 70, fontFamily: display, fontWeight: 800, fontSize: 50, color: '#111', background: '#FFA94D', padding: '6px 22px', borderRadius: 14, rotate: '-2deg'}}>agujeros negros y más</div>
      <div style={{position: 'absolute', right: 40, top: 36, fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: '#fff', background: 'rgba(167,139,250,0.9)', padding: '8px 18px', borderRadius: 10}}>CAP. 2</div>
    </AbsoluteFill>
  );
};
