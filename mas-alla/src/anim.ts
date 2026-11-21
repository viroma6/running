import {Easing, interpolate, spring} from 'remotion';

export const pop = (frame: number, fps: number, delaySec = 0, damping = 12) =>
  spring({frame: frame - delaySec * fps, fps, config: {damping, stiffness: 160, mass: 0.7}});

export const ease = (frame: number, range: [number, number], out: [number, number] = [0, 1]) =>
  interpolate(frame, range, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
