import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {interpolate, staticFile, useVideoConfig} from 'remotion';
import {Chapter} from './scenes/Chapter';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {chapter, frames} from './theme';

export const FADE = 12;
const IDS = ['intro', 'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'beyond', 'outro'];
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
      <TransitionSeries name="Capítulos">
        <TransitionSeries.Sequence name="Intro" durationInFrames={d('intro')}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="01 · El Sol" durationInFrames={d('sun')}>
          <Chapter id="sun" no={1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="02 · Mercurio" durationInFrames={d('mercury')}>
          <Chapter id="mercury" no={2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="03 · Venus" durationInFrames={d('venus')}>
          <Chapter id="venus" no={3} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="04 · La Tierra" durationInFrames={d('earth')}>
          <Chapter id="earth" no={4} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="05 · Marte" durationInFrames={d('mars')}>
          <Chapter id="mars" no={5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="06 · Júpiter" durationInFrames={d('jupiter')}>
          <Chapter id="jupiter" no={6} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="07 · Saturno" durationInFrames={d('saturn')}>
          <Chapter id="saturn" no={7} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="08 · Urano" durationInFrames={d('uranus')}>
          <Chapter id="uranus" no={8} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="09 · Neptuno" durationInFrames={d('neptune')}>
          <Chapter id="neptune" no={9} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tr} />
        <TransitionSeries.Sequence name="10 · Más allá" durationInFrames={d('beyond')}>
          <Chapter id="beyond" no={10} />
        </TransitionSeries.Sequence>
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
