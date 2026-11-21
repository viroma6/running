import {useMemo} from 'react';
import * as THREE from 'three';
import {NOISE} from './glsl';

/* ------------------------------------------------------------------ */
/* Estrella: esfera con granulación animada + oscurecimiento del limbo */
/* ------------------------------------------------------------------ */
const starVert = /* glsl */ `
uniform float time; uniform float wobble;
varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
${NOISE}
void main(){
  vec3 p = position;
  if (wobble > 0.0) p += normal * wobble * snoise(position * 1.3 + time * 0.05);
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const starFrag = /* glsl */ `
uniform float time; uniform vec3 cDark; uniform vec3 cMid; uniform vec3 cHot; uniform float cells; uniform float bright; uniform float spots;
varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
${NOISE}
void main(){
  vec3 p = vPos * cells;
  float n = fbm(p + vec3(0.0, time * 0.04, time * 0.02));
  float g = snoise(p * 3.2 - time * 0.09) * 0.5 + 0.5;          // granulación fina
  float h = clamp(n * 0.85 + 0.5 + (g - 0.5) * 0.35, 0.0, 1.0);
  vec3 col = mix(cDark, cMid, smoothstep(0.15, 0.6, h));
  col = mix(col, cHot, smoothstep(0.55, 0.95, h));
  float sp = smoothstep(0.55, 0.75, snoise(vPos * 1.6 + 11.0 + time * 0.01)) * spots;   // manchas
  col *= 1.0 - sp * 0.75;
  float mu = max(dot(vNormal, vView), 0.0);
  float limb = 0.35 + 0.65 * pow(mu, 0.55);
  vec3 rim = cMid * pow(1.0 - mu, 3.0) * 0.6;
  gl_FragColor = vec4((col * limb + rim) * bright, 1.0);
}`;

export type StarColors = {dark: string; mid: string; hot: string};

export const Star: React.FC<{
  time: number;
  colors: StarColors;
  cells?: number;
  bright?: number;
  spots?: number;
  wobble?: number;
  position?: [number, number, number];
  scale?: number;
  segments?: number;
}> = ({time, colors, cells = 2.2, bright = 1.2, spots = 0, wobble = 0, position = [0, 0, 0], scale = 1, segments = 128}) => {
  const uniforms = useMemo(
    () => ({
      time: {value: 0},
      cDark: {value: new THREE.Color(colors.dark)},
      cMid: {value: new THREE.Color(colors.mid)},
      cHot: {value: new THREE.Color(colors.hot)},
      cells: {value: cells},
      bright: {value: bright},
      spots: {value: spots},
      wobble: {value: wobble},
    }),
    [colors.dark, colors.mid, colors.hot, cells, spots, wobble],
  );
  uniforms.time.value = time;
  uniforms.bright.value = bright;
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, segments, segments]} />
      <shaderMaterial vertexShader={starVert} fragmentShader={starFrag} uniforms={uniforms} toneMapped={false} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ */
/* Halo / glow: sprite aditivo con gradiente radial                    */
/* ------------------------------------------------------------------ */
const glowCache = new Map<string, THREE.Texture>();
export const glowTexture = (falloff = 2.2) => {
  const k = String(falloff);
  if (!glowCache.has(k)) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const r = Math.hypot(x - 127.5, y - 127.5) / 128;
        const a = Math.max(0, 1 - r) ** falloff;
        const i = (y * 256 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    glowCache.set(k, t);
  }
  return glowCache.get(k)!;
};

export const Glow: React.FC<{color: string; size: number; opacity?: number; position?: [number, number, number]; falloff?: number}> = ({color, size, opacity = 1, position = [0, 0, 0], falloff = 2.2}) => (
  <sprite position={position} scale={[size, size, 1]}>
    <spriteMaterial map={glowTexture(falloff)} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
  </sprite>
);

/* ------------------------------------------------------------------ */
/* Nube de puntos suaves (partículas)                                  */
/* ------------------------------------------------------------------ */
const ptsVert = /* glsl */ `
attribute float size; attribute vec3 color; attribute float seed;
uniform float scale; uniform float time; uniform float twinkle;
varying vec3 vColor; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float ps = size * scale * 0.00275 / -mv.z;
  gl_PointSize = clamp(ps, 1.5, 300.0);
  vColor = color;
  vA = (1.0 - twinkle * (0.5 + 0.5 * sin(time * (1.0 + seed * 3.0) + seed * 40.0))) * min(1.0, ps / 1.5);
  gl_Position = projectionMatrix * mv;
}`;
const ptsFrag = /* glsl */ `
uniform float opacity; uniform float hard;
varying vec3 vColor; varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0;
  if (r2 > 1.0) discard;
  float a = mix(exp(-r2 * 4.0), 1.0 - r2, hard);
  gl_FragColor = vec4(vColor * a * opacity * vA, a * opacity * vA);
}`;

export type PointData = {positions: Float32Array; colors: Float32Array; sizes: Float32Array; seeds?: Float32Array};

export const SoftPoints: React.FC<{
  data: PointData;
  scale?: number;
  opacity?: number;
  time?: number;
  twinkle?: number;
  hard?: number;
  additive?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  groupScale?: number;
  version?: number;
}> = ({data, scale = 300, opacity = 1, time = 0, twinkle = 0, hard = 0, additive = true, position, rotation, groupScale = 1, version = 0}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(data.sizes, 1));
    const seeds = data.seeds ?? new Float32Array(data.sizes.length).map((_, i) => ((i * 0.6180339) % 1));
    g.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [data]);
  if (version) for (const k of ['position', 'color', 'size']) (geo.attributes[k] as THREE.BufferAttribute).needsUpdate = true;
  const uniforms = useMemo(() => ({scale: {value: scale}, opacity: {value: opacity}, time: {value: time}, twinkle: {value: twinkle}, hard: {value: hard}}), []); // eslint-disable-line react-hooks/exhaustive-deps
  uniforms.scale.value = scale;
  uniforms.opacity.value = opacity;
  uniforms.time.value = time;
  uniforms.twinkle.value = twinkle;
  uniforms.hard.value = hard;
  return (
    <points geometry={geo} position={position} rotation={rotation} scale={groupScale} frustumCulled={false}>
      <shaderMaterial
        vertexShader={ptsVert}
        fragmentShader={ptsFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        premultipliedAlpha={!additive}
      />
    </points>
  );
};

/** Generador pseudoaleatorio determinista */
export const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1e9) / 1e9;
  };
};
export const gauss = (r: () => number) => {
  const u = Math.max(1e-9, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};
export const hex = (c: string) => {
  const x = new THREE.Color(c);
  return [x.r, x.g, x.b] as const;
};
