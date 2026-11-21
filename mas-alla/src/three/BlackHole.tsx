import {useMemo} from 'react';
import * as THREE from 'three';
import {NOISE} from './glsl';

/**
 * Agujero negro de Schwarzschild con disco de acreción.
 * Raymarching en un quad a pantalla completa: cada rayo se curva con la
 * aproximación clásica a = -1.5·h²·r/|r|⁵ (rs = 1), lo que produce el anillo
 * de fotones y la imagen "doblada" de la parte trasera del disco.
 */
const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const frag = /* glsl */ `
precision highp float;
uniform vec2 res; uniform float time; uniform vec3 camPos; uniform vec3 camTarget; uniform float fov; uniform vec2 shift;
uniform float diskIn; uniform float diskOut; uniform float bright; uniform float starFade;
varying vec2 vUv;
${NOISE}
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 sky(vec3 d){
  vec3 col = vec3(0.0);
  // estrellas en tres escalas
  for (int k = 0; k < 3; k++){
    float sc = 90.0 + float(k) * 110.0;
    vec3 c = floor(d * sc); vec3 f = fract(d * sc) - 0.5;
    float h = hash(c + float(k) * 7.0);
    float s = smoothstep(0.985, 1.0, h);
    float m = exp(-dot(f, f) * 40.0);
    col += s * m * mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash(c + 3.0)) * 2.2;
  }
  float neb = fbm(d * 2.2 + 4.0) * 0.5 + 0.5;
  col += vec3(0.20, 0.10, 0.32) * pow(neb, 3.0) * 0.55 + vec3(0.05, 0.12, 0.25) * pow(fbm(d * 3.0 - 2.0) * 0.5 + 0.5, 4.0) * 0.6;
  return col * starFade;
}
vec3 diskColor(vec3 p, vec3 dir, out float alpha){
  float r = length(p.xz);
  float x = (r - diskIn) / (diskOut - diskIn);
  float ang = atan(p.z, p.x);
  float omega = 1.6 / pow(r, 1.5);
  float a2 = ang + time * omega;
  float streak = smoothstep(-0.35, 0.75, fbm(vec3(cos(a2) * r * 0.8, sin(a2) * r * 0.8, r * 3.2)));
  float rings = 0.82 + 0.18 * sin(r * 7.0 + streak * 6.0);
  float prof = smoothstep(0.0, 0.06, x) * pow(1.0 - clamp(x, 0.0, 1.0), 1.6);
  // temperatura: blanco-azulado dentro, naranja-rojo fuera
  vec3 hot = vec3(1.0, 0.95, 0.85); vec3 warm = vec3(1.0, 0.55, 0.18); vec3 cool = vec3(0.65, 0.12, 0.04);
  vec3 c = mix(hot, warm, smoothstep(0.0, 0.35, x)); c = mix(c, cool, smoothstep(0.35, 1.0, x));
  // haz Doppler: el lado que se acerca brilla más
  vec3 vel = normalize(vec3(-p.z, 0.0, p.x));
  float dop = 1.0 + 0.9 * dot(vel, -dir);
  float inten = prof * (0.35 + 0.9 * streak) * rings * dop * dop * 2.6;
  alpha = clamp(prof * (0.55 + 0.6 * streak), 0.0, 1.0);
  return c * inten;
}
void main(){
  vec2 uv = (vUv - 0.5) * vec2(res.x / res.y, 1.0) - shift;
  vec3 fw = normalize(camTarget - camPos);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  float f = 1.0 / tan(radians(fov) * 0.5);
  vec3 dir = normalize(uv.x * rt * 2.0 + uv.y * up * 2.0 + fw * f);
  vec3 pos = camPos;
  vec3 h = cross(pos, dir); float h2 = dot(h, h);
  vec3 col = vec3(0.0); float trans = 1.0; bool captured = false;
  float glow = 0.0;
  for (int i = 0; i < 170; i++){
    float r = length(pos);
    if (r < 1.0){ captured = true; break; }
    float dt = clamp(0.09 * r, 0.025, 1.2);
    vec3 prev = pos;
    vec3 acc = -1.5 * h2 * pos / pow(r, 5.0);
    dir += acc * dt;
    pos += dir * dt;
    glow += 0.012 * dt / (r * r * r) ;
    if (prev.y * pos.y < 0.0){
      vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
      float rr = length(hit.xz);
      if (rr > diskIn && rr < diskOut){
        float a; vec3 dc = diskColor(hit, normalize(dir), a);
        col += trans * dc; trans *= 1.0 - a;
        if (trans < 0.02) break;
      }
    }
    if (r > 60.0) break;
  }
  if (!captured) col += trans * sky(normalize(dir));
  col += vec3(1.0, 0.6, 0.3) * glow * 0.9;      // brillo cerca del anillo de fotones
  col *= bright;
  col = col / (1.0 + col * 0.35);               // tonemap suave
  col = pow(col, vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}`;

export const BlackHole: React.FC<{
  width: number;
  height: number;
  time: number;
  camPos: [number, number, number];
  target?: [number, number, number];
  fov?: number;
  shift?: [number, number];
  bright?: number;
  starFade?: number;
}> = ({width, height, time, camPos, target = [0, 0, 0], fov = 50, shift = [0, 0], bright = 1, starFade = 1}) => {
  const uniforms = useMemo(
    () => ({
      res: {value: new THREE.Vector2(width, height)},
      time: {value: 0},
      camPos: {value: new THREE.Vector3()},
      camTarget: {value: new THREE.Vector3()},
      fov: {value: fov},
      shift: {value: new THREE.Vector2()},
      diskIn: {value: 2.6},
      diskOut: {value: 9.0},
      bright: {value: 1},
      starFade: {value: 1},
    }),
    [width, height, fov],
  );
  uniforms.time.value = time;
  uniforms.camPos.value.set(...camPos);
  uniforms.camTarget.value.set(...target);
  uniforms.shift.value.set(...shift);
  uniforms.bright.value = bright;
  uniforms.starFade.value = starFade;
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
  );
};
