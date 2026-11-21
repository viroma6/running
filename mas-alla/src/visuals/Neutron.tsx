import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import * as THREE from 'three';
import {C, mono} from '../theme';
import {Glow, SoftPoints, Star} from '../three/Stars';
import {Cam, Polyline, V3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';
import {placeRemnant, useRemnant} from './Supernova';

const NS: V3 = [1.9, 0, 0];
const MAG_TILT = 0.62; // eje magnético respecto al de giro (rad)

/** Haz: cono abierto aditivo que se desvanece con la distancia */
const beamVert = /* glsl */ `
varying float vL; varying vec3 vN; varying vec3 vV;
void main(){ vL = (position.y + 3.5) / 7.0; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const beamFrag = /* glsl */ `
uniform vec3 color; uniform float strength; varying float vL; varying vec3 vN; varying vec3 vV;
void main(){ float core = pow(abs(dot(vN, vV)), 1.5); float a = pow(1.0 - vL, 1.2) * core * strength * 1.7; gl_FragColor = vec4(color * a, 1.0); }`;
const Beam: React.FC<{dir: 1 | -1; strength: number}> = ({dir, strength}) => {
  const u = useMemo(() => ({color: {value: new THREE.Color('#bcd8ff')}, strength: {value: 1}}), []);
  u.strength.value = strength;
  return (
    <mesh position={[0, dir * 3.6, 0]} rotation={[dir === 1 ? Math.PI : 0, 0, 0]}>
      <coneGeometry args={[0.75, 7, 48, 1, true]} />
      <shaderMaterial vertexShader={beamVert} fragmentShader={beamFrag} uniforms={u} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Líneas de campo dipolar r = L·sin²θ alrededor del eje magnético (y local) */
const FIELD: V3[][] = (() => {
  const lines: V3[][] = [];
  for (const L of [1.1, 1.8, 2.8])
    for (let k = 0; k < 6; k++) {
      const ph = (k / 6) * Math.PI * 2 + L;
      const pts: V3[] = [];
      for (let i = 1; i < 80; i++) {
        const th = (i / 80) * Math.PI;
        const r = L * Math.sin(th) ** 2;
        if (r < 0.2) continue;
        pts.push([r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)]);
      }
      lines.push(pts);
    }
  return lines;
})();

/** Gráfica de pulsos de radio, como la de Jocelyn Bell (1967) */
const PulseChart: React.FC<{t: number; o: number}> = ({t, o}) => {
  const W = 700;
  const Hh = 150;
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 3) {
    const tt = t * 1.2 + x / 140;
    const ph = (tt / 1.337) % 1;
    const spike = Math.exp(-(((ph - 0.5) * 40) ** 2)) * 0.9;
    const noise = Math.sin(x * 1.7 + t * 30) * 0.05 + Math.sin(x * 0.37 + t * 9) * 0.04;
    pts.push(`${x},${Hh - 20 - (spike + noise + 0.08) * (Hh - 40)}`);
  }
  return (
    <div style={{position: 'absolute', right: 160, top: 660, width: W, padding: '18px 22px', borderRadius: 20, background: 'rgba(240,234,214,0.92)', opacity: o, translate: `0px ${(1 - o) * 30}px`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
      <div style={{fontFamily: mono, fontSize: 18, color: '#5a4a3a', letterSpacing: 2}}>CP 1919 · PERIODO 1,337 s · CAMBRIDGE, 1967</div>
      <svg width={W - 44} height={Hh}>
        {Array.from({length: 12}).map((_, i) => (
          <line key={i} x1={i * 60} x2={i * 60} y1={0} y2={Hh} stroke="#b9a98f" strokeWidth={1} />
        ))}
        <polyline points={pts.join(' ')} fill="none" stroke="#c0392b" strokeWidth={2.4} />
      </svg>
    </div>
  );
};

export const Neutron: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const rem = useRemnant();
  useMemo(() => placeRemnant(rem, 5.2), [rem]);
  // velocidad de giro (rev/s visuales): normal → muy rápido con el récord de 716
  const fast = ramp(t, P(ch, 5), P(ch, 5) + 1.5) * (1 - ramp(t, E(ch, 5) + 0.3, E(ch, 5) + 1.3));
  const spinAngle = useMemo(() => {
    // integra la velocidad de giro de forma determinista
    return (tt: number) => {
      let a = 0;
      const dt = 1 / 60;
      for (let x = 0; x < tt; x += dt) {
        const f = ramp(x, P(ch, 5), P(ch, 5) + 1.5) * (1 - ramp(x, E(ch, 5) + 0.3, E(ch, 5) + 1.3));
        a += (0.22 + f * 2.2) * Math.PI * 2 * dt;
      }
      return a;
    };
  }, [ch]);
  const spin = spinAngle(t);
  const beamsIn = ramp(t, P(ch, 3) - 0.4, P(ch, 3) + 0.8);
  // destello cuando el haz apunta a la cámara (aprox.)
  const beamDir = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(0, 0, MAG_TILT)).applyEuler(new THREE.Euler(0, spin, 0)).applyEuler(new THREE.Euler(0.38, 0, 0));
  const toCam = new THREE.Vector3(-1.5, 0.6, 9).normalize();
  const flash = Math.max(Math.max(0, beamDir.dot(toCam)), Math.max(0, -beamDir.dot(toCam))) ** 24 * beamsIn;
  const camPos: V3 = [0.4, 0.7, 9.4 - t * 0.02];
  const look: V3 = [0.8, 0, 0];
  const fov = 40;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <group position={NS} rotation={[0.2, t * 0.03, 0.1]}>
          <SoftPoints data={rem.data} scale={height * 0.5} opacity={0.32 * enter} />
        </group>
        <group position={NS} rotation={[0.38, 0, 0]}>
          <group rotation={[0, spin, 0]}>
            <group rotation={[0, 0, MAG_TILT]}>
              <Beam dir={1} strength={beamsIn * (1 - fast * 0.45)} />
              <Beam dir={-1} strength={beamsIn * (1 - fast * 0.45)} />
              {FIELD.map((pts, i) => (
                <Polyline key={i} points={pts} color="#8EC5FF" opacity={0.28 * enter} />
              ))}
            </group>
          </group>
          <Glow color="#9cc8ff" size={2.6 * enter} opacity={0.9} />
          <Glow color="#ffffff" size={0.9 * enter} />
          <Star time={t * 3} colors={{dark: '#4d7fd6', mid: '#cfe2ff', hot: '#ffffff'}} cells={4} bright={1.4} scale={0.32 * enter} segments={64} />
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 70% 50%, #d8e8ff 0%, #d8e8ff00 60%)', opacity: flash * 0.55, mixBlendMode: 'screen'}} />
      <PulseChart t={t} o={win(t, P(ch, 6) - 0.2, ch.duration + 1, 0.6)} />
      <div style={{position: 'absolute', right: 170, top: 200, opacity: win(t, P(ch, 4) - 0.2, E(ch, 5) + 0.6, 0.5), fontFamily: mono, fontSize: 64, fontWeight: 700, color: '#bcd8ff', textAlign: 'right', textShadow: '0 0 30px #4d7fd6'}}>
        {Math.round(interpolate(t, [P(ch, 4), P(ch, 4) + 0.6, P(ch, 5), P(ch, 5) + 1.8], [0, 30, 30, 716], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
        <span style={{fontSize: 26, color: C.dim}}> rev/s</span>
      </div>
    </AbsoluteFill>
  );
};
