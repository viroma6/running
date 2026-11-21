import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import * as THREE from 'three';
import {C, mono} from '../theme';
import {Glow, PointData, SoftPoints, gauss, hex, rng} from '../three/Stars';
import {Cam, Polyline, V3, lerp3, project} from '../three/util';
import {P, VisualProps, ramp, win} from './common';

export type GalaxyOpts = {n: number; R: number; arms: number; pitch: number; seed: number; core: string; arm: string; old: string; pink: string; spread?: number; bar?: number};

/** Galaxia espiral procedimental: bulbo + brazos logarítmicos + disco viejo + nebulosas rosas */
export const makeGalaxy = (o: GalaxyOpts): PointData => {
  const r = rng(o.seed);
  const d: PointData = {positions: new Float32Array(o.n * 3), colors: new Float32Array(o.n * 3), sizes: new Float32Array(o.n)};
  const core = hex(o.core);
  const arm = hex(o.arm);
  const old = hex(o.old);
  const pink = hex(o.pink);
  const k = 1 / Math.tan(o.pitch);
  for (let i = 0; i < o.n; i++) {
    const u = r();
    let p: V3;
    let c: readonly number[];
    let s: number;
    if (u < 0.16) {
      // bulbo (+ barra)
      const bar = o.bar ?? 0;
      const rr = Math.abs(gauss(r)) * o.R * 0.11;
      const a = r() * Math.PI * 2;
      p = [Math.cos(a) * rr * (1 + bar), gauss(r) * o.R * 0.05, Math.sin(a) * rr];
      c = core;
      s = 40 + r() * 50;
    } else if (u < 0.78) {
      // brazos espirales
      const rr = o.R * (0.12 + r() ** 0.9 * 0.88);
      const armI = Math.floor(r() * o.arms);
      const th = (armI / o.arms) * Math.PI * 2 + Math.log(rr / (o.R * 0.12)) * k;
      const sp = (o.spread ?? 0.32) * (0.35 + rr / o.R);
      const a = th + gauss(r) * sp * 0.6;
      const rad = rr + gauss(r) * o.R * 0.025;
      p = [Math.cos(a) * rad, gauss(r) * o.R * 0.012 * (1.4 - rr / o.R), Math.sin(a) * rad];
      const hot = r();
      c = hot < 0.035 ? pink : hot < 0.65 ? arm : old;
      s = hot < 0.035 ? 40 + r() * 40 : 22 + r() ** 3 * 50;
    } else {
      // disco difuso
      const rr = o.R * Math.abs(gauss(r)) * 0.45;
      const a = r() * Math.PI * 2;
      p = [Math.cos(a) * rr, gauss(r) * o.R * 0.015, Math.sin(a) * rr];
      c = old;
      s = 20 + r() * 26;
    }
    const b = 0.45 + r() * 0.55;
    d.positions.set(p, i * 3);
    d.colors.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    d.sizes[i] = s;
  }
  return d;
};

export const MW_OPTS: GalaxyOpts = {n: 70000, R: 5, arms: 4, pitch: 0.24, seed: 99, core: '#ffd9a0', arm: '#bcd4ff', old: '#ffe8c8', pink: '#ff7ab6', bar: 0.9};
const SUN_R = 5 * 0.52;
const SUN_A = 2.25;

export const MilkyWay: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const gal = useMemo(() => makeGalaxy(MW_OPTS), []);
  const rot = -t * 0.025;
  // cámara: inclinada desde arriba → vista de canto desde dentro (franja en el cielo)
  const edge = ramp(t, P(ch, 7) - 0.3, P(ch, 7) + 3.2, Easing.inOut(Easing.cubic));
  const k = ramp(t, 0, P(ch, 7), Easing.inOut(Easing.sin));
  const camFar: V3 = lerp3([-1.2, 9.5, 8.5], [-0.6, 6.2, 9.2], k);
  const sunNow = new THREE.Vector3(Math.cos(SUN_A) * SUN_R, 0, Math.sin(SUN_A) * SUN_R).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  const GC: V3 = [1.8, -0.2, 0];
  const sunW: V3 = [GC[0] + sunNow.x, GC[1] + sunNow.y, GC[2] + sunNow.z];
  const camIn: V3 = [GC[0] - 1.2, GC[1] + 0.45, GC[2] + 11.5];
  const camPos = lerp3(camFar, camIn, edge);
  const look = lerp3([0.4, -0.4, 0], GC, edge);
  const fov = 42;
  const sun = project(camPos, look, fov, width, height, sunW);
  const sunO = win(t, P(ch, 3) - 0.2, P(ch, 7) - 0.2, 0.6);
  const orbitO = win(t, P(ch, 4) - 0.2, P(ch, 7) - 0.2, 0.6);
  const orbitPts: V3[] = Array.from({length: 200}, (_, i) => [Math.cos((i / 200) * Math.PI * 2) * SUN_R, 0, Math.sin((i / 200) * Math.PI * 2) * SUN_R]);
  const pulse = 1 + 0.25 * Math.sin(t * 4);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos, far: 400, near: 0.01}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <group position={GC} rotation={[0, rot, 0]}>
          <SoftPoints data={gal} scale={height * 0.5} opacity={0.95 * enter} time={t} twinkle={0.12} />
          <Glow color="#ffcf8a" size={3.4 * enter} opacity={0.55} />
          <Glow color="#fff1d6" size={1.2 * enter} opacity={0.8} />
          <Polyline points={orbitPts} color="#ffe08a" opacity={0.5 * orbitO} loop />
        </group>
        <Glow color="#ffe08a" size={0.5 * pulse * sunO} position={sunW} />
      </ThreeCanvas>
      {sun.visible && (
        <div style={{position: 'absolute', left: sun.x - 30, top: sun.y - 30, width: 60, height: 60, borderRadius: '50%', border: '3px solid #ffe08a', opacity: sunO, scale: String(pulse)}} />
      )}
      {sun.visible && (
        <div style={{position: 'absolute', left: sun.x + 46, top: sun.y - 22, opacity: sunO, fontFamily: mono, fontSize: 24, letterSpacing: 4, color: '#ffe08a', textShadow: '0 0 12px #000'}}>
          ESTÁS AQUÍ
          <div style={{fontSize: 18, color: C.dim, letterSpacing: 2}}>BRAZO DE ORIÓN</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
