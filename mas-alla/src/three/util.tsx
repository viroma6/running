import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

export type V3 = [number, number, number];

/** Coloca la cámara en cada fotograma (determinista) */
export const Cam: React.FC<{pos: V3; look: V3; fov?: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  camera.lookAt(...look);
  if (fov && camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/** Proyecta un punto 3D a píxeles de pantalla con la misma cámara que la escena */
export const project = (pos: V3, look: V3, fov: number, w: number, h: number, p: V3) => {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.1, 5000);
  c.position.set(...pos);
  c.lookAt(...look);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return {x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, visible: v.z < 1};
};

export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const orbit = (r: number, ang: number, y: number, c: V3 = [0, 0, 0]): V3 => [c[0] + Math.sin(ang) * r, c[1] + y, c[2] + Math.cos(ang) * r];

/** Línea 3D (polilínea) */
export const Polyline: React.FC<{points: V3[]; color: string; opacity?: number; dashed?: boolean; loop?: boolean}> = ({points, color, opacity = 1, loop}) => {
  const geo = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
  const mat = new THREE.LineBasicMaterial({color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false});
  const obj = loop ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
  return <primitive object={obj} />;
};

/** Capa de fresnel (atmósferas, burbujas, frentes de choque) */
const fVert = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const fFrag = /* glsl */ `
uniform vec3 color; uniform float power; uniform float strength; uniform float base;
varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(1.0 - abs(dot(vN, vV)), power); gl_FragColor = vec4(color * (f + base) * strength, 1.0); }`;
export const Fresnel: React.FC<{color: string; power?: number; strength?: number; base?: number; position?: V3; scale?: V3 | number; segments?: number}> = ({
  color,
  power = 2.5,
  strength = 1,
  base = 0,
  position,
  scale = 1,
  segments = 96,
}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[1, segments, segments]} />
    <shaderMaterial
      vertexShader={fVert}
      fragmentShader={fFrag}
      uniforms={{color: {value: new THREE.Color(color)}, power: {value: power}, strength: {value: strength}, base: {value: base}}}
      transparent
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  </mesh>
);
