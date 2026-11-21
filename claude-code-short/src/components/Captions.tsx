import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pop} from '../anim';
import {C, Word, sans} from '../theme';

const HIGHLIGHT = /^(claude|code|5|plan|verificar|impacto|claude\.md|error|\/clear|\/compact|limpio|--worktree|3|guarda|sígueme|ia|shift\+tab|poder|creadores|tests|anthropic|brillantes|paralelo)/i;

/** Subtítulos karaoke: páginas de ≤3 palabras, palabra activa resaltada con pop */
export const Captions: React.FC<{words: Word[]; top?: number}> = ({words, top = 1300}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // Agrupa en páginas por frase, máx 3 palabras
  const pages: Word[][] = [];
  words.forEach((w, i) => {
    const last = pages[pages.length - 1];
    if (!last || last.length >= 3 || last[0].phrase !== w.phrase || i === 0) pages.push([w]);
    else last.push(w);
  });
  const idx = pages.findIndex((p, i) => t >= p[0].start - 0.05 && (i === pages.length - 1 || t < pages[i + 1][0].start - 0.05));
  if (idx < 0) return null;
  const page = pages[idx];
  const pageStart = page[0].start - 0.05;
  const lastEnd = page[page.length - 1].end;
  if (idx === pages.length - 1 && t > lastEnd + 0.6) return null;
  const enter = pop(frame, fps, pageStart, 14);

  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0px',
        fontFamily: sans,
        fontWeight: 900,
        fontSize: 92,
        lineHeight: 1.12,
        textTransform: 'uppercase',
        letterSpacing: -1,
        scale: String(interpolate(enter, [0, 1], [0.85, 1])),
        opacity: enter,
      }}
    >
      {page.map((w, i) => {
        const active = t >= w.start - 0.03;
        const current = active && t < w.end;
        const hl = HIGHLIGHT.test(w.text);
        const wp = pop(frame, fps, w.start - 0.03, 10);
        return (
          <span
            key={i}
            style={{
              color: active ? (hl ? C.orangeHi : C.text) : 'rgba(247,241,234,0.35)',
              scale: String(current ? interpolate(wp, [0, 1], [1, 1.08]) : 1),
              translate: `0px ${current ? interpolate(wp, [0, 1], [0, -6]) : 0}px`,
              textShadow: '0 6px 0 rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.7)',
              WebkitTextStroke: '3px rgba(0,0,0,0.35)',
              paintOrder: 'stroke fill',
              display: 'inline-block',
              margin: '0 14px',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
