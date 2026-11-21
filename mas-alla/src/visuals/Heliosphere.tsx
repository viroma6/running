import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import * as THREE from 'three';
import {C, mono} from '../theme';
import {Glow, PointData, SoftPoints, gauss, hex, rng} from '../three/Stars';
import {Cam, Fresnel, V3, lerp3, project} from '../three/util';
import {useTextures} from '../three/useTex';
import {E, P, VisualProps, ramp, win} from './common';

const CENTER: V3 = [1.7, 0, 0];
/** Radio de la heliopausa en una dirección (morro hacia +x, cola hacia -x) */
const shellR = (d: THREE.Vector3) => 2.1 * (1 + 0.75 * Math.max(0, -d.x) ** 1.5);
const VOY_DIR = new THREE.Vector3(0.55, 0.45, 0.7).normalize();

const useData = () =>
  useMemo(() => {
    const r = rng(42);
    // viento solar: dirección, fase y velocidad
    const nW = 2600;
    const wind = {dirs: new Float32Array(nW * 3), phase: new Float32Array(nW), sp: new Float32Array(nW)};
    for (let i = 0; i < nW; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
      wind.dirs.set([v.x, v.y, v.z], i * 3);
      wind.phase[i] = r();
      wind.sp[i] = 0.12 + r() * 0.1;
    }
    // nube de Oort: cáscara esférica + nube de Hills (toro interior)
    const nO = 9000;
    const oort: PointData = {positions: new Float32Array(nO * 3), colors: new Float32Array(nO * 3), sizes: new Float32Array(nO)};
    for (let i = 0; i < nO; i++) {
      const v = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize();
      const inner = i < nO * 0.3;
      let p: V3;
      if (inner) {
        const a = r() * Math.PI * 2;
        const rr = 4.2 + r() * 2.2;
        p = [Math.cos(a) * rr, gauss(r) * 0.9, Math.sin(a) * rr];
      } else {
        const rr = 7 + r() ** 0.7 * 4.5;
        p = [v.x * rr, v.y * rr, v.z * rr];
      }
      oort.positions.set(p, i * 3);
      const c = hex(r() < 0.7 ? '#cfe6ff' : '#9fb7ff');
      const k = 0.5 + r() * 0.5;
      oort.colors.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      oort.sizes[i] = 40 + r() * 60;
    }
    // medio interestelar que fluye de +x a -x
    const nI = 2600;
    const ism = {base: new Float32Array(nI * 3), phase: new Float32Array(nI)};
    for (let i = 0; i < nI; i++) {
      ism.base.set([0, (r() - 0.5) * 11, (r() - 0.5) * 11], i * 3);
      ism.phase[i] = r();
    }
    return {wind, oort, ism};
  }, []);

