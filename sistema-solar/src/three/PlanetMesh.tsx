import {useMemo} from 'react';
import * as THREE from 'three';
import {Body} from '../planets';
import type * as T from 'three';

const atmoVertex = `
varying vec3 vNormal; varying vec3 vView;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vNormal = normalize(normalMatrix*normal); vView = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const atmoFragment = `
uniform vec3 color; uniform float power; uniform float strength;
varying vec3 vNormal; varying vec3 vView;
void main(){ float f = pow(1.0 - max(dot(vNormal, vView), 0.0), power); gl_FragColor = vec4(color, f*strength); }`;

/** Halo atmosférico (fresnel) */
const Atmosphere: React.FC<{color: string; scale?: number; strength?: number}> = ({color, scale = 1.04, strength = 1.2}) => {
  const uniforms = useMemo(() => ({color: {value: new THREE.Color(color)}, power: {value: 2.6}, strength: {value: strength}}), [color, strength]);
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial vertexShader={atmoVertex} fragmentShader={atmoFragment} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.FrontSide} />
    </mesh>
  );
};

/** Anillos con textura radial generada (bandas deterministas) */
const Rings: React.FC<{inner: number; outer: number; color: string; opacity: number}> = ({inner, outer, color, opacity}) => {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 256, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [inner, outer]);
  const tex = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 4;
    const ctx = cv.getContext('2d')!;
    const base = new THREE.Color(color);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let x = 0; x < 1024; x++) {
      const r = x / 1024;
      // hueco de Cassini aprox. y variación de bandas
      const gap = r > 0.62 && r < 0.68 ? 0.08 : 1;
      const edge = Math.min(1, r * 12) * Math.min(1, (1 - r) * 10);
      const a = (0.45 + 0.55 * rnd()) * gap * edge * (0.75 + 0.25 * Math.sin(r * 90));
      const k = 0.75 + 0.35 * rnd();
      ctx.fillStyle = `rgba(${Math.round(base.r * 255 * k)},${Math.round(base.g * 255 * k)},${Math.round(base.b * 255 * k)},${a})`;
      ctx.fillRect(x, 0, 1, 4);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [color]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial map={tex} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} roughness={1} />
    </mesh>
  );
};

/** Planeta completo: esfera texturizada + atmósfera + anillos opcionales */
export const PlanetMesh: React.FC<{b: Body; tex: T.Texture; rotation: number; position?: [number, number, number]; scale?: number}> = ({b, tex, rotation, position = [0, 0, 0], scale = 1}) => {
  return (
    <group position={position} scale={scale} rotation={[0, 0, b.tilt]}>
      <mesh rotation={[0, rotation, 0]}>
        <sphereGeometry args={[1, 128, 128]} />
        {b.emissive ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />}
      </mesh>
      {b.atmosphere && <Atmosphere color={b.atmosphere} />}
      {b.emissive && <Atmosphere color="#ffb347" scale={1.08} strength={2.2} />}
      {b.ring && <Rings {...b.ring} />}
    </group>
  );
};

/** Luna pequeña orbitando */
export const Moon: React.FC<{tex: T.Texture; angle: number; radius: number}> = ({tex, angle, radius}) => {
  return (
    <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * 0.25, Math.sin(angle) * radius]} scale={0.27} rotation={[0, angle, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
};
