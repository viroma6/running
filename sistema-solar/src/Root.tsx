import {Composition, Folder, Still} from 'remotion';
import {Chapter} from './scenes/Chapter';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {Thumbnail} from './Thumbnail';
import {totalFrames, Video} from './Video';
import {chapter, frames} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ViajeSistemaSolar" component={Video} width={1920} height={1080} fps={30} durationInFrames={totalFrames(30)} />
    <Still id="Miniatura" component={Thumbnail} width={1280} height={720} />
    <Folder name="Capitulos">
      <Composition id="Intro" component={Intro} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('intro').duration, 30)} />
      <Composition id="Saturno" component={Chapter} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('saturn').duration, 30)} defaultProps={{id: 'saturn', no: 7}} />
      <Composition id="Tierra" component={Chapter} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('earth').duration, 30)} defaultProps={{id: 'earth', no: 4}} />
      <Composition id="Outro" component={Outro} width={1920} height={1080} fps={30} durationInFrames={frames(chapter('outro').duration, 30)} />
    </Folder>
  </>
);
