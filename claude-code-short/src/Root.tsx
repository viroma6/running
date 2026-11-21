import {Composition, Folder} from 'remotion';
import {Cta} from './scenes/Cta';
import {Hook} from './scenes/Hook';
import {Short, totalFrames} from './Short';
import {sceneFrames} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ClaudeCodeTips" component={Short} width={1080} height={1920} fps={30} durationInFrames={totalFrames(30)} />
    <Folder name="Escenas">
      <Composition id="Hook" component={Hook} width={1080} height={1920} fps={30} durationInFrames={sceneFrames('hook', 30)} />
      <Composition id="Cta" component={Cta} width={1080} height={1920} fps={30} durationInFrames={sceneFrames('cta', 30)} />
    </Folder>
  </>
);
