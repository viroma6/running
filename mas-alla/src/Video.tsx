import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Fragment} from 'react';
import {interpolate, staticFile, useVideoConfig} from 'remotion';
import {Chapter} from './scenes/Chapter';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {STOPS} from './stops';
import {chapter, frames} from './theme';

export const FADE = 12;
export const IDS = ['intro', ...STOPS.map((s) => s.id), 'outro'];
export const totalFrames = (fps: number) => IDS.reduce((a, id) => a + frames(chapter(id).duration, fps), 0) - FADE * (IDS.length - 1);
/** Inicio (en segundos) de cada capítulo en el vídeo final, para los capítulos de YouTube */
export const chapterStarts = (fps: number) => {
  let f = 0;
  return IDS.map((id) => {
    const s = f / fps;
    f += frames(chapter(id).duration, fps) - FADE;
    return {id, start: s};
  });
};

export const Video: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const tr = linearTiming({durationInFrames: FADE});
  const d = (id: string) => frames(chapter(id).duration, fps);
  return (
    <>
      <TransitionSeries name="Paradas">
        <TransitionSeries.Sequence name="Intro" durationInFrames={d('intro')}>
          <Intro />
        </TransitionSeries.Sequence>
        {STOPS.map((s, i) => (
          <Fragment key={s.id}>
            <TransitionSeries.Transition presentation={fade()} timing={tr} />
            <TransitionSeries.Sequence name={`${String(i + 1).padStart(2, '0')} · ${s.name}`} durationInFrames={d(s.id)}>
              <Chapter id={s.id} />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={d('outro')}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Banda sonora"
        src={staticFile('audio/music.mp3')}
        volume={(f) => interpolate(f, [0, 20, durationInFrames - 60, durationInFrames], [0, 0.32, 0.32, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
    </>
  );
};
