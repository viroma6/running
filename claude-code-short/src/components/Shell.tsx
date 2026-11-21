import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, SceneId, scene} from '../theme';
import {Background} from './Background';
import {Captions} from './Captions';

/** Fondo + locución + subtítulos de una escena. `shakeAt` = segundos con sacudida de cámara */
export const Shell: React.FC<{
  id: SceneId;
  children: React.ReactNode;
  accent?: string;
  captionsTop?: number;
  shakeAt?: number[];
}> = ({id, children, accent = C.orange, captionsTop = 1330, shakeAt = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = scene(id);
  let dx = 0;
  let dy = 0;
  for (const sec of shakeAt) {
    const f = frame - sec * fps;
    if (f >= 0 && f < 12) {
      const k = interpolate(f, [0, 12], [1, 0]);
      dx += Math.sin(f * 2.7) * 18 * k;
      dy += Math.cos(f * 3.3) * 14 * k;
    }
  }
  // zoom lento continuo (sensación de cámara viva)
  const zoom = interpolate(frame, [0, s.duration * fps], [1, 1.04]);
  return (
    <AbsoluteFill>
      <Background accent={accent} />
      <AbsoluteFill style={{translate: `${dx}px ${dy}px`, scale: String(zoom)}}>{children}</AbsoluteFill>
      <Captions words={s.words} top={captionsTop} />
      <Audio name={`Voz ${id}`} src={staticFile(`audio/${id}.wav`)} />
    </AbsoluteFill>
  );
};

/** Efecto de sonido colocado en un segundo concreto de la escena */
export const Sfx: React.FC<{src: string; atSec: number; volume?: number}> = ({src, atSec, volume = 0.6}) => {
  const {fps} = useVideoConfig();
  return <Audio name={`SFX ${src}`} src={staticFile(`audio/${src}.wav`)} from={Math.max(0, Math.round(atSec * fps))} volume={volume} />;
};
