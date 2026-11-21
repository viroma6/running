import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {interpolate, staticFile, useVideoConfig} from 'remotion';
import {Cta} from './scenes/Cta';
import {Hook} from './scenes/Hook';
import {Tip1} from './scenes/Tip1';
import {Tip2} from './scenes/Tip2';
import {Tip3} from './scenes/Tip3';
import {Tip4} from './scenes/Tip4';
import {Tip5} from './scenes/Tip5';
import {sceneFrames} from './theme';

export const TRANSITION = 8;
const ORDER = ['hook', 'tip1', 'tip2', 'tip3', 'tip4', 'tip5', 'cta'] as const;
export const totalFrames = (fps: number) => ORDER.reduce((a, id) => a + sceneFrames(id, fps), 0) - TRANSITION * (ORDER.length - 1);

export const Short: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const tr = linearTiming({durationInFrames: TRANSITION});
  return (
    <>
      <TransitionSeries name="Escenas">
        <TransitionSeries.Sequence name="Gancho" durationInFrames={sceneFrames('hook', fps)}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={tr} />
        <TransitionSeries.Sequence name="Truco 1 · Modo plan" durationInFrames={sceneFrames('tip1', fps)}>
          <Tip1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={tr} />
        <TransitionSeries.Sequence name="Truco 2 · Verificar" durationInFrames={sceneFrames('tip2', fps)}>
          <Tip2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-bottom-left'})} timing={tr} />
        <TransitionSeries.Sequence name="Truco 3 · CLAUDE.md" durationInFrames={sceneFrames('tip3', fps)}>
          <Tip3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={tr} />
        <TransitionSeries.Sequence name="Truco 4 · Contexto" durationInFrames={sceneFrames('tip4', fps)}>
          <Tip4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-top-right'})} timing={tr} />
        <TransitionSeries.Sequence name="Truco 5 · Paralelo" durationInFrames={sceneFrames('tip5', fps)}>
          <Tip5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={tr} />
        <TransitionSeries.Sequence name="CTA" durationInFrames={sceneFrames('cta', fps)}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Música"
        src={staticFile('audio/music.wav')}
        volume={(f) =>
          interpolate(f, [0, 10, durationInFrames - 45, durationInFrames], [0.0, 0.14, 0.14, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
    </>
  );
};
