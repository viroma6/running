import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {interpolate, staticFile, useVideoConfig} from 'remotion';
import {Cta} from './scenes/Cta';
import {F1} from './scenes/F1';
import {F2} from './scenes/F2';
import {F3} from './scenes/F3';
import {F4} from './scenes/F4';
import {Hook} from './scenes/Hook';
import {sceneFrames} from './theme';

export const TRANSITION = 8;
const ORDER = ['hook', 'f1', 'f2', 'f3', 'f4', 'cta'] as const;
export const totalFrames = (fps: number) => ORDER.reduce((a, id) => a + sceneFrames(id, fps), 0) - TRANSITION * (ORDER.length - 1);

export const Short: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const tr = linearTiming({durationInFrames: TRANSITION});
  return (
    <>
      <TransitionSeries name="Escenas">
        <TransitionSeries.Sequence name="Gancho · Sol" durationInFrames={sceneFrames('hook', fps)}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={tr} />
        <TransitionSeries.Sequence name="Dato 1 · Venus" durationInFrames={sceneFrames('f1', fps)}>
          <F1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={tr} />
        <TransitionSeries.Sequence name="Dato 2 · Sol" durationInFrames={sceneFrames('f2', fps)}>
          <F2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="Dato 3 · Neutrones" durationInFrames={sceneFrames('f3', fps)}>
          <F3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={tr} />
        <TransitionSeries.Sequence name="Dato 4 · Luna" durationInFrames={sceneFrames('f4', fps)}>
          <F4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={tr} />
        <TransitionSeries.Sequence name="CTA" durationInFrames={sceneFrames('cta', fps)}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Música"
        src={staticFile('audio/music.wav')}
        volume={(f) => interpolate(f, [0, 10, durationInFrames - 45, durationInFrames], [0.0, 0.2, 0.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
    </>
  );
};
