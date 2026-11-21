import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import * as THREE from 'three';
import {miles} from '../stops';
import {C, display, mono} from '../theme';
import {Glow, PointData, SoftPoints} from '../three/Stars';
import {Cam, V3, lerp3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';
import {MW_OPTS, makeGalaxy} from './MilkyWay';

/**
 * Simulación restringida de tres cuerpos: dos núcleos (potencial de Plummer)
 * que se atraen, y estrellas "de prueba" en órbita circular alrededor de cada uno.
 * Se integra una vez (leapfrog) y se guardan instantáneas.
 */
const SNAPS = 220;
const SIM_GYR = 7; // duración representada (miles de millones de años)
type Sim = {snaps: Float32Array[]; cores: V3[][]; n: number; colors: Float32Array; sizes: Float32Array};
let cache: Sim | null = null;
const simulate = (): Sim => {
  if (cache) return cache;
  const mw = makeGalaxy({...MW_OPTS, n: 9000, R: 1.6, seed: 5});
  const m31 = makeGalaxy({n: 12000, R: 2.1, arms: 2, pitch: 0.2, seed: 31, core: '#ffe2b8', arm: '#cbb8ff', old: '#ffe0d0', pink: '#ff8acb', spread: 0.5});
  const gals = [
    {d: mw, M: 1.0, a: 0.35, pos: new THREE.Vector3(-4.2, -0.6, 0.4), vel: new THREE.Vector3(0.2, 0.03, 0.05), rot: new THREE.Euler(0.5, 0, 0.25)},
    {d: m31, M: 1.3, a: 0.45, pos: new THREE.Vector3(3.3, 0.5, -0.3), vel: new THREE.Vector3(-0.155, -0.025, -0.05), rot: new THREE.Euler(-1.0, 0.4, -0.6)},
  ];
  const n = mw.sizes.length + m31.sizes.length;
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  let o = 0;
  const v = new THREE.Vector3();
  for (const g of gals) {
    const m = g.d.sizes.length;
    for (let i = 0; i < m; i++, o++) {
      v.set(g.d.positions[i * 3], g.d.positions[i * 3 + 1], g.d.positions[i * 3 + 2]);
      const r = Math.hypot(v.x, v.z);
      // velocidad circular en un Plummer con halo
      const vc = Math.sqrt((g.M * r * r) / Math.pow(r * r + g.a * g.a, 1.5)) * 1.0;
      const tv = new THREE.Vector3(-v.z, 0, v.x).normalize().multiplyScalar(vc);
      v.applyEuler(g.rot);
      tv.applyEuler(g.rot);
      pos.set([v.x + g.pos.x, v.y + g.pos.y, v.z + g.pos.z], o * 3);
      vel.set([tv.x + g.vel.x, tv.y + g.vel.y, tv.z + g.vel.z], o * 3);
      colors.set(g.d.colors.subarray(i * 3, i * 3 + 3), o * 3);
      sizes[o] = g.d.sizes[i] * 0.8;
    }
  }
  const cp = gals.map((g) => g.pos.clone());
  const cv = gals.map((g) => g.vel.clone());
  const T = 46;
  const steps = 4400;
  const dt = T / steps;
  const every = Math.floor(steps / SNAPS);
  const snaps: Float32Array[] = [];
  const cores: V3[][] = [];
  const acc = (x: number, y: number, z: number, out: number[]) => {
    out[0] = out[1] = out[2] = 0;
    for (let g = 0; g < 2; g++) {
      const dx = cp[g].x - x;
      const dy = cp[g].y - y;
      const dz = cp[g].z - z;
      const r2 = dx * dx + dy * dy + dz * dz + gals[g].a * gals[g].a;
      const f = gals[g].M / (r2 * Math.sqrt(r2));
      out[0] += dx * f;
      out[1] += dy * f;
      out[2] += dz * f;
    }
  };
  const a = [0, 0, 0];
  for (let s = 0; s <= steps; s++) {
    if (s % every === 0 && snaps.length < SNAPS) {
      snaps.push(pos.slice());
      cores.push(cp.map((c) => [c.x, c.y, c.z] as V3));
    }
    // núcleos (dos cuerpos, con amortiguamiento por fricción dinámica para que se fusionen)
    const d = cp[1].clone().sub(cp[0]);
    const r2 = d.lengthSq() + 0.3;
    const f = 1 / (r2 * Math.sqrt(r2));
    cv[0].addScaledVector(d, f * gals[1].M * dt);
    cv[1].addScaledVector(d, -f * gals[0].M * dt);
    const rel = cv[1].clone().sub(cv[0]);
    const drag = Math.exp(-Math.max(0, 2.5 - d.length()) * 0.9 * dt);
    const cm = cv[0].clone().multiplyScalar(gals[0].M).addScaledVector(cv[1], gals[1].M).multiplyScalar(1 / (gals[0].M + gals[1].M));
    rel.multiplyScalar(drag);
    cv[0].copy(cm).addScaledVector(rel, -gals[1].M / (gals[0].M + gals[1].M));
    cv[1].copy(cm).addScaledVector(rel, gals[0].M / (gals[0].M + gals[1].M));
    cp[0].addScaledVector(cv[0], dt);
    cp[1].addScaledVector(cv[1], dt);
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      acc(pos[j], pos[j + 1], pos[j + 2], a);
      vel[j] += a[0] * dt;
      vel[j + 1] += a[1] * dt;
      vel[j + 2] += a[2] * dt;
      pos[j] += vel[j] * dt;
      pos[j + 1] += vel[j + 1] * dt;
      pos[j + 2] += vel[j + 2] * dt;
    }
  }
  while (snaps.length < SNAPS) {
    snaps.push(snaps[snaps.length - 1]);
    cores.push(cores[cores.length - 1]);
  }
  cache = {snaps, cores, n, colors, sizes};
  return cache;
};

