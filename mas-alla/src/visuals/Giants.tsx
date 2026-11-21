import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import * as THREE from 'three';
import {C, display, mono, sans} from '../theme';
import {Glow, Star, glowTexture} from '../three/Stars';
import {Cam, V3} from '../three/util';
import {E, P, VisualProps, ramp, win} from './common';

const B: V3 = [3.1, -0.1, 0];
const AU = 58; // px por unidad astronómica en el esquema
const ORBITS: [string, number, string][] = [
  ['Mercurio', 0.39, '#C9B8A6'],
  ['Venus', 0.72, '#F5C97A'],
  ['Tierra', 1, '#5CB8FF'],
  ['Marte', 1.52, '#FF7A50'],
  ['Júpiter', 5.2, '#E8B98A'],
];
const BET_AU = 3.6; // ~770 radios solares

/** Esquema: Betelgeuse en el lugar del Sol */
const Compare: React.FC<{t: number; a: number; b: number}> = ({t, a, b}) => {
  const o = win(t, a, b, 0.6);
  const grow = ramp(t, a + 0.8, a + 4.2, Easing.inOut(Easing.cubic));
  const R = BET_AU * AU * grow;
  const W = 760;
  const cx = W / 2;
  const cy = 330;
  return (
    <div style={{position: 'absolute', left: 1060, top: 150, width: W, height: 700, borderRadius: 28, background: 'rgba(6,8,20,0.86)', border: `2px solid ${C.line}`, overflow: 'hidden', opacity: o, scale: String(interpolate(o, [0, 1], [0.94, 1]))}}>
      <svg width={W} height={660}>
        <defs>
          <radialGradient id="bg1">
            <stop offset="0%" stopColor="#ffb36b" />
            <stop offset="55%" stopColor="#e2461a" />
            <stop offset="100%" stopColor="#7a1404" />
          </radialGradient>
        </defs>
        {ORBITS.map(([n, au, c]) => {
          const r = au * AU;
          const eaten = r < R;
          const ang = au * 2.1 + 0.6;
          return (
            <g key={n} opacity={eaten ? 0.25 : 1}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={eaten ? '#ff8a5c' : 'rgba(190,210,255,0.28)'} strokeWidth={1.6} strokeDasharray={eaten ? '4 6' : undefined} />
              <circle cx={cx + Math.cos(ang) * r} cy={cy + Math.sin(ang) * r} r={au > 2 ? 9 : 6} fill={c} />
              {(au > 1.2 || !eaten) && (
                <text x={cx + Math.cos(ang) * r + 12} y={cy + Math.sin(ang) * r - 10} fill={C.dim} fontFamily={sans} fontSize={20}>
                  {n}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={Math.max(4, R)} fill="url(#bg1)" opacity={0.92} style={{filter: 'drop-shadow(0 0 30px #ff5a1f)'}} />
        <circle cx={cx} cy={cy} r={4} fill="#fff6d0" opacity={1 - grow} />
      </svg>
      <div style={{position: 'absolute', left: 30, bottom: 26, fontFamily: mono, fontSize: 20, color: C.dim, letterSpacing: 2}}>
        BETELGEUSE EN EL LUGAR DEL SOL · <span style={{color: '#ff8a5c'}}>radio ≈ {(BET_AU * grow).toFixed(1).replace('.', ',')} UA</span>
      </div>
      <div style={{position: 'absolute', right: 30, top: 24, fontFamily: display, fontWeight: 800, fontSize: 34, color: '#ff8a5c'}}>a escala</div>
    </div>
  );
};

export const Giants: React.FC<VisualProps> = ({ch, t, enter, width, height}) => {
  // Gran Atenuación: pierde brillo y aparece una nube de polvo
  const dimA = P(ch, 4);
  const dim = ramp(t, dimA + 0.5, dimA + 3) * (1 - ramp(t, E(ch, 5), E(ch, 5) + 2));
  const camPos: V3 = [0.2 + t * 0.008, 0.3, 9.5 - t * 0.02];
  const look: V3 = [0.8, 0, 0];
  const fov = 40;
  const pulse = 1 + 0.015 * Math.sin(t * 0.9);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov, position: camPos}}>
        <Cam pos={camPos} look={look} fov={fov} />
        <Glow color="#ff4a1a" size={12 * enter} opacity={0.5 * (1 - dim * 0.5)} position={B} />
        <Glow color="#ff7a3a" size={7.2 * enter} opacity={0.6 * (1 - dim * 0.5)} position={B} />
        <Star time={t * 0.6} colors={{dark: '#3a0600', mid: '#d43d14', hot: '#ffb15e'}} cells={0.9} wobble={0.05} bright={1.2 * (1 - dim * 0.55)} position={B} scale={2.7 * enter * pulse} segments={160} />
        {/* nube de polvo de la Gran Atenuación */}
        <sprite position={[B[0] - 0.4, B[1] - 1.1, 2.9]} scale={[4.6 * dim, 3.4 * dim, 1]}>
          <spriteMaterial map={glowTexture(1.4)} color="#140803" transparent opacity={0.85 * dim} blending={THREE.NormalBlending} depthWrite={false} />
        </sprite>
      </ThreeCanvas>
      <Compare t={t} a={P(ch, 3) - 0.3} b={P(ch, 4) - 0.1} />
      <div style={{position: 'absolute', right: 170, bottom: 190, opacity: win(t, dimA + 0.6, E(ch, 5) + 0.4, 0.6), fontFamily: mono, fontSize: 24, letterSpacing: 4, color: '#ffb08a', textAlign: 'right'}}>
        BRILLO {Math.round(100 - dim * 62)} %
        <div style={{width: 360, height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 6, marginTop: 10, marginLeft: 'auto'}}>
          <div style={{width: `${100 - dim * 62}%`, height: 6, borderRadius: 6, background: '#ff8a5c'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
