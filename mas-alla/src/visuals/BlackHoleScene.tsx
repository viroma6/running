import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {C, mono} from '../theme';
import {BlackHole} from '../three/BlackHole';
import {V3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';

export const BlackHoleScene: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  // aproximación lenta en órbita; inmersión final (espaguetización)
  const dive = ramp(t, P(ch, 7), ch.duration, Easing.inOut(Easing.cubic));
  const dist = interpolate(t, [0, P(ch, 7)], [34, 19], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}) - dive * 8.5;
  const ang = 0.35 + t * 0.012;
  const elev = interpolate(t, [0, ch.duration], [0.16, 0.07]) + dive * 0.02;
  const camPos: V3 = [Math.sin(ang) * dist, dist * elev, Math.cos(ang) * dist];
  const shift: [number, number] = [interpolate(dive, [0, 1], [0.27, 0.12]), 0.01];
  const horizon = win(t, P(ch, 1) + 0.5, E(ch, 1) + 0.8, 0.5);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={width} height={height} dpr={0.8} gl={{antialias: false}}>
        <BlackHole width={width} height={height} time={t * 1.4} camPos={camPos} shift={shift} fov={42} bright={enter} starFade={1} />
      </ThreeCanvas>
      {/* anotaciones */}
      <div style={{position: 'absolute', left: width * (0.5 + shift[0] * 0.5625) + 40, top: height * 0.5 - 250, opacity: horizon, fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#ffd2a0'}}>
        <div style={{width: 120, height: 2, background: '#ffd2a0', marginBottom: 10, marginLeft: -140, translate: '0 14px'}} />
        HORIZONTE DE SUCESOS
      </div>
      <div style={{position: 'absolute', right: 160, bottom: 200, opacity: win(t, P(ch, 3) + 0.2, E(ch, 4) + 0.5, 0.6), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#ffb36b', textAlign: 'right'}}>
        DISCO DE ACRECIÓN
        <div style={{fontSize: 18, color: C.dim, letterSpacing: 2}}>LA LUZ DE DETRÁS SE CURVA POR ENCIMA Y POR DEBAJO</div>
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 50%, transparent 40%, #000 100%)', opacity: dive * 0.6}} />
    </AbsoluteFill>
  );
};
