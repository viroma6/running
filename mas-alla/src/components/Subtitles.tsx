import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Phrase, sans} from '../theme';

/** Divide una frase en trozos de ≤ maxChars y les reparte el tiempo */
export const chunkPhrases = (phrases: Phrase[], maxChars = 62) => {
  const out: {text: string; start: number; end: number}[] = [];
  for (const p of phrases) {
    const words = p.text.split(' ');
    const chunks: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) {
        chunks.push(cur.trim());
        cur = w;
      } else cur += ' ' + w;
    }
    if (cur.trim()) chunks.push(cur.trim());
    const total = chunks.reduce((a, c) => a + c.length, 0);
    let t = p.start;
    for (const c of chunks) {
      const d = ((p.end - p.start) * c.length) / total;
      out.push({text: c, start: t, end: t + d});
      t += d;
    }
  }
  return out;
};

export const Subtitles: React.FC<{phrases: Phrase[]}> = ({phrases}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = chunkPhrases(phrases);
  const cur = chunks.find((c) => t >= c.start && t < c.end + 0.25);
  if (!cur) return null;
  const o = interpolate(t, [cur.start, cur.start + 0.12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: sans, fontWeight: 600, fontSize: 40, color: '#fff', background: 'rgba(3,5,14,0.62)', padding: '12px 30px', borderRadius: 16, maxWidth: 1500, textAlign: 'center', lineHeight: 1.3, backdropFilter: 'blur(6px)'}}>
        {cur.text}
      </div>
    </div>
  );
};
