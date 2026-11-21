import {Composition, Folder, Still} from 'remotion';
import {Chapter} from './scenes/Chapter';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {STOPS} from './stops';
import {Thumbnail} from './Thumbnail';
import {totalFrames, Video} from './Video';
import {chapter, frames} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MasAllaDelSistemaSolar" component={Video} width={1920} height={1080} fps={30} durationInFrames={totalFrames(30)} />
    <Still id="Miniatura" component={Thumbnail} width={1280} height={720} />
    <Folder name="Paradas">
      <Composition id="Intro" component={Intro} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('intro').duration, 30)} />
      {STOPS.map((s) => (
        <Composition key={s.id} id={`p-${s.id}`} component={Chapter} width={1920} height={1080} fps={30} durationInFrames={frames(chapter(s.id).duration, 30)} defaultProps={{id: s.id}} />
      ))}
      <Composition id="Outro" component={Outro} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('outro').duration, 30)} />
    </Folder>
  </>
);
