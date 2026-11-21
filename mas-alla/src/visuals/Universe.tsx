import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random} from 'remotion';
import * as THREE from 'three';
import {C, mono} from '../theme';
import {NOISE} from '../three/glsl';
import {PointData, SoftPoints, gauss, hex, rng} from '../three/Stars';
import {Cam, V3, lerp3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';

/** Telaraña cósmica: nodos (cúmulos) unidos por filamentos de galaxias */
const useWeb = () =>
  useMemo(() => {
    const r = rng(2025);
    const nodes: THREE.Vector3[] = Array.from({length: 70}, () => new THREE.Vector3((r() - 0.5) * 36, (r() - 0.5) * 36, (r() - 0.5) * 36));
    const edges: [number, number][] = [];
    nodes.forEach((a, i) => {
      const near = nodes.map((b, j) => ({j, d: a.distanceTo(b)})).filter((x) => x.j !== i).sort((x, y) => x.d - y.d).slice(0, 3);
      for (const {j} of near) if (!edges.some(([p, q]) => (p === j && q === i) || (p === i && q === j))) edges.push([i, j]);
    });
    const n = 60000;
    const d: PointData = {positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), sizes: new Float32Array(n)};
    const cols = [hex('#9db8ff'), hex('#c4a5ff'), hex('#ffd6a0'), hex('#ffffff')];
    for (let i = 0; i < n; i++) {
      let p: THREE.Vector3;
      if (r() < 0.3) {
        const nd = nodes[Math.floor(r() * nodes.length)];
        p = nd.clone().add(new THREE.Vector3(gauss(r), gauss(r), gauss(r)).multiplyScalar(0.7));
      } else {
        const [a, b] = edges[Math.floor(r() * edges.length)];
        const k = r();
        p = nodes[a].clone().lerp(nodes[b], k).add(new THREE.Vector3(gauss(r), gauss(r), gauss(r)).multiplyScalar(0.28 + Math.sin(k * Math.PI) * 0.25));
      }
      d.positions.set([p.x, p.y, p.z], i * 3);
      const c = cols[Math.floor(r() * cols.length)];
      const b = 0.4 + r() * 0.6;
      d.colors.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
      d.sizes[i] = 60 + r() ** 3 * 140;
    }
    return d;
  }, []);

