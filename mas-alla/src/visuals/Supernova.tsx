import {ThreeCanvas} from '@remotion/three';
import {Audio} from '@remotion/media';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile} from 'remotion';
import * as THREE from 'three';
import {C, display, mono, sans} from '../theme';
import {Glow, PointData, SoftPoints, Star, gauss, hex, rng} from '../three/Stars';
import {Cam, Fresnel, V3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';

export const SN: V3 = [1.9, 0, 0];

/** Remanente tipo Cangrejo: filamentos (arcos) + bruma interior. Posiciones unitarias (r≈1) */
export const useRemnant = () =>
  useMemo(() => {
    const r = rng(1054);
    const n = 16000;
    const dirs = new Float32Array(n * 3);
    const rad = new Float32Array(n);
    const data: PointData = {positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), sizes: new Float32Array(n)};
    const fil = [hex('#ff5a2e'), hex('#ffb35c'), hex('#ffd8a0'), hex('#ff7a8a')];
    const blue = hex('#79a8ff');
    let i = 0;
    // filamentos: arcos de círculo máximo con ruido
    while (i < n * 0.8) {
      const a = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
      const b = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).cross(a).normalize();
      const len = 0.4 + r() * 1.4;
      const off = r() * Math.PI * 2;
      const base = 0.78 + r() * 0.3;
      const c = fil[Math.floor(r() * fil.length)];
      const cnt = 60 + Math.floor(r() * 160);
      for (let k = 0; k < cnt && i < n; k++, i++) {
        const th = off + (k / cnt) * len;
        const v = a.clone().multiplyScalar(Math.cos(th)).add(b.clone().multiplyScalar(Math.sin(th)));
        v.add(new THREE.Vector3(gauss(r), gauss(r), gauss(r)).multiplyScalar(0.025)).normalize();
        dirs.set([v.x, v.y * 0.78, v.z], i * 3);
        rad[i] = base * (1 + gauss(r) * 0.03);
        const br = 0.55 + r() * 0.45;
        data.colors.set([c[0] * br, c[1] * br, c[2] * br], i * 3);
        data.sizes[i] = 34 + r() * 40;
      }
    }
    // bruma de sincrotrón (azul) en el interior
    for (; i < n; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
      dirs.set([v.x, v.y * 0.78, v.z], i * 3);
      rad[i] = r() ** 0.6 * 0.8;
      const br = 0.1 + r() * 0.16;
      data.colors.set([blue[0] * br, blue[1] * br, blue[2] * br], i * 3);
      data.sizes[i] = 50 + r() * 60;
    }
    return {dirs, rad, data};
  }, []);

/** Escribe las posiciones del remanente con un radio global R */
export const placeRemnant = (rem: ReturnType<typeof useRemnant>, R: number, wobble = 0) => {
  const {dirs, rad, data} = rem;
  for (let i = 0; i < rad.length; i++) {
    const k = R * rad[i] * (1 + wobble * Math.sin(i * 1.7));
    data.positions[i * 3] = dirs[i * 3] * k;
    data.positions[i * 3 + 1] = dirs[i * 3 + 1] * k;
    data.positions[i * 3 + 2] = dirs[i * 3 + 2] * k;
  }
};

const Element: React.FC<{z: number; s: string; n: string; c: string; o: number; d: number}> = ({z, s, n, c, o, d}) => (
  <div style={{width: 190, height: 210, borderRadius: 22, border: `3px solid ${c}`, background: 'rgba(8,10,24,0.85)', padding: 18, opacity: o, translate: `0px ${(1 - o) * 40 + d}px`, boxShadow: `0 0 40px ${c}44`}}>
    <div style={{fontFamily: mono, fontSize: 26, color: c}}>{z}</div>
    <div style={{fontFamily: display, fontWeight: 800, fontSize: 92, lineHeight: 1, color: '#fff'}}>{s}</div>
    <div style={{fontFamily: sans, fontSize: 24, color: C.dim, marginTop: 6}}>{n}</div>
  </div>
);

