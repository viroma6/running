import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Phrase, display, sans} from '../theme';

/** Tarjetas de datos que aparecen sincronizadas con la voz (máx. 3 visibles) */
export const Facts: React.FC<{phrases: Phrase[]; accent: string; top?: number}> = ({phrases, accent, top = 470}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const items = phrases.filter((p) => p.callout).map((p) => ({start: p.start, v: p.callout![0], l: p.callout![1]}));
  const shown = items.filter((i) => t >= i.start - 0.1);
  const visible = shown.slice(-3);
  return (
    <div style={{position: 'absolute', left: 140, top, display: 'flex', flexDirection: 'column', gap: 22}}>
      {visible.map((it, idx) => {
        const p = spring({frame: frame - (it.start - 0.1) * fps, fps, config: {damping: 14, stiffness: 140}});
        const isLast = idx === visible.length - 1;
        return (
          <div
            key={it.start}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              padding: '18px 34px 18px 26px',
              borderRadius: 24,
              background: C.panel,
              border: `2px solid ${isLast ? accent + '88' : C.line}`,
              boxShadow: isLast ? `0 0 50px ${accent}33` : 'none',
              opacity: p * (isLast ? 1 : 0.62),
              translate: `${interpolate(p, [0, 1], [-120, 0])}px 0px`,
              scale: String(isLast ? interpolate(p, [0, 1], [0.9, 1]) : 0.92),
              transformOrigin: 'left center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{width: 8, alignSelf: 'stretch', borderRadius: 99, background: accent}} />
            <div>
              <div style={{fontFamily: display, fontWeight: 800, fontSize: isLast ? 84 : 60, lineHeight: 1, color: accent, letterSpacing: -2}}>{it.v}</div>
              <div style={{fontFamily: sans, fontWeight: 600, fontSize: 30, color: C.dim, marginTop: 6}}>{it.l}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