/** Esfera del fondo cósmico de microondas: el límite de lo observable */
const cmbVert = /* glsl */ `varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const cmbFrag = /* glsl */ `uniform float op; varying vec3 vP; varying vec3 vN; varying vec3 vV;
${NOISE}
void main(){
  float n = fbm(normalize(vP) * 6.0) * 0.6 + snoise(normalize(vP) * 22.0) * 0.4;
  vec3 c = mix(vec3(0.08, 0.25, 0.85), vec3(1.0, 0.55, 0.15), smoothstep(-0.35, 0.45, n));
  float f = 0.25 + 0.75 * pow(1.0 - abs(dot(vN, vV)), 1.5);
  gl_FragColor = vec4(c * f * op, 1.0);
}`;
const CMB: React.FC<{op: number; scale: number}> = ({op, scale}) => {
  const u = useMemo(() => ({op: {value: 0}}), []);
  u.op.value = op;
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial vertexShader={cmbVert} fragmentShader={cmbFrag} uniforms={u} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
};

/** Recreación del Campo Profundo del Hubble: miles de galaxias en un trozo de cielo */
const DeepField: React.FC<{t: number; o: number; zoom: number}> = ({t, o, zoom}) => {
  const W = 720;
  const gals = useMemo(
    () =>
      Array.from({length: 420}).map((_, i) => {
        const big = random(`b${i}`) < 0.06;
        const s = big ? 14 + random(`s${i}`) * 26 : 1.5 + random(`s${i}`) ** 2 * 9;
        const hue = random(`h${i}`);
        const col = hue < 0.45 ? '#ffd9a8' : hue < 0.75 ? '#cfe0ff' : hue < 0.9 ? '#ff9e7a' : '#ffffff';
        return {x: random(`x${i}`) * W, y: random(`y${i}`) * W, s, e: 0.3 + random(`e${i}`) * 0.7, rot: random(`r${i}`) * 180, col, spiral: big && random(`p${i}`) < 0.6};
      }),
    [],
  );
  return (
    <div style={{position: 'absolute', left: 1080, top: 150, width: W, height: W, borderRadius: 26, overflow: 'hidden', border: `2px solid ${C.line}`, background: '#010208', opacity: o, boxShadow: '0 30px 90px rgba(0,0,0,0.6)'}}>
      <svg width={W} height={W} style={{scale: String(zoom), transformOrigin: '50% 50%'}}>
        <defs>
          {['#ffd9a8', '#cfe0ff', '#ff9e7a', '#ffffff'].map((c) => (
            <radialGradient key={c} id={`g${c.slice(1)}`}>
              <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <stop offset="25%" stopColor={c} stopOpacity={0.9} />
              <stop offset="100%" stopColor={c} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        {gals.map((g, i) => (
          <g key={i} transform={`translate(${g.x} ${g.y}) rotate(${g.rot + (g.spiral ? t * 2 : 0)})`}>
            <ellipse rx={g.s} ry={g.s * g.e} fill={`url(#g${g.col.slice(1)})`} opacity={0.9} />
            {g.spiral && (
              <>
                <path d={`M0 0 Q ${g.s * 0.8} ${-g.s * 0.5} ${g.s * 1.2} ${g.s * 0.2}`} stroke={g.col} strokeOpacity={0.45} strokeWidth={g.s * 0.18} fill="none" />
                <path d={`M0 0 Q ${-g.s * 0.8} ${g.s * 0.5} ${-g.s * 1.2} ${-g.s * 0.2}`} stroke={g.col} strokeOpacity={0.45} strokeWidth={g.s * 0.18} fill="none" />
              </>
            )}
          </g>
        ))}
      </svg>
      <div style={{position: 'absolute', left: 22, bottom: 18, fontFamily: mono, fontSize: 18, color: C.dim, letterSpacing: 2}}>CAMPO PROFUNDO DEL HUBBLE · RECREACIÓN</div>
    </div>
  );
};

export const Universe: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  const web = useWeb();
  const k = ramp(t, 0, ch.duration, Easing.inOut(Easing.sin));
  const out = ramp(t, P(ch, 6) - 0.5, ch.duration - 1, Easing.inOut(Easing.cubic));
  const ang = 0.4 + t * 0.02;
  const dist = interpolate(k, [0, 1], [8, 34]) + out * 110;
  const camPos: V3 = [Math.sin(ang) * dist, 3 + out * 30, Math.cos(ang) * dist];
  const look: V3 = lerp3([-4, 0, 0], [-10, 0, 0], k);
  const fov = 50;
  const dfO = win(t, P(ch, 2) - 0.2, E(ch, 3) + 0.6, 0.6);
  const cmbO = ramp(t, P(ch, 6) + 1.8, P(ch, 6) + 4.2) * (1 - ramp(t, ch.duration - 1.2, ch.duration));
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos, far: 2000}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <SoftPoints data={web} scale={height * 0.5} opacity={enter * (1 - dfO * 0.6)} time={t} twinkle={0.25} />
        <CMB op={cmbO * 0.75} scale={46} />
      </ThreeCanvas>
      <DeepField t={t} o={dfO} zoom={interpolate(t, [P(ch, 2), E(ch, 3) + 0.6], [1.0, 1.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <div style={{position: 'absolute', right: 170, bottom: 200, opacity: win(t, P(ch, 1) + 0.3, P(ch, 2) - 0.1, 0.5), fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#c4a5ff', textAlign: 'right'}}>
        LA TELARAÑA CÓSMICA
      </div>
      <div style={{position: 'absolute', right: 170, top: 170, opacity: cmbO, fontFamily: mono, fontSize: 22, letterSpacing: 4, color: '#ffb36b', textAlign: 'right'}}>
        LÍMITE DEL UNIVERSO OBSERVABLE
        <div style={{fontSize: 18, color: C.dim, letterSpacing: 2}}>LA LUZ MÁS ANTIGUA: EL FONDO CÓSMICO DE MICROONDAS</div>
      </div>
    </AbsoluteFill>
  );
};