export const Supernova: React.FC<VisualProps> = ({ch, t, enter, width, height, fps}) => {
  const rem = useRemnant();
  const c0 = P(ch, 1) + 0.9;
  const c1 = c0 + 0.55; // explosión
  const pre = t < c1;
  const collapse = ramp(t, c0, c1, Easing.in(Easing.cubic));
  const instab = ramp(t, P(ch, 0), c0) * 0.06 * Math.sin(t * 9);
  const since = Math.max(0, t - c1);
  const R = 0.25 + 3.0 * (1 - Math.exp(-since / 1.4)) + since * 0.025;
  placeRemnant(rem, R);
  const flash = t > c1 ? Math.exp(-since * 2.2) : 0;
  const shock = since > 0 && since < 4 ? since : -1;
  const remO = ramp(t, c1, c1 + 0.6);
  const rot = t * 0.05;
  const camPos: V3 = [0.2, 0.6, 9.6 + ramp(t, c1, c1 + 6) * 1.2];
  const look: V3 = [0.7, 0, 0];
  const fov = 40;
  const elemO = win(t, P(ch, 6) - 0.2, ch.duration + 1, 0.6);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos}}>
        <Cam pos={camPos} look={look} fov={fov} />
        {pre && (
          <>
            <Glow color="#7fb2ff" size={(5.6 + collapse * 2) * enter * (1 - collapse * 0.7)} opacity={0.7} position={SN} />
            <Star time={t} colors={{dark: '#14306e', mid: '#7fb2ff', hot: '#ffffff'}} cells={2} bright={1.3 + collapse * 1.6} position={SN} scale={1.25 * enter * (1 - collapse * 0.88) * (1 + instab)} />
          </>
        )}
        {!pre && (
          <group position={SN} rotation={[0.3, rot, 0.1]}>
            <SoftPoints data={rem.data} scale={height * 0.5} opacity={remO} version={Math.round(t * fps)} />
            <Glow color="#6d9cff" size={R * 1.4} opacity={0.22 * remO} />
            <Glow color="#ffffff" size={0.35 + flash * 8} opacity={1} />
            {shock > 0 && <Fresnel color="#ffd9a8" power={3.5} strength={Math.max(0, 1 - shock / 4) * 0.6} scale={0.3 + shock * 1.6} />}
          </group>
        )}
      </ThreeCanvas>
      {/* destello a pantalla completa */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 68% 50%, #ffffff 0%, #fff4e0 30%, #ffd9a800 75%)', opacity: Math.min(1, flash * 1.3), mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', right: 170, top: 230, display: 'flex', gap: 26}}>
        <Element z={20} s="Ca" n="Calcio" c="#ffd166" o={elemO} d={0} />
        <Element z={26} s="Fe" n="Hierro" c="#ff7a50" o={ramp(t, P(ch, 6) + 0.5, P(ch, 6) + 1.2)} d={30} />
      </div>
      <div style={{position: 'absolute', right: 170, bottom: 190, opacity: win(t, P(ch, 4) + 0.2, E(ch, 5) + 0.5, 0.6), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#ffc58a', textAlign: 'right'}}>
        NEBULOSA DEL CANGREJO · M1
        <div style={{fontSize: 18, color: C.dim, letterSpacing: 2}}>RESTOS DE LA SUPERNOVA DE 1054</div>
      </div>
      <Audio name="Explosión" src={staticFile('audio/impact.wav')} from={Math.round(c1 * fps)} volume={0.85} />
      <Audio name="Colapso" src={staticFile('audio/riser.wav')} from={Math.round((c1 - 1.4) * fps)} volume={(f) => interpolate(f, [0, 10], [0, 0.4], {extrapolateRight: 'clamp'})} />
    </AbsoluteFill>
  );
};