export const Heliosphere: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const tex = useTextures(['sun.jpg']);
  const {wind, oort, ism} = useData();
  const voyStart = ch.lead;
  const cross = P(ch, 2) + 0.6;
  const oortIn = ramp(t, P(ch, 4) - 0.5, P(ch, 4) + 3.5);
  // Voyager: sale del Sol y cruza la heliopausa al inicio de la frase 2
  const sR = shellR(VOY_DIR);
  const vr = interpolate(t, [voyStart, cross, ch.duration], [0.55, sR, sR * 2.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const voy: V3 = [CENTER[0] + VOY_DIR.x * vr, CENTER[1] + VOY_DIR.y * vr, CENTER[2] + VOY_DIR.z * vr];

  // viento solar animado (CPU, determinista)
  const windData = useMemo<PointData>(() => {
    const n = wind.phase.length;
    return {positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), sizes: new Float32Array(n)};
  }, [wind]);
  const d = new THREE.Vector3();
  for (let i = 0; i < wind.phase.length; i++) {
    d.set(wind.dirs[i * 3], wind.dirs[i * 3 + 1], wind.dirs[i * 3 + 2]);
    const R = shellR(d) * 0.97;
    const k = (wind.phase[i] + t * wind.sp[i]) % 1;
    const rr = 0.35 + k * (R - 0.35);
    windData.positions.set([CENTER[0] + d.x * rr, CENTER[1] + d.y * rr, CENTER[2] + d.z * rr], i * 3);
    const fade = Math.min(1, k * 6) * (1 - k ** 6);
    windData.colors.set([1 * fade, 0.82 * fade, 0.5 * fade], i * 3);
    windData.sizes[i] = 26 + 22 * (1 - k);
  }
  const ismData = useMemo<PointData>(() => {
    const n = ism.phase.length;
    return {positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), sizes: new Float32Array(n).fill(40)};
  }, [ism]);
  for (let i = 0; i < ism.phase.length; i++) {
    const x = 9 - ((ism.phase[i] + t * 0.05) % 1) * 18;
    const p = new THREE.Vector3(x, ism.base[i * 3 + 1], ism.base[i * 3 + 2]);
    const rel = p.clone().sub(new THREE.Vector3(...CENTER));
    const len = rel.length();
    const R = shellR(rel.clone().normalize()) * 1.07;
    if (len < R) p.copy(new THREE.Vector3(...CENTER).add(rel.normalize().multiplyScalar(R)));
    ismData.positions.set([p.x, p.y, p.z], i * 3);
    const f = Math.min(1, (9 - Math.abs(x)) / 2);
    ismData.colors.set([0.55 * f, 0.45 * f, 1.0 * f], i * 3);
  }

  // cámara: plano medio → se aleja para mostrar la nube de Oort
  const zoom = ramp(t, P(ch, 4) - 0.3, P(ch, 5) + 2, Easing.inOut(Easing.cubic));
  const camPos: V3 = lerp3([0.2 + t * 0.01, 1.6, 9.2], [-6, 8, 26], zoom);
  const look: V3 = lerp3([0.2, 0, 0], [-2.2, 0, 0], zoom);
  const fov = 40;
  const lab = project(camPos, look, fov, width, height, voy);
  const labO = win(t, voyStart + 1, P(ch, 4) + 1, 0.6);
  const helioLabel = project(camPos, look, fov, width, height, [CENTER[0] - 0.4, CENTER[1] - 2.55, 0]);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos, far: 400}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <group scale={1}>
          {tex && (
            <mesh position={CENTER} scale={0.32 * enter}>
              <sphereGeometry args={[1, 64, 64]} />
              <meshBasicMaterial map={tex['sun.jpg']} toneMapped={false} />
            </mesh>
          )}
          <Glow color="#ffb347" size={3.2 * enter} position={CENTER} opacity={0.95} />
          <Glow color="#ff8a2e" size={1.3 * enter} position={CENTER} />
          <SoftPoints data={windData} scale={height * 0.5} opacity={0.75 * enter} version={Math.round(t * 30)} />
          <SoftPoints data={ismData} scale={height * 0.5} opacity={0.45 * enter} version={Math.round(t * 30)} />
          {/* heliopausa (burbuja) y choque de terminación */}
          <group position={[CENTER[0] - 0.55, CENTER[1], CENTER[2]]}>
            <Fresnel color="#7FD1FF" power={3} strength={0.85 * enter} scale={[2.75, 2.15, 2.15]} />
          </group>
          <Fresnel color="#ffcf8a" power={4} strength={0.22 * enter} scale={1.35} position={CENTER} />
          {/* Voyager 1 con estela */}
          {Array.from({length: 18}).map((_, k) => {
            const rr = Math.max(0.55, vr - k * 0.05);
            return <Glow key={k} color="#ffffff" size={k === 0 ? 0.55 : 0.16 * (1 - k / 18)} opacity={k === 0 ? 1 : 0.6} position={[CENTER[0] + VOY_DIR.x * rr, CENTER[1] + VOY_DIR.y * rr, CENTER[2] + VOY_DIR.z * rr]} />;
          })}
          <group position={CENTER}>
            <SoftPoints data={oort} scale={height * 0.5} opacity={oortIn * 0.9} time={t} twinkle={0.4} />
          </group>
        </group>
      </ThreeCanvas>
      {lab.visible && (
        <div style={{position: 'absolute', left: lab.x + 22, top: lab.y - 46, opacity: labO, fontFamily: mono, fontSize: 24, letterSpacing: 3, color: '#fff', textShadow: '0 0 12px #000'}}>
          VOYAGER 1
          <div style={{fontSize: 18, color: C.dim, letterSpacing: 1}}>{t > cross ? 'ESPACIO INTERESTELAR' : 'HELIOSFERA'}</div>
        </div>
      )}
      <div style={{position: 'absolute', left: helioLabel.x, top: helioLabel.y, opacity: win(t, P(ch, 1), E(ch, 3), 0.6), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#7FD1FF'}}>HELIOPAUSA</div>
      <div style={{position: 'absolute', right: 160, bottom: 200, opacity: oortIn * win(t, P(ch, 4), ch.duration + 1, 0.8), fontFamily: mono, fontSize: 26, letterSpacing: 6, color: '#cfe6ff'}}>NUBE DE OORT</div>
    </AbsoluteFill>
  );
};
