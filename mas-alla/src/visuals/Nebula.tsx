import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C, mono} from '../theme';
import {Glow, PointData, SoftPoints, gauss, hex, rng} from '../three/Stars';
import {Cam, V3, lerp3, project} from '../three/util';
import {P, VisualProps, ramp, win} from './common';

const mk = (n: number): PointData => ({positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), sizes: new Float32Array(n)});
const mix = (a: readonly number[], b: readonly number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Pilares: [x base, z, altura, anchura base, inclinación] */
const PILLARS: [number, number, number, number, number][] = [
  [0.6, 0, 6.2, 0.95, -0.1],
  [2.55, -0.6, 4.2, 0.75, 0.12],
  [4.1, -1.2, 3.0, 0.6, 0.22],
];
export const TIPS: V3[] = PILLARS.map(([x, z, h, , lean]) => [x + lean * h, -3.6 + h, z]);

const useNebula = () =>
  useMemo(() => {
    const r = rng(7);
    // gas de fondo (emisión): verde-azulado (oxígeno), dorado (azufre/hidrógeno) y magenta
    const nG = 7000;
    const gas = mk(nG);
    const teal = hex('#2dd4bf');
    const gold = hex('#f6b35c');
    const mag = hex('#d946ef');
    for (let i = 0; i < nG; i++) {
      const x = (r() - 0.5) * 22;
      const y = (r() - 0.5) * 14;
      const z = -3 - r() * 7;
      gas.positions.set([x, y, z], i * 3);
      const k = 0.5 + 0.5 * Math.sin(x * 0.35 + y * 0.25 + Math.sin(y * 0.6) * 1.5);
      let c = mix(teal, gold, k);
      if (r() < 0.12) c = mix(c, mag, 0.6);
      const b = 0.35 + r() * 0.65;
      gas.colors.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
      gas.sizes[i] = 1600 + r() * 2600;
    }
    // pilares de polvo (mezcla normal, oscuros con borde iluminado)
    const nP = 14000;
    const dust = mk(nP);
    const dark = hex('#1a0f0a');
    const rim = hex('#e39a55');
    let i = 0;
    for (const [bx, bz, h, w, lean] of PILLARS) {
      const count = Math.round(nP * (h / 13.4));
      for (let k = 0; k < count && i < nP; k++, i++) {
        const u = r() ** 0.85;
        const yy = -3.6 + u * h;
        const width = w * (1 - u * 0.55) * (1 + 0.35 * Math.sin(u * 9 + bx));
        const ox = gauss(r) * width * 0.5;
        const oz = gauss(r) * width * 0.5;
        dust.positions.set([bx + lean * u * h + ox, yy, bz + oz], i * 3);
        // iluminado desde arriba-derecha por estrellas jóvenes
        const lit = Math.max(0, Math.min(1, (ox / width) * 0.8 + u * 0.7 + (u > 0.9 ? 0.4 : 0) + gauss(r) * 0.12));
        const c = mix(dark, rim, Math.max(0, lit - 0.35) ** 2 * 1.6);
        dust.colors.set(c, i * 3);
        dust.sizes[i] = 260 + r() * 320;
      }
    }
    // estrellas jóvenes
    const nS = 420;
    const stars = mk(nS);
    for (let k = 0; k < nS; k++) {
      stars.positions.set([(r() - 0.5) * 20, (r() - 0.5) * 12, -2 - r() * 6], k * 3);
      const c = r() < 0.7 ? hex('#e8f1ff') : hex('#ffd9a8');
      stars.colors.set(c, k * 3);
      stars.sizes[k] = 24 + r() ** 4 * 90;
    }
    return {gas, dust, stars};
  }, []);

export const Nebula: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const {gas, dust, stars} = useNebula();
  // ignición de una protoestrella en la punta del pilar principal
  const ign = P(ch, 2) + 2.2;
  const ignite = ramp(t, ign, ign + 1.2, Easing.out(Easing.cubic));
  const flash = Math.exp(-Math.max(0, t - ign - 0.4) * 1.5) * (t > ign ? 1 : 0);
  const tip = TIPS[0];
  const k = ramp(t, 0, ch.duration, Easing.inOut(Easing.sin));
  const camPos: V3 = lerp3([-1.6, 0.2, 15], [0.4, 1.4, 10.5], k);
  const look: V3 = lerp3([0.6, 0.2, -1], [1.8, 0.6, -1], k);
  const fov = 42;
  const lp = project(camPos, look, fov, width, height, [2.6, 2.4, -0.6]);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos, far: 200}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <group position={[1.4, 0, 0]}>
          <SoftPoints data={gas} scale={height * 0.5} opacity={0.16 * enter} />
          <SoftPoints data={stars} scale={height * 0.5} opacity={enter} time={t} twinkle={0.35} hard={0.2} />
          <SoftPoints data={dust} scale={height * 0.5} opacity={0.62 * enter} additive={false} />
          <Glow color="#ffe7c2" size={2.6 * ignite + flash * 4} position={[tip[0], tip[1] + 0.25, tip[2] + 0.8]} opacity={0.9} />
          <Glow color="#ffffff" size={0.6 * ignite} position={[tip[0], tip[1] + 0.25, tip[2] + 0.8]} />
        </group>
      </ThreeCanvas>
      <div style={{position: 'absolute', left: lp.x + 260, top: lp.y - 120, opacity: win(t, P(ch, 3) + 0.2, P(ch, 5) - 0.2, 0.6), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#f6c79a', textShadow: '0 0 10px #000'}}>
        PILARES DE LA CREACIÓN
        <div style={{fontSize: 18, color: C.dim, letterSpacing: 2}}>NEBULOSA DEL ÁGUILA · M16</div>
      </div>
    </AbsoluteFill>
  );
};
