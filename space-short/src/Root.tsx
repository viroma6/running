import {Composition} from 'remotion';
import {Short, totalFrames} from './Short';

export const RemotionRoot: React.FC = () => (
  <Composition id="UniversoEn1Minuto" component={Short} width={1080} height={1920} fps={30} durationInFrames={totalFrames(30)} />
);