export const Andromeda: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const sim = useMemo(simulate, []);
  const data = useMemo<PointData>(() => ({positions: sim.snaps[0].slice(), colors: sim.colors, sizes: sim.sizes}), [sim]);
  const s0 = P(ch, 5) + 0.6;
  const prog = ramp(t, s0, ch.duration - 0.8, Easing.inOut(Easing.sin));
  const fi = prog * (SNAPS - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(SNAPS - 1, i0 + 1);
  const fr = fi - i0;
  const A = sim.snaps[i0];
  const Bs = sim.snaps[i1];
  for (let i = 0; i < data.positions.length; i++) data.positions[i] = A[i] + (Bs[i] - A[i]) * fr;
  const c0 = sim.cores[i0];
  const c1 = sim.cores[i1];
  const cm: V3 = lerp3(lerp3(c0[0], c1[0], fr), lerp3(c0[1], c1[1], fr), 0.56);
  // cámara: primero Andrómeda de cerca; luego plano amplio siguiendo el centro de masas
  const m31 = sim.cores[0][1];
  const wide = ramp(t, P(ch, 4), s0 + 1.5, Easing.inOut(Easing.cubic));
  const closePos: V3 = [m31[0] - 1.8 - t * 0.02, m31[1] + 1.6, m31[2] + 6.2 - t * 0.03];
  const closeLook: V3 = [m31[0] - 1.6, m31[1], m31[2]];
  const widePos: V3 = [cm[0] - 2.6, cm[1] + 5.5, cm[2] + 13.5 - prog * 2.5];
  const wideLook: V3 = [cm[0] - 1.3, cm[1], cm[2]];
  const camPos = lerp3(closePos, widePos, wide);
  const look = lerp3(closeLook, wideLook, wide);
  const fov = 42;
  const simO = win(t, s0 - 0.2, ch.duration + 2, 0.6);
  const gyr = prog * SIM_GYR;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos, far: 500}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <SoftPoints data={data} scale={height * 0.5} opacity={enter} time={t} twinkle={0.1} version={Math.round(t * 30) + 1} />
        <Glow color="#ffe2b8" size={1.9 * enter} opacity={0.6} position={lerp3(c0[1], c1[1], fr)} />
        <Glow color="#ffd9a0" size={1.4 * enter * ramp(t, P(ch, 4), s0)} opacity={0.6} position={lerp3(c0[0], c1[0], fr)} />
      </ThreeCanvas>
      <div style={{position: 'absolute', right: 160, top: 170, opacity: simO, textAlign: 'right'}}>
        <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 4, color: '#f0abfc'}}>SIMULACIÓN · SI LLEGAN A CHOCAR</div>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 76, color: '#fff', letterSpacing: -2}}>
          +{miles(Math.round(interpolate(gyr, [0, SIM_GYR], [0, SIM_GYR * 1000]) / 100) * 100)}
          <span style={{fontSize: 32, color: C.dim}}> M años</span>
        </div>
      </div>
      <div style={{position: 'absolute', right: 170, bottom: 200, opacity: win(t, P(ch, 0) + 0.5, E(ch, 4), 0.6), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#f0abfc', textAlign: 'right'}}>
        GALAXIA DE ANDRÓMEDA · M31
      </div>
    </AbsoluteFill>
  );
};
